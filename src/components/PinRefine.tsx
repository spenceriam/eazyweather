import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon, type Marker as LeafletMarker } from "leaflet";
import { Loader2, MapPin } from "lucide-react";
import { reverseGeocode } from "../services/locationService";
import { useIsDarkTheme } from "../hooks/useIsDarkTheme";
import type { Coordinates } from "../types/weather";

// Fixed accent for the pinned-location marker (Design.md section 1).
const PIN_COLOR = "#E8862E";

// Custom marker icon — same teardrop-pin glyph as the legacy LocationPinModal,
// recolored to the orange pinned-location accent instead of red.
function createPinIcon(): Icon {
  return new Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${PIN_COLOR}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

interface LatLngPosition {
  lat: number;
  lng: number;
}

interface DraggableOrangeMarkerProps {
  position: LatLngPosition;
  onPositionChange: (lat: number, lng: number) => void;
}

// Click-to-move + drag-to-move marker, mirroring the DraggableMarker pattern
// from the legacy LocationPinModal.
function DraggableOrangeMarker({ position, onPositionChange }: DraggableOrangeMarkerProps) {
  const markerRef = useRef<LeafletMarker>(null);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      draggable
      position={position}
      icon={createPinIcon()}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const latlng = marker.getLatLng();
            onPositionChange(latlng.lat, latlng.lng);
          }
        },
      }}
    />
  );
}

interface PinRefineProps {
  /** The GPS fix to center on. */
  initialCoordinates: Coordinates;
  /** Caller saves the manual pin + location + closes. */
  onConfirm: (coords: Coordinates, displayName: string) => void;
  onCancel: () => void;
}

export function PinRefine({ initialCoordinates, onConfirm, onCancel }: PinRefineProps) {
  const [position, setPosition] = useState<LatLngPosition>({
    lat: initialCoordinates.latitude,
    lng: initialCoordinates.longitude,
  });
  const [locationName, setLocationName] = useState("Locating…");
  const [isLoadingName, setIsLoadingName] = useState(true);
  const isDarkMode = useIsDarkTheme();

  // Reverse-geocode whenever the pin lands somewhere new (click or drag-end).
  useEffect(() => {
    let cancelled = false;
    setIsLoadingName(true);

    reverseGeocode({ latitude: position.lat, longitude: position.lng })
      .then((result) => {
        if (!cancelled) setLocationName(result.displayName);
      })
      .catch(() => {
        if (!cancelled) {
          setLocationName(`${position.lat.toFixed(4)}°, ${position.lng.toFixed(4)}°`);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingName(false);
      });

    return () => {
      cancelled = true;
    };
  }, [position.lat, position.lng]);

  function handlePositionChange(lat: number, lng: number) {
    setPosition({ lat, lng });
  }

  function handleConfirm() {
    onConfirm({ latitude: position.lat, longitude: position.lng }, locationName);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-mut">
        Drag the pin or tap the map to set your exact location.
      </p>

      <div className="relative isolate w-full h-[280px] sm:h-[340px] rounded-card overflow-hidden border border-line">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
          className={isDarkMode ? "pin-map-dark" : undefined}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className={isDarkMode ? "night-map-base" : undefined}
          />
          <DraggableOrangeMarker position={position} onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-panel border border-line rounded-control">
        <MapPin className="w-4 h-4 shrink-0" style={{ color: PIN_COLOR }} />
        <div className="min-w-0 flex-1">
          {isLoadingName ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-mut italic">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Locating…
            </span>
          ) : (
            <span className="block text-sm font-medium text-ink truncate">{locationName}</span>
          )}
          <span className="block text-xs text-mut tabular-nums">
            {position.lat.toFixed(4)}°, {position.lng.toFixed(4)}°
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-ink border border-line rounded-control bg-surface hover:bg-chip transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoadingName}
          className="px-4 py-2 text-sm font-semibold bg-brand text-brandink rounded-control hover:bg-brand2 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          Use this spot
        </button>
      </div>
    </div>
  );
}
