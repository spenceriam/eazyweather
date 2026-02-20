import { useRef, useState } from "react";
import { MapPin, Settings, Sun, Moon, Monitor } from "lucide-react";
import { LocationDropdown } from "./LocationDropdown";
import type { Coordinates } from "../types/weather";
import type { LocationResult } from "../services/locationService";
import type { ThemeMode } from "../utils/themeUtils";

interface HeaderProps {
  locationName: string;
  coordinates: Coordinates | null;
  onLocationUpdate: (location: LocationResult) => void;
  themeMode: ThemeMode;
  onThemeToggle: () => void;
  onThemeSettingsOpen: () => void;
}

export function Header({
  locationName,
  coordinates,
  onLocationUpdate,
  themeMode,
  onThemeToggle,
  onThemeSettingsOpen,
}: HeaderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const ThemeIcon = themeMode === "dark" ? Moon : themeMode === "light" ? Sun : Monitor;

  const navItems = [
    { id: "current", label: "Current" },
    { id: "hourly", label: "Hourly" },
    { id: "forecast", label: "7-Day" },
    { id: "monthly", label: "Monthly" },
  ];

  const handleLogoClick = () => {
    // Prevent spam - only play if not currently playing
    if (isPlayingRef.current) {
      return;
    }

    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio("/assets/quack.mp3");
      audioRef.current.volume = 0.5; // Set volume to 50%
    }

    // Reset audio to beginning if it was played before
    audioRef.current.currentTime = 0;

    // Mark as playing
    isPlayingRef.current = true;

    // Play the sound
    audioRef.current
      .play()
      .then(() => {
        // Successfully started playing
      })
      .catch(() => {
        // Handle error silently (e.g., user hasn't interacted with page yet)
        isPlayingRef.current = false;
      });

    // Reset playing flag when audio ends
    audioRef.current.onended = () => {
      isPlayingRef.current = false;
    };
  };

  return (
    <header
      className="shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 bg-brand-cream dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Desktop: 3-column layout */}
        <div className="hidden md:grid md:grid-cols-3 md:items-center gap-4">
          {/* Logo - Left */}
          <div className="flex items-center justify-start">
            <img
              src="/assets/logo.png"
              alt="EazyWeather Logo"
              className="h-12 lg:h-14 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleLogoClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleLogoClick();
                }
              }}
            />
          </div>

          {/* Location - Center */}
          <div className="flex items-center justify-center gap-2 relative">
            <MapPin className="w-5 h-5 text-brand flex-shrink-0" />
            <span className="text-gray-800 font-medium truncate max-w-[300px]" title={locationName}>
              {locationName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="p-1.5 hover:bg-brand-lighter rounded-md transition-colors flex-shrink-0"
              aria-label="Change location"
            >
              <Settings className="w-5 h-5 text-brand" />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <LocationDropdown
                coordinates={coordinates}
                onLocationUpdate={(location) => {
                  onLocationUpdate(location);
                  setIsDropdownOpen(false);
                }}
                onClose={() => setIsDropdownOpen(false)}
              />
            )}
          </div>

          {/* Nav - Right */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={onThemeToggle}
                className="px-3 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-dark transition-colors flex items-center gap-2"
                aria-label="Toggle theme mode"
                title={`Theme: ${themeMode}`}
              >
                <ThemeIcon className="w-4 h-4" />
                Theme
              </button>
              <button
                onClick={onThemeSettingsOpen}
                className="px-3 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-dark transition-colors flex items-center gap-2"
                aria-label="Open theme settings"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <nav className="flex gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-dark transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Mobile: Multi-row layout (Option A) */}
        <div className="md:hidden space-y-3">
          {/* Row 1: Logo + Location + Gear */}
          <div className="flex items-center justify-between gap-2">
            <img
              src="/assets/logo.png"
              alt="EazyWeather Logo"
              className="h-10 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
              onClick={handleLogoClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleLogoClick();
                }
              }}
            />
            <div className="flex items-center gap-2 flex-1 min-w-0 relative">
              <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
              <span className="text-sm text-gray-800 font-medium truncate" title={locationName}>
                {locationName}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="p-1.5 hover:bg-brand-lighter rounded-md transition-colors flex-shrink-0"
                aria-label="Change location"
              >
                <Settings className="w-5 h-5 text-brand" />
              </button>

              {/* Dropdown for mobile */}
              {isDropdownOpen && (
                <LocationDropdown
                  coordinates={coordinates}
                  onLocationUpdate={(location) => {
                    onLocationUpdate(location);
                    setIsDropdownOpen(false);
                  }}
                  onClose={() => setIsDropdownOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Row 2: Nav buttons */}
          <div className="grid grid-cols-6 gap-2">
            <button
              onClick={onThemeToggle}
              className="px-2 py-2 bg-brand text-white rounded-md text-xs font-medium hover:bg-brand-dark transition-colors text-center flex items-center justify-center gap-1"
              aria-label="Toggle theme mode"
            >
              <ThemeIcon className="w-3.5 h-3.5" />
              Theme
            </button>
            <button
              onClick={onThemeSettingsOpen}
              className="px-2 py-2 bg-brand text-white rounded-md text-xs font-medium hover:bg-brand-dark transition-colors text-center flex items-center justify-center gap-1"
              aria-label="Open theme settings"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <nav className="contents">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="px-2 py-2 bg-brand text-white rounded-md text-xs font-medium hover:bg-brand-dark transition-colors text-center"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
