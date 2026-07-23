import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { ArrowLeft, LocateFixed } from "lucide-react";
import { Icon, type Map as LeafletMap } from "leaflet";
import { RadarTimeline } from "./RadarTimeline";
import { useIsDarkTheme } from "../hooks/useIsDarkTheme";
import { useRadarFrames } from "../hooks/useRadarFrames";
import { usePrefs } from "../hooks/usePrefs";
import type { Coordinates } from "../types/weather";

interface RadarFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: Coordinates | null;
  timezone: string;
}

const DEFAULT_COORDS: Coordinates = { latitude: 41.8781, longitude: -87.6298 };

const CARTO_ATTRIBUTION = "&copy; OpenStreetMap &copy; CARTO &middot; Radar &copy; RainViewer";

/**
 * Full-screen expanded radar view. Note: hooks below (including
 * useRadarFrames' RainViewer fetch/poll) run whenever this component is
 * mounted, regardless of `isOpen` — the cheapest way to avoid fetching while
 * closed is for the parent to only mount RadarFullscreen while it's open,
 * rather than keeping it always-mounted and toggling isOpen.
 */
export function RadarFullscreen({ isOpen, onClose, coordinates, timezone }: RadarFullscreenProps) {
  const { prefs } = usePrefs();
  const radar = useRadarFrames(prefs.radarLoop);
  const isDark = useIsDarkTheme();

  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);
  const [isRecentering, setIsRecentering] = useState(false);

  const baseCoords = useMemo<Coordinates>(
    () => ({
      latitude: coordinates?.latitude ?? DEFAULT_COORDS.latitude,
      longitude: coordinates?.longitude ?? DEFAULT_COORDS.longitude,
    }),
    [coordinates?.latitude, coordinates?.longitude],
  );
  const [viewCoords, setViewCoords] = useState<Coordinates>(baseCoords);

  useEffect(() => {
    setViewCoords(baseCoords);
  }, [baseCoords]);

  useEffect(() => {
    if (!mapRef || !isOpen) return;
    mapRef.invalidateSize();
    mapRef.setView([viewCoords.latitude, viewCoords.longitude], mapRef.getZoom(), { animate: false });
    // Only re-sync on open/coords change — not on every viewCoords mutation from user panning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef, isOpen, baseCoords.latitude, baseCoords.longitude]);

  const basemapUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
  const radarOpacity = isDark ? 0.66 : 0.58;

  const markerColor = isDark ? "#7fb2d9" : "#3e718f";
  const locationIcon = useMemo(
    () =>
      new Icon({
        iconUrl:
          "data:image/svg+xml;base64," +
          btoa(
            `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="${markerColor}" opacity="0.18"/>
              <circle cx="12" cy="12" r="5" fill="${markerColor}"/>
              <circle cx="12" cy="12" r="2" fill="#ffffff"/>
            </svg>`,
          ),
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    [markerColor],
  );

  const handleRecenter = useCallback(async () => {
    if (!mapRef) return;
    setIsRecentering(true);

    const flyTo = (latitude: number, longitude: number) => {
      setViewCoords({ latitude, longitude });
      mapRef.invalidateSize();
      mapRef.setView([latitude, longitude], mapRef.getZoom(), { animate: true });
    };

    flyTo(baseCoords.latitude, baseCoords.longitude);

    if (navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            flyTo(position.coords.latitude, position.coords.longitude);
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 },
        );
      });
    }

    setIsRecentering(false);
  }, [mapRef, baseCoords.latitude, baseCoords.longitude]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-bg">
      <div className="absolute inset-0">
        <MapContainer
          ref={setMapRef}
          center={[viewCoords.latitude, viewCoords.longitude]}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer attribution={CARTO_ATTRIBUTION} url={basemapUrl} />
          {radar.activeFrame && (
            <TileLayer key={radar.activeFrame.url} url={radar.activeFrame.url} opacity={radarOpacity} />
          )}
          <Marker position={[viewCoords.latitude, viewCoords.longitude]} icon={locationIcon} />
        </MapContainer>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close radar"
        title="Close"
        className="absolute top-3 left-3 z-[1000] flex items-center justify-center min-h-[44px] min-w-[44px] rounded-control border border-line bg-surface/95 text-ink shadow-card hover:bg-chip transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => void handleRecenter()}
        disabled={isRecentering}
        aria-label="Recenter on your location"
        title="Recenter on your location"
        className="absolute top-3 right-3 z-[1000] flex items-center justify-center min-h-[44px] min-w-[44px] rounded-control border border-line bg-surface/95 text-ink shadow-card hover:bg-chip transition-colors disabled:opacity-70"
      >
        <LocateFixed className={`w-5 h-5 ${isRecentering ? "animate-pulse" : ""}`} />
      </button>

      {radar.error && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 text-xs text-mut bg-surface/95 border border-line rounded-control px-3 py-2 shadow-card">
          <span>Radar unavailable</span>
          <button
            type="button"
            onClick={radar.refresh}
            className="font-semibold text-link hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-[1000] bg-surface/95 border-t border-line px-4 pt-3 shadow-card
          sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-[min(92%,640px)] sm:rounded-card sm:border"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <RadarTimeline
          frames={radar.frames}
          activeIndex={radar.activeIndex}
          nowIndex={radar.nowIndex}
          hasForecast={radar.hasForecast}
          ageMinutes={radar.ageMinutes}
          isPlaying={radar.isPlaying}
          onScrub={radar.scrubTo}
          onTogglePlay={() => (radar.isPlaying ? radar.pause() : radar.play())}
          timezone={timezone}
        />
      </div>
    </div>
  );
}
