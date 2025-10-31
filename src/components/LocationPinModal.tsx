import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import { X, MapPin, Loader2, Crosshair } from "lucide-react";
import { Coordinates } from "../types/weather";
import { reverseGeocode, getBrowserLocation } from "../services/locationService";

// Custom marker icon to avoid default icon issues
const createCustomIcon = () => {
  return new Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface LocationPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coordinates: Coordinates, displayName: string) => void;
  initialCoordinates?: Coordinates;
}

// Component to handle map click/drag events
function DraggableMarker({
  position,
  setPosition,
}: {
  position: LatLng;
  setPosition: (pos: LatLng) => void;
}) {
  const markerRef = useRef<any>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        setPosition(newPos);
      }
    },
  };

  // Handle map clicks to move marker
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={createCustomIcon()}
    />
  );
}

export function LocationPinModal({
  isOpen,
  onClose,
  onLocationSelect,
  initialCoordinates,
}: LocationPinModalProps) {
  const [mapCenter, setMapCenter] = useState<LatLng>(
    new LatLng(
      initialCoordinates?.latitude || 42.3084,
      initialCoordinates?.longitude || -88.2667
    )
  );
  const [markerPosition, setMarkerPosition] = useState<LatLng>(mapCenter);
  const [locationName, setLocationName] = useState<string>("Loading...");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  // Update location name when marker position changes
  useEffect(() => {
    const updateLocationName = async () => {
      setIsLoadingLocation(true);
      try {
        const coords: Coordinates = {
          latitude: markerPosition.lat,
          longitude: markerPosition.lng,
        };
        const result = await reverseGeocode(coords);
        setLocationName(result.displayName);
      } catch (error) {
        console.error("Error getting location name:", error);
        setLocationName(
          `${markerPosition.lat.toFixed(4)}°, ${markerPosition.lng.toFixed(4)}°`
        );
      } finally {
        setIsLoadingLocation(false);
      }
    };

    updateLocationName();
  }, [markerPosition]);

  // Initialize map center and marker when modal opens
  useEffect(() => {
    if (isOpen && initialCoordinates) {
      const newPos = new LatLng(
        initialCoordinates.latitude,
        initialCoordinates.longitude
      );
      setMapCenter(newPos);
      setMarkerPosition(newPos);
      // Force map re-render with new center
      setMapKey((prev) => prev + 1);
    }
  }, [isOpen, initialCoordinates]);

  const handleCenterOnLocation = async () => {
    setIsGettingCurrentLocation(true);
    try {
      const coords = await getBrowserLocation();
      const newPos = new LatLng(coords.latitude, coords.longitude);
      setMapCenter(newPos);
      setMarkerPosition(newPos);
      setMapKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error getting current location:", error);
      alert(
        "Unable to get your current location. Please ensure location permissions are enabled."
      );
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  const handleConfirm = () => {
    const coords: Coordinates = {
      latitude: markerPosition.lat,
      longitude: markerPosition.lng,
    };
    onLocationSelect(coords, locationName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">
              Refine Your Location
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <p className="text-sm text-gray-700">
            Drag the red pin or click anywhere on the map to set your exact location. This helps ensure accurate weather for your specific area.
          </p>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[250px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[380px] max-h-[500px]">
          <MapContainer
            key={mapKey}
            center={mapCenter}
            zoom={15}
            style={{ height: "100%", width: "100%", minHeight: "250px" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker position={markerPosition} setPosition={setMarkerPosition} />
          </MapContainer>

          {/* Re-center Button (overlaid on map) */}
          <button
            onClick={handleCenterOnLocation}
            disabled={isGettingCurrentLocation}
            className="absolute top-4 right-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-gray-300"
          >
            {isGettingCurrentLocation ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
            ) : (
              <Crosshair className="w-4 h-4 text-gray-700" />
            )}
            <span className="text-sm font-medium text-gray-700">Re-center Map</span>
          </button>
        </div>

        {/* Footer with location preview and actions */}
        <div className="p-4 border-t border-gray-200 space-y-4 bg-gray-50">
          {/* Location Preview */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Pinned location:</span>
            {isLoadingLocation ? (
              <span className="text-gray-500 italic flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </span>
            ) : (
              <span className="font-medium text-gray-800">{locationName}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoadingLocation}
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Confirm Pin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
