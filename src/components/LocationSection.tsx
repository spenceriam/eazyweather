import { useState, useEffect } from "react";
import { MapPin, Search, Clock, X } from "lucide-react";
import {
  reverseGeocode,
  geocodeLocation,
  getBrowserLocation,
  saveLocation,
  saveLocationToHistory,
  getLocationHistory,
  type LocationResult,
} from "../services/locationService";
import type { Coordinates } from "../types/weather";

interface LocationSectionProps {
  coordinates: Coordinates | null;
  locationName: string;
  onLocationUpdate: (location: LocationResult) => void;
  forceShowSearch?: boolean;
}

export function LocationSection({
  locationName,
  onLocationUpdate,
  forceShowSearch = false,
}: LocationSectionProps) {
  const [isSearching, setIsSearching] = useState(forceShowSearch);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<LocationResult[]>([]);

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getLocationHistory());
  }, []);

  // Handle forceShowSearch prop changes
  useEffect(() => {
    if (forceShowSearch && !isSearching) {
      setIsSearching(true);
    }
  }, [forceShowSearch, isSearching]);

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const locationResult = await geocodeLocation(searchQuery);
      handleLocationSuccess(locationResult);
      setSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find location");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUseCurrentLocation() {
    setIsLoading(true);
    setError(null);

    try {
      const coords = await getBrowserLocation();
      const locationResult = await reverseGeocode(coords);
      handleLocationSuccess(locationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get location");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLocationSuccess(locationResult: LocationResult) {
    onLocationUpdate(locationResult);
    saveLocation(locationResult);
    saveLocationToHistory(locationResult);
    setSearchHistory(getLocationHistory());
    setIsSearching(false);
  }

  function handleHistoryClick(location: LocationResult) {
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

  return (
    <section id="location" className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Current Location Display */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {locationName}
              </h2>
            </div>
          </div>

          {/* Search Controls */}
          {!isSearching ? (
            <button
              onClick={() => setIsSearching(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              Change Location
            </button>
          ) : (
            <div className="flex-1 lg:max-w-md">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter city, state or country (e.g., New York, NY)"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Searching..." : "Search"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use Current
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearching(false);
                      setSearchQuery("");
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Recent Searches
                    </span>
                  </div>
                  <div className="space-y-2">
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
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </section>
  );
}
