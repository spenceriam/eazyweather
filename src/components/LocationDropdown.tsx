import { useState, useEffect, useRef } from "react";
import { Search, Clock, X, Navigation } from "lucide-react";
import {
  geocodeLocationMultiple,
  getBrowserLocation,
  saveLocation,
  saveLocationToHistory,
  getLocationHistory,
  saveManualPin,
  clearManualPin,
  hasManualPin,
  type LocationResult,
} from "../services/locationService";
import type { Coordinates } from "../types/weather";
import { LocationPinModal } from "./LocationPinModal";

interface LocationDropdownProps {
  coordinates: Coordinates | null;
  onLocationUpdate: (location: LocationResult) => void;
  onClose: () => void;
}

export function LocationDropdown({
  coordinates,
  onLocationUpdate,
  onClose,
}: LocationDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<LocationResult[]>([]);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isManualPin, setIsManualPin] = useState(false);
  const [pendingGPSCoordinates, setPendingGPSCoordinates] = useState<Coordinates | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load search history and check for manual pin on mount
  useEffect(() => {
    setSearchHistory(getLocationHistory());
    const manualPinActive = hasManualPin();
    setIsManualPin(manualPinActive);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Close on ESC key
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose]);

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await geocodeLocationMultiple(searchQuery);
      if (results.length === 1) {
        // If only one result, select it automatically
        handleLocationSuccess(results[0]);
        setSearchQuery("");
      } else {
        // Show multiple results for selection
        setSearchResults(results);
        setShowSearchResults(true);
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find location");
      setShowSearchResults(false);
      setIsLoading(false);
    }
  }

  function handleLocationSuccess(locationResult: LocationResult) {
    setIsLoading(true);
    onLocationUpdate(locationResult);
    saveLocation(locationResult);
    saveLocationToHistory(locationResult);
    setSearchHistory(getLocationHistory());
    onClose();
  }

  function handleHistoryClick(location: LocationResult) {
    setIsLoading(true);
    handleLocationSuccess(location);
  }

  function removeFromHistory(locationToRemove: LocationResult) {
    const updatedHistory = searchHistory.filter(
      (loc) => loc.displayName !== locationToRemove.displayName,
    );
    setSearchHistory(updatedHistory);
    localStorage.setItem(
      "eazyweather_location_history",
      JSON.stringify(updatedHistory),
    );
  }

  function handleSearchResultSelect(locationResult: LocationResult) {
    setIsLoading(true);
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
    handleLocationSuccess(locationResult);
  }

  async function handleUseCurrentLocation() {
    setIsLoading(true);
    setError(null);
    setShowSearchResults(false);

    try {
      const coords = await getBrowserLocation();
      setPendingGPSCoordinates(coords);
      setShowPinModal(true);
      setIsLoading(false);
    } catch (err) {
      setError("Unable to get your location. Please search manually or allow location access.");
      setIsLoading(false);
    }
  }

  function handlePinLocation(coords: Coordinates, displayName: string) {
    const locationResult: LocationResult = {
      coordinates: coords,
      displayName,
      city: "",
      state: "",
      country: "",
    };

    saveManualPin(locationResult);
    saveLocation(locationResult);
    setIsManualPin(true);
    setIsLoading(true);
    setPendingGPSCoordinates(null);
    onLocationUpdate(locationResult);
    onClose();
  }

  function handleClosePinModal() {
    setShowPinModal(false);
    setPendingGPSCoordinates(null);
  }

  function handleClearManualPin() {
    clearManualPin();
    setIsManualPin(false);
  }

  function handleSearchClear() {
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
    setError(null);
  }

  return (
    <>
      <div
        ref={dropdownRef}
        className="absolute top-full right-0 mt-2 w-full md:w-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-y-auto"
      >
        <div className="p-4 space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter city, state, country, or ZIP code"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm"
                disabled={isLoading}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Results */}
            {showSearchResults && (
              <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {searchResults.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultSelect(location)}
                    className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:ring-2 focus:ring-brand text-sm"
                  >
                    <div className="font-medium text-gray-900">
                      {location.displayName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {location.city && location.state && location.country
                        ? `${location.city}, ${location.state}, ${location.country}`
                        : location.displayName}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="flex-1 px-3 py-2 bg-brand text-white rounded-md hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
              >
                Use My Location
              </button>
              {isManualPin && (
                <button
                  type="button"
                  onClick={handleClearManualPin}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                  title="Clear manual pin and use automatic location"
                >
                  Clear Pin
                </button>
              )}
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Recent Searches
                </span>
              </div>
              <div className="space-y-1">
                {searchHistory.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <button
                      onClick={() => handleHistoryClick(location)}
                      className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900"
                    >
                      {location.displayName}
                    </button>
                    <button
                      onClick={() => removeFromHistory(location)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location Pin Modal */}
      <LocationPinModal
        isOpen={showPinModal}
        onClose={handleClosePinModal}
        onLocationSelect={handlePinLocation}
        initialCoordinates={pendingGPSCoordinates || coordinates || undefined}
      />
    </>
  );
}
