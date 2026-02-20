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
  isDarkMode?: boolean;
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
  isDarkMode = false,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h2 className={`text-xl font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>
              Refine Your Location
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}
            aria-label="Close"
          >
            <X className={`w-5 h-5 ${isDarkMode ? "text-slate-300" : "text-gray-600"}`} />
          </button>
        </div>

        {/* Instructions */}
        <div className={`p-4 border-b ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-blue-50 border-gray-200"}`}>
          <p className={`text-sm ${isDarkMode ? "text-slate-200" : "text-gray-700"}`}>
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
              className={isDarkMode ? "night-map-base" : undefined}
            />
            <DraggableMarker position={markerPosition} setPosition={setMarkerPosition} />
          </MapContainer>

          {/* Re-center Button (overlaid on map) */}
          <button
            onClick={handleCenterOnLocation}
            disabled={isGettingCurrentLocation}
            className={`absolute top-4 right-4 z-[1000] px-4 py-2 rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border ${
              isDarkMode
                ? "bg-slate-900/95 hover:bg-slate-800 text-slate-100 border-slate-600"
                : "bg-white hover:bg-gray-50 border-gray-300"
            }`}
          >
            {isGettingCurrentLocation ? (
              <Loader2 className={`w-4 h-4 animate-spin ${isDarkMode ? "text-slate-100" : "text-gray-700"}`} />
            ) : (
              <Crosshair className={`w-4 h-4 ${isDarkMode ? "text-slate-100" : "text-gray-700"}`} />
            )}
            <span className={`text-sm font-medium ${isDarkMode ? "text-slate-100" : "text-gray-700"}`}>Re-center Map</span>
          </button>
        </div>

        {/* Footer with location preview and actions */}
        <div className={`p-4 border-t space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
          {/* Location Preview */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className={`w-4 h-4 ${isDarkMode ? "text-slate-300" : "text-gray-500"}`} />
            <span className={isDarkMode ? "text-slate-300" : "text-gray-600"}>Pinned location:</span>
            {isLoadingLocation ? (
              <span className={`italic flex items-center gap-2 ${isDarkMode ? "text-slate-300" : "text-gray-500"}`}>
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </span>
            ) : (
              <span className={`font-medium ${isDarkMode ? "text-slate-100" : "text-gray-800"}`}>{locationName}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 border rounded-md transition-colors ${
                isDarkMode
                  ? "text-slate-200 bg-slate-800 border-slate-600 hover:bg-slate-700"
                  : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
              }`}
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
