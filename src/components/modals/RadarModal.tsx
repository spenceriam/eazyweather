import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { Crosshair } from "lucide-react";
import { Icon, type Map as LeafletMap } from "leaflet";
import type { Coordinates } from "../../types/weather";
import { Modal } from "../ui/Modal";

interface RadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: Coordinates | null;
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
  const [currentCenter, setCurrentCenter] = useState(userCoords);
  const [isRecentering, setIsRecentering] = useState(false);
  const [radarTileUrl, setRadarTileUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadRadarLayer() {
      try {
        const response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        if (!response.ok) return;
        const data = await response.json();
        const host: string = data?.host || "https://tilecache.rainviewer.com";
        const latestPath: string | undefined = data?.radar?.past?.at(-1)?.path;
        if (!latestPath || !isMounted) return;
        setRadarTileUrl(`${host}${latestPath}/256/{z}/{x}/{y}/2/1_1.png`);
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
    setCurrentCenter(userCoords);
  }, [userCoords.latitude, userCoords.longitude]);

  useEffect(() => {
    if (!mapRef || !isOpen) return;
    mapRef.invalidateSize();
    mapRef.setView([currentCenter.latitude, currentCenter.longitude], mapRef.getZoom());
  }, [mapRef, isOpen, currentCenter.latitude, currentCenter.longitude]);

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
      setCurrentCenter({ latitude, longitude });
      mapRef.invalidateSize();
      mapRef.flyTo([latitude, longitude], mapRef.getZoom(), { duration: 0.5 });
    };

    if (!navigator.geolocation) {
      flyToCoords(userCoords.latitude, userCoords.longitude);
      setIsRecentering(false);
      return;
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          flyToCoords(position.coords.latitude, position.coords.longitude);
          resolve();
        },
        () => {
          flyToCoords(userCoords.latitude, userCoords.longitude);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 },
      );
    });

    setIsRecentering(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live Weather Radar">
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Interactive radar centered on your current location.
        </p>
        <div className="w-full h-[65vh] min-h-[420px] rounded-md overflow-hidden border border-gray-200 bg-gray-100 relative">
          <MapContainer
            center={[currentCenter.latitude, currentCenter.longitude]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            whenCreated={setMapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {radarTileUrl && (
              <TileLayer
                url={radarTileUrl}
                opacity={0.6}
                attribution='Radar: <a href="https://www.rainviewer.com">RainViewer</a>'
              />
            )}
            <Marker
              position={[currentCenter.latitude, currentCenter.longitude]}
              icon={userLocationIcon}
            />
          </MapContainer>

          <button
            onClick={handleRecenter}
            disabled={isRecentering}
            className="absolute top-3 right-3 z-[1000] bg-white/95 px-3 py-2 rounded-md shadow-md border border-gray-300 hover:bg-white transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
            aria-label="Recenter radar on your location"
          >
            <Crosshair className="w-4 h-4" />
            {isRecentering ? "Centering..." : "Center on Me"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
