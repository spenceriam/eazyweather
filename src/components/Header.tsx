import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefs } from "../hooks/usePrefs";
import { LocationPanel } from "./LocationPanel";
import type { LocationResult } from "../services/locationService";
import type { ThemeMode } from "../types/prefs";

interface HeaderProps {
  locationName: string;
  isPinned: boolean;
  isEditing: boolean;
  onLocationSelect: (location: LocationResult) => void;
  onRequestGps: () => void;
  onToggleEdit: () => void;
  /** Bump this (e.g. from CoverageNotice's "Choose a US location") to force the location panel open. */
  openLocationPanelSignal?: number;
}

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

function timezoneLabel(tz: string): string {
  try {
    const abbr = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    return abbr ? `${tz} (${abbr})` : tz;
  } catch {
    return tz;
  }
}

/** Ghost button treatment from the design: bordered at rest, tinted while its panel is open. */
function ghostStyle(isOpen: boolean, isDark: boolean): React.CSSProperties {
  return {
    border: `1px solid ${isOpen ? "transparent" : "var(--ghostbrd)"}`,
    background: isOpen
      ? isDark
        ? "rgba(127,178,217,.28)"
        : "rgba(62,113,143,.24)"
      : "var(--ghost)",
    borderRadius: "2px",
  };
}

export function Header({
  locationName,
  isPinned,
  isEditing,
  onLocationSelect,
  onRequestGps,
  onToggleEdit,
  openLocationPanelSignal,
}: HeaderProps) {
  const { prefs, resolvedTheme, setTheme, setTimezone } = usePrefs();
  const isDark = resolvedTheme === "dark";
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

  const timezoneOptions = useMemo(() => {
    const list = TIMEZONES.includes(prefs.timezone)
      ? TIMEZONES
      : [prefs.timezone, ...TIMEZONES];
    return list.map((tz) => ({ value: tz, label: timezoneLabel(tz) }));
  }, [prefs.timezone]);

  return (
    <header
      className="sticky top-0 z-50 bg-headbg border-b border-headline"
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div className="max-w-[1264px] mx-auto h-[54px] md:h-16 flex items-center gap-2 md:gap-3 px-3 md:px-12">
        {/* Single logo: duck mark on mobile, wordmark on desktop; white variants in dark mode.
            Wrapper spans (not per-img visibility classes) so the md/dark combinations can't
            ever show two logos at once. */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex-shrink-0 cursor-pointer rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-link"
          aria-label="EazyWeather — click for a quack"
        >
          <span className="hidden md:block">
            <img
              src="/Eazy_Weather_Logo_Black-trans.png"
              alt="EazyWeather"
              className="h-[34px] w-auto block dark:hidden"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/logo.png";
              }}
            />
            <img
              src="/Eazy_Weather_Logo_White-trans.png"
              alt="EazyWeather"
              className="h-[34px] w-auto hidden dark:block"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/logo.png";
              }}
            />
          </span>
          <span className="block md:hidden">
            <img src="/mark_black.png" alt="EazyWeather" className="h-[30px] w-auto block dark:hidden" />
            <img src="/mark_white.png" alt="EazyWeather" className="h-[30px] w-auto hidden dark:block" />
          </span>
        </button>

        <div className="flex-1" />

        {/* Location button + panel */}
        <div className="relative" ref={locationRef}>
          <button
            type="button"
            onClick={() => {
              setIsGearOpen(false);
              setIsLocationOpen((v) => !v);
            }}
            className="flex items-center gap-[7px] h-9 px-3 cursor-pointer"
            style={ghostStyle(isLocationOpen, isDark)}
            aria-label="Change location"
            aria-expanded={isLocationOpen}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={isPinned ? "#E8862E" : "var(--link)"} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx={12} cy={10} r={3} />
            </svg>
            <span className="text-[13px] font-semibold text-ink2 whitespace-nowrap max-w-[120px] sm:max-w-[180px] overflow-hidden text-ellipsis">
              {locationName}
            </span>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--mut)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {isLocationOpen && (
            <LocationPanel
              onLocationSelect={(location) => {
                onLocationSelect(location);
                setIsLocationOpen(false);
              }}
              onRequestGps={() => {
                setIsLocationOpen(false);
                onRequestGps();
              }}
              onClose={() => setIsLocationOpen(false)}
            />
          )}
        </div>

        {prefs.consent === "denied" && (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-[11px] border border-dashed border-ghostbrd rounded-control text-[11.5px] font-semibold text-soft whitespace-nowrap"
            title="Cookies declined — location and settings won't be remembered as cookies"
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx={12} cy={12} r={9} />
              <circle cx={9} cy={9} r={1.1} fill="currentColor" stroke="none" />
              <circle cx={14.5} cy={11} r={1.1} fill="currentColor" stroke="none" />
              <line x1={4.5} y1={19.5} x2={19.5} y2={4.5} strokeLinecap="round" />
            </svg>
            Session only
          </span>
        )}

        {/* Preferences */}
        <div className="relative" ref={gearRef}>
          <button
            type="button"
            onClick={() => {
              setIsLocationOpen(false);
              setIsGearOpen((v) => !v);
            }}
            className="w-9 h-9 flex items-center justify-center cursor-pointer"
            style={{ ...ghostStyle(isGearOpen, isDark), color: isGearOpen ? "var(--ink)" : "var(--soft)" }}
            aria-label="Preferences"
            aria-expanded={isGearOpen}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <line x1={4} y1={7} x2={20} y2={7} />
              <line x1={4} y1={12} x2={20} y2={12} />
              <line x1={4} y1={17} x2={20} y2={17} />
              <circle cx={15} cy={7} r={2.4} fill="var(--bg)" />
              <circle cx={9} cy={12} r={2.4} fill="var(--bg)" />
              <circle cx={13} cy={17} r={2.4} fill="var(--bg)" />
            </svg>
          </button>

          {isGearOpen && (
            <div
              className="absolute top-[calc(100%+8px)] right-0 w-60 bg-surface border border-panelbrd rounded-card z-[60] text-left px-4 py-3.5"
              style={{ boxShadow: "0 14px 34px rgba(0,0,0,.18)" }}
            >
              <div className="text-[10.5px] font-bold tracking-[0.06em] text-mut mb-2">THEME</div>
              <div className="flex border border-panelbrd rounded-control overflow-hidden">
                {THEME_OPTIONS.map((opt, index) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={`flex-1 h-[30px] text-xs font-semibold ${
                      index > 0 ? "border-l border-panelbrd" : ""
                    } ${prefs.theme === opt.value ? "bg-brand text-brandink" : "bg-surface text-soft"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="text-[10.5px] font-bold tracking-[0.06em] text-mut mt-3.5 mb-2 pt-3 border-t border-hair">
                TIMEZONE
              </div>
              <select
                value={prefs.timezone}
                onChange={(e) => setTimezone(e.target.value)}
                aria-label="Timezone"
                className="w-full h-[34px] border border-panelbrd rounded-control bg-surface text-ink2 text-[12.5px] px-2 outline-none"
              >
                {timezoneOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="text-[10.5px] font-bold tracking-[0.06em] text-mut mt-3.5 mb-2 pt-3 border-t border-hair">
                CARDS
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGearOpen(false);
                  onToggleEdit();
                }}
                className="w-full h-9 flex items-center justify-center gap-2 bg-brand text-brandink rounded-control text-[12.5px] font-[650] hover:bg-brand2 transition-colors"
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x={3} y={3} width={7.5} height={7.5} rx={1.5} />
                  <rect x={13.5} y={3} width={7.5} height={7.5} rx={1.5} />
                  <rect x={3} y={13.5} width={7.5} height={7.5} rx={1.5} />
                  <path d="M17.25 14v6.5M14 17.25h6.5" />
                </svg>
                {isEditing ? "Done" : "Edit cards"}
              </button>

              <div className="text-[11px] leading-[1.55] text-mut mt-3 pt-2.5 border-t border-hair">
                {prefs.consent === "denied"
                  ? "Cookies declined — settings fall back to local storage on this device and no cookies are written. Details in Privacy."
                  : "Theme, location, cards and layout are saved on this device — one cookie, no tracking."}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
