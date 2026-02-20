import { useState, useEffect, useRef } from "react";
import { Clock, Monitor, Moon, Sun, X } from "lucide-react";
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
import { getCommonTimezoneOptions } from "../utils/timezoneUtils";
import { resolveThemeMode, type ThemeMode } from "../utils/themeUtils";

interface LocationDropdownProps {
  coordinates: Coordinates | null;
  onLocationUpdate: (location: LocationResult) => void;
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onClose: () => void;
}

export function LocationDropdown({
  coordinates,
  onLocationUpdate,
  selectedTimezone,
  onTimezoneChange,
  themeMode,
  onThemeChange,
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
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [pendingGPSCoordinates, setPendingGPSCoordinates] = useState<Coordinates | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const commonTimezones = getCommonTimezoneOptions();
  const isDarkMode = resolveThemeMode(themeMode) === "dark";

  // Load search history and check for manual pin on mount
  useEffect(() => {
    setSearchHistory(getLocationHistory());
    const manualPinActive = hasManualPin();
    setIsManualPin(manualPinActive);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't act if the dropdown is hidden (e.g. mobile view when desktop is active)
      if (!dropdownRef.current?.offsetParent) {
        return;
      }

      // Don't close if modal is open - let modal handle its own state
      if (showPinModal) {
        return;
      }

      const target = event.target as Node;

      // Don't close if clicking inside dropdown
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }

      // Close if clicking outside
      onClose();
    }

    // Close on ESC key
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    // Small delay to prevent immediate close on open
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose, showPinModal]);

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

    // If selecting a new location, clear any existing manual pin
    if (hasManualPin()) {
      clearManualPin();
      setIsManualPin(false);
    }

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
        onClick={(e) => {
          // Stop propagation to prevent document listener from firing
          // This ensures clicks inside the dropdown (including "Clear Pin" which removes itself)
          // do not trigger the close action.
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        className={`absolute top-full right-0 mt-2 w-full md:w-[500px] rounded-lg shadow-xl border z-50 max-h-[600px] overflow-y-auto ${
          isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        }`}
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
                className={`w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm ${
                  isDarkMode
                    ? "settings-search-input bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                disabled={isLoading}
                autoFocus
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Results */}
            {showSearchResults && (
              <div
                className={`space-y-1 max-h-48 overflow-y-auto border rounded-lg ${
                  isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
                }`}
              >
                {searchResults.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultSelect(location)}
                    className={`w-full text-left p-3 transition-colors border-b last:border-b-0 focus:outline-none focus:ring-2 focus:ring-brand text-sm ${
                      isDarkMode
                        ? "hover:bg-gray-800 border-gray-800"
                        : "hover:bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className={isDarkMode ? "font-medium text-gray-100" : "font-medium text-gray-900"}>
                      {location.displayName}
                    </div>
                    <div className={isDarkMode ? "text-xs text-gray-400" : "text-xs text-gray-500"}>
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

            {/* Timezone (under action buttons) */}
            <div className={`space-y-2 border-t pt-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className={isDarkMode ? "text-xs text-gray-400" : "text-xs text-gray-500"}>
                Current timezone:{" "}
                <span className={isDarkMode ? "font-medium text-gray-200" : "font-medium text-gray-700"}>{selectedTimezone}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTimezonePicker((value) => !value)}
                className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                {showTimezonePicker ? "Hide Timezone List" : "Change Timezone"}
              </button>
              {showTimezonePicker && (
                <select
                  value={selectedTimezone}
                  onChange={(e) => onTimezoneChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-gray-100"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  aria-label="Select timezone"
                >
                  {commonTimezones.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Theme (under timezone settings) */}
            <div className={`space-y-2 border-t pt-3 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className={isDarkMode ? "text-xs text-gray-400" : "text-xs text-gray-500"}>
                Current theme:{" "}
                <span className={isDarkMode ? "font-medium text-gray-200 capitalize" : "font-medium text-gray-700 capitalize"}>{themeMode}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowThemePicker((value) => !value)}
                className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                {showThemePicker ? "Hide Theme Options" : "Change Theme"}
              </button>
              {showThemePicker && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onThemeChange("light")}
                    className={`px-2 py-2 rounded-md border text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors ${
                      themeMode === "light"
                        ? "bg-brand text-white border-brand"
                        : isDarkMode
                          ? "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    aria-label="Use light theme"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange("dark")}
                    className={`px-2 py-2 rounded-md border text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors ${
                      themeMode === "dark"
                        ? "bg-brand text-white border-brand"
                        : isDarkMode
                          ? "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    aria-label="Use dark theme"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange("system")}
                    className={`px-2 py-2 rounded-md border text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors ${
                      themeMode === "system"
                        ? "bg-brand text-white border-brand"
                        : isDarkMode
                          ? "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    aria-label="Use system theme"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    System
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className={`p-3 border rounded-md ${isDarkMode ? "bg-red-950/30 border-red-900" : "bg-red-50 border-red-200"}`}>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className={`w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                <span className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                  Recent Searches
                </span>
              </div>
              <div className="space-y-1">
                {searchHistory.map((location, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                      isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <button
                      onClick={() => handleHistoryClick(location)}
                      className={`flex-1 text-left text-sm ${isDarkMode ? "text-gray-200 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
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
        isDarkMode={isDarkMode}
      />
    </>
  );
}
