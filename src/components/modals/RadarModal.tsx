import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { LocateFixed, Pause, Play } from "lucide-react";
import { Icon, type Map as LeafletMap } from "leaflet";
import type { Coordinates } from "../../types/weather";
import { Modal } from "../ui/Modal";

interface RadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: Coordinates | null;
}

interface RadarFrame {
  tileUrl: string;
  timestampUtcSeconds: number;
}

export function RadarModal({ isOpen, onClose, coordinates }: RadarModalProps) {
  const userCoords = useMemo(
    () => ({
      latitude: coordinates?.latitude ?? 41.8781,
      longitude: coordinates?.longitude ?? -87.6298,
    }),
    [coordinates?.latitude, coordinates?.longitude],
  );
  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);
  const [pinCoords, setPinCoords] = useState(userCoords);
  const [isRecentering, setIsRecentering] = useState(false);
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const activeRadarFrame = radarFrames[frameIndex] ?? null;
  const activeRadarTileUrl = activeRadarFrame?.tileUrl ?? null;

  useEffect(() => {
    let isMounted = true;
    async function loadRadarLayer() {
      try {
        const response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        if (!response.ok) return;
        const data = await response.json();
        const host: string = data?.host || "https://tilecache.rainviewer.com";
        const pastFrames = Array.isArray(data?.radar?.past) ? data.radar.past : [];
        if (!pastFrames.length || !isMounted) return;
        const recentFrames = pastFrames.slice(-8);
        const frames = recentFrames
          .filter(
            (frame: { path?: string; time?: number }) =>
              Boolean(frame.path) && typeof frame.time === "number",
          )
          .map((frame: { path: string; time: number }) => ({
            tileUrl: `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
            timestampUtcSeconds: frame.time,
          }));
        if (!frames.length || !isMounted) return;
        setRadarFrames(frames);
        setFrameIndex(frames.length - 1);
        setIsPlaying(frames.length > 1);
      } catch {
        // Keep base map even if radar overlay fetch fails.
      }
    }

    if (isOpen) {
      loadRadarLayer();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    setPinCoords(userCoords);
  }, [userCoords.latitude, userCoords.longitude]);

  useEffect(() => {
    if (!isOpen || !isPlaying || radarFrames.length <= 1) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % radarFrames.length);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, isPlaying, radarFrames.length]);

  useEffect(() => {
    if (!mapRef || !isOpen) return;
    mapRef.invalidateSize();
    mapRef.setView([pinCoords.latitude, pinCoords.longitude], mapRef.getZoom(), { animate: false });
  }, [mapRef, isOpen, pinCoords.latitude, pinCoords.longitude]);

  const userLocationIcon = useMemo(
    () =>
      new Icon({
        iconUrl:
          "data:image/svg+xml;base64," +
          btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#2563eb" opacity="0.18"/>
              <circle cx="12" cy="12" r="5" fill="#2563eb"/>
              <circle cx="12" cy="12" r="2" fill="#ffffff"/>
            </svg>
          `),
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    [],
  );

  async function handleRecenter() {
    if (!mapRef) return;
    setIsRecentering(true);

    const flyToCoords = (latitude: number, longitude: number) => {
      setPinCoords({ latitude, longitude });
      mapRef.invalidateSize();
      mapRef.setView([latitude, longitude], mapRef.getZoom(), { animate: true });
    };

    flyToCoords(userCoords.latitude, userCoords.longitude);

    if (navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            flyToCoords(position.coords.latitude, position.coords.longitude);
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 },
        );
      });
    }

    setIsRecentering(false);
  }

  const activeFrameLabel = useMemo(() => {
    if (!activeRadarFrame) {
      return "Radar: unavailable";
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ageMinutes = Math.max(0, Math.round((nowSeconds - activeRadarFrame.timestampUtcSeconds) / 60));
    const frameTime = new Date(activeRadarFrame.timestampUtcSeconds * 1000);
    const formattedTime = frameTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `Observed radar frame: ${ageMinutes} min ago (${formattedTime})`;
  }, [activeRadarFrame]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live Weather Radar">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Animated observed radar (past frames only), centered on your location.
        </p>
        <p className="text-xs text-gray-500">
          {activeFrameLabel}. This is not a future precipitation forecast.
        </p>
        <div className="w-full h-[65vh] min-h-[420px] rounded-md overflow-hidden border border-gray-200 bg-gray-100 relative">
          <MapContainer
            ref={setMapRef}
            center={[pinCoords.latitude, pinCoords.longitude]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {activeRadarTileUrl && (
              <TileLayer
                key={activeRadarTileUrl}
                url={activeRadarTileUrl}
                opacity={0.6}
                attribution='Radar: <a href="https://www.rainviewer.com">RainViewer</a>'
              />
            )}
            <Marker position={[pinCoords.latitude, pinCoords.longitude]} icon={userLocationIcon} />
          </MapContainer>

          <button
            onClick={() => radarFrames.length > 1 && setIsPlaying((value) => !value)}
            disabled={radarFrames.length <= 1}
            className="absolute top-3 left-3 z-[1000] bg-white/95 p-2 rounded-md shadow-md border border-gray-300 hover:bg-white transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isPlaying ? "Pause radar animation" : "Play radar animation"}
            title={
              radarFrames.length > 1
                ? isPlaying
                  ? "Pause animation"
                  : "Play animation"
                : "Animation unavailable (single frame)"
            }
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={handleRecenter}
            disabled={isRecentering}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            className="absolute top-3 right-3 z-[1000] bg-white/95 p-2 rounded-md shadow-md border border-gray-300 hover:bg-white transition-colors text-gray-700 disabled:opacity-70"
            aria-label="Recenter radar on your location"
            title="Recenter on your location"
          >
            <LocateFixed className={`w-4 h-4 ${isRecentering ? "animate-pulse" : ""}`} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
