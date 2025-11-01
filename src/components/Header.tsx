import { useRef, useState } from "react";
import { MapPin, Settings } from "lucide-react";
import { LocationDropdown } from "./LocationDropdown";
import type { Coordinates } from "../types/weather";
import type { LocationResult } from "../services/locationService";

interface HeaderProps {
  locationName: string;
  coordinates: Coordinates | null;
  onLocationUpdate: (location: LocationResult) => void;
}

export function Header({ locationName, coordinates, onLocationUpdate }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const gearButtonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

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
      .catch((error) => {
        // Handle error silently (e.g., user hasn't interacted with page yet)
        console.log("Audio play prevented:", error);
        isPlayingRef.current = false;
      });

    // Reset playing flag when audio ends
    audioRef.current.onended = () => {
      isPlayingRef.current = false;
    };
  };

  return (
    <header
      className="shadow-sm border-b border-gray-200 sticky top-0 z-10"
      style={{ backgroundColor: "#f9f6ee" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col gap-3">
          {/* Desktop: 3-column layout (Logo | Location | Nav) */}
          <div className="hidden md:grid md:grid-cols-3 md:items-center md:gap-4">
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
              <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">
                {locationName}
              </span>
              <button
                ref={gearButtonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-1.5 text-gray-600 hover:text-brand hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                aria-label="Change location"
                title="Change location"
              >
                <Settings className="w-4 h-4" />
              </button>
              <LocationDropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                coordinates={coordinates}
                onLocationUpdate={onLocationUpdate}
                anchorEl={gearButtonRef.current}
              />
            </div>

            {/* Nav - Right */}
            <nav className="flex gap-2 justify-end">
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

          {/* Mobile: Stacked layout */}
          <div className="md:hidden flex flex-col gap-3">
            {/* Logo - Centered */}
            <div className="flex items-center justify-center">
              <img
                src="/assets/logo.png"
                alt="EazyWeather Logo"
                className="h-14 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
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

            {/* Location - Centered */}
            <div className="flex items-center justify-center gap-2 relative">
              <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                {locationName}
              </span>
              <button
                ref={gearButtonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-1.5 text-gray-600 hover:text-brand hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                aria-label="Change location"
                title="Change location"
              >
                <Settings className="w-4 h-4" />
              </button>
              <LocationDropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                coordinates={coordinates}
                onLocationUpdate={onLocationUpdate}
                anchorEl={gearButtonRef.current}
              />
            </div>

            {/* Nav - Grid */}
            <nav className="grid grid-cols-4 gap-2">
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
