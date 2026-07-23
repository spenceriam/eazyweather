import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { Icon, type Map as LeafletMap } from "leaflet";
import { RadarTimeline } from "../RadarTimeline";
import { useIsDarkTheme } from "../../hooks/useIsDarkTheme";
import { useRadarFrames } from "../../hooks/useRadarFrames";
import { usePrefs } from "../../hooks/usePrefs";
import type { CardDataBag } from "../../types/cardData";

interface RadarCardProps {
  data: CardDataBag;
  /** Unused — kept for CardBodyProps compatibility with the card registry. */
  variant?: string;
}

const DEFAULT_COORDS = { latitude: 41.8781, longitude: -87.6298 };

const CARTO_ATTRIBUTION = "&copy; OpenStreetMap &copy; CARTO &middot; Radar &copy; RainViewer";

export function RadarCard({ data }: RadarCardProps) {
  const onExpand = data.onExpandRadar;
  const { prefs } = usePrefs();
  const radar = useRadarFrames(prefs.radarLoop);
  const isDark = useIsDarkTheme();

  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);

  const coords = data.coordinates ?? DEFAULT_COORDS;

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
            `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="${markerColor}" opacity="0.18"/>
              <circle cx="12" cy="12" r="5" fill="${markerColor}"/>
              <circle cx="12" cy="12" r="2" fill="#ffffff"/>
            </svg>`,
          ),
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [markerColor],
  );

  // Re-measure the map after mount and whenever the dashboard's column/span
  // controls resize this card — Leaflet caches its container size and won't
  // notice a layout-only resize on its own.
  useEffect(() => {
    if (!mapRef) return;
    mapRef.invalidateSize();
  }, [mapRef]);

  useEffect(() => {
    const el = mapWrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      mapRef?.invalidateSize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [mapRef]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={mapWrapperRef}
        className="relative w-full rounded-control overflow-hidden border border-line"
        style={{ height: 220 }}
      >
        <MapContainer
          ref={setMapRef}
          center={[coords.latitude, coords.longitude]}
          zoom={7}
          style={{ height: "220px", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer attribution={CARTO_ATTRIBUTION} url={basemapUrl} />
          {radar.activeFrame && (
            <TileLayer
              key={radar.activeFrame.url}
              url={radar.activeFrame.url}
              opacity={radarOpacity}
            />
          )}
          <Marker position={[coords.latitude, coords.longitude]} icon={locationIcon} />
        </MapContainer>
      </div>

      {radar.error && (
        <div className="flex items-center justify-between gap-2 text-xs text-mut bg-chip border border-line rounded-control px-2.5 py-1.5">
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

      <RadarTimeline
        frames={radar.frames}
        activeIndex={radar.activeIndex}
        nowIndex={radar.nowIndex}
        hasForecast={radar.hasForecast}
        ageMinutes={radar.ageMinutes}
        isPlaying={radar.isPlaying}
        onScrub={radar.scrubTo}
        onTogglePlay={() => (radar.isPlaying ? radar.pause() : radar.play())}
        timezone={data.timezone}
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-mut">
          {radar.activeFrame ? `Updated ${radar.ageMinutes} min ago` : "Radar unavailable"}
        </span>
        <button
          type="button"
          onClick={() => onExpand?.()}
          className="text-xs font-semibold text-link hover:underline"
        >
          Expand
        </button>
      </div>
    </div>
  );
}
