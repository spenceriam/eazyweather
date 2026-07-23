import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin, Settings } from "lucide-react";
import { usePrefs } from "../hooks/usePrefs";
import { getCommonTimezoneOptions } from "../utils/timezoneUtils";
import { LocationPanel } from "./LocationPanel";
import type { LocationResult } from "../services/locationService";
import type { ThemeMode } from "../types/prefs";

interface HeaderProps {
  locationName: string;
  isPinned: boolean;
  onLocationSelect: (location: LocationResult) => void;
  onRequestGps: () => void;
  onEnterEditMode: () => void;
  /** Bump this (e.g. from CoverageNotice's "Choose a US location") to force the location panel open. */
  openLocationPanelSignal?: number;
}

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function Header({
  locationName,
  isPinned,
  onLocationSelect,
  onRequestGps,
  onEnterEditMode,
  openLocationPanelSignal,
}: HeaderProps) {
  const { prefs, setTheme, setTimezone } = usePrefs();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isGearOpen, setIsGearOpen] = useState(false);

  useEffect(() => {
    if (openLocationPanelSignal !== undefined) {
      setIsLocationOpen(true);
    }
  }, [openLocationPanelSignal]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (isLocationOpen && locationRef.current && !locationRef.current.contains(target)) {
        setIsLocationOpen(false);
      }
      if (isGearOpen && gearRef.current && !gearRef.current.contains(target)) {
        setIsGearOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLocationOpen(false);
        setIsGearOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isLocationOpen, isGearOpen]);

  function handleLogoClick() {
    if (isPlayingRef.current) return;

    if (!audioRef.current) {
      audioRef.current = new Audio("/assets/quack.mp3");
      audioRef.current.volume = 0.5;
    }

    audioRef.current.currentTime = 0;
    isPlayingRef.current = true;

    audioRef.current
      .play()
      .then(() => {})
      .catch(() => {
        isPlayingRef.current = false;
      });

    audioRef.current.onended = () => {
      isPlayingRef.current = false;
    };
  }

  function handleLogoKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleLogoClick();
    }
  }

  function handleGpsRequest() {
    setIsLocationOpen(false);
    onRequestGps();
  }

  const timezones = getCommonTimezoneOptions();

  return (
    <header
      className="sticky top-0 z-30 border-b border-line bg-headbg"
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Logo: full wordmark on desktop, duck mark on mobile; white variants in dark mode */}
        <button
          type="button"
          onClick={handleLogoClick}
          onKeyDown={handleLogoKeyDown}
          className="flex-shrink-0 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-link"
          aria-label="EazyWeather logo — plays a quack sound"
        >
          <img
            src="/Eazy_Weather_Logo_Black-trans.png"
            alt="EazyWeather"
            className="hidden md:block h-9 w-auto object-contain dark:hidden"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/assets/logo.png";
            }}
          />
          <img
            src="/Eazy_Weather_Logo_White-trans.png"
            alt="EazyWeather"
            className="hidden md:dark:block h-9 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/assets/logo.png";
            }}
          />
          <img
            src="/mark_black.png"
            alt="EazyWeather"
            className="md:hidden h-9 w-9 object-contain dark:hidden"
          />
          <img
            src="/mark_white.png"
            alt="EazyWeather"
            className="md:hidden hidden dark:block h-9 w-9 object-contain"
          />
        </button>

        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          {prefs.consent === "denied" && (
            <span
              className="hidden sm:inline-flex items-center px-2 py-1 rounded-control border border-dashed border-line text-[11px] font-semibold text-mut"
              title="Cookies declined — your settings are kept only for this browser session and are not written to a cookie."
            >
              Session only
            </span>
          )}

          {/* Location button + panel */}
          <div className="relative" ref={locationRef}>
            <button
              type="button"
              onClick={() => {
                setIsGearOpen(false);
                setIsLocationOpen((v) => !v);
              }}
              className={`flex items-center gap-1.5 h-9 md:h-9 min-h-[44px] md:min-h-[36px] px-2.5 rounded-control transition-colors ${
                isLocationOpen ? "bg-chip" : "hover:bg-chip"
              }`}
              aria-label="Change location"
              aria-expanded={isLocationOpen}
            >
              <MapPin
                className="w-4 h-4 flex-shrink-0"
                style={{ color: isPinned ? "#E8862E" : "var(--link)" }}
              />
              <span
                className="text-sm font-medium text-ink truncate max-w-[110px] sm:max-w-[180px]"
                title={locationName}
              >
                {locationName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-mut flex-shrink-0" />
            </button>

            {isLocationOpen && (
              <LocationPanel
                onLocationSelect={(location) => {
                  onLocationSelect(location);
                  setIsLocationOpen(false);
                }}
                onRequestGps={handleGpsRequest}
                onClose={() => setIsLocationOpen(false)}
              />
            )}
          </div>

          {/* Gear / preferences button + panel */}
          <div className="relative" ref={gearRef}>
            <button
              type="button"
              onClick={() => {
                setIsLocationOpen(false);
                setIsGearOpen((v) => !v);
              }}
              className={`flex items-center justify-center h-9 w-9 min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] rounded-control transition-colors ${
                isGearOpen ? "bg-chip" : "hover:bg-chip"
              }`}
              aria-label="Preferences"
              aria-expanded={isGearOpen}
            >
              <Settings className="w-4 h-4 text-ink" />
            </button>

            {isGearOpen && (
              <div className="absolute top-full right-0 mt-2 w-[240px] bg-surface border border-line rounded-card shadow-card z-50 p-3 space-y-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-mut mb-2">
                    Theme
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTheme(opt.value)}
                        className={`text-xs font-medium py-1.5 rounded-control border transition-colors ${
                          prefs.theme === opt.value
                            ? "bg-brand text-brandink border-brand"
                            : "bg-panel border-line text-ink hover:bg-chip"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-mut mb-2">
                    Timezone
                  </div>
                  <select
                    value={prefs.timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full text-sm bg-panel border border-line rounded-control px-2 py-1.5 text-ink"
                    aria-label="Select timezone"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-mut mb-2">
                    Cards
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGearOpen(false);
                      onEnterEditMode();
                    }}
                    className="w-full text-sm font-semibold py-1.5 rounded-control border border-line text-ink hover:bg-chip transition-colors"
                  >
                    Edit cards
                  </button>
                </div>

                <p className="text-[11px] text-mut leading-snug border-t border-hair pt-2">
                  {prefs.consent === "denied"
                    ? "Settings are kept for this browser session only (cookies declined)."
                    : "Settings are saved to this browser."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
