import { useState } from "react";
import {
  geocodeLocationMultiple,
  getZipFormatError,
  type LocationResult,
} from "../services/locationService";

interface WelcomeCardProps {
  /** remember reflects the card's "Remember my location on this device" toggle. */
  onLocationSelect: (location: LocationResult, remember: boolean) => void;
  onRequestGps: (remember: boolean) => void;
  onSkip: (remember: boolean) => void;
}

function CookieIcon({ size = 16, color = "var(--mut)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }}>
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5Z" />
      <circle cx={8.5} cy={8.5} r={0.8} fill={color} stroke="none" />
      <circle cx={16} cy={15.5} r={0.8} fill={color} stroke="none" />
      <circle cx={8.5} cy={15} r={0.8} fill={color} stroke="none" />
      <circle cx={12} cy={12} r={0.8} fill={color} stroke="none" />
    </svg>
  );
}

/**
 * First-visit overlay per the design: mark + title, search, GPS, skip, and a
 * "Remember my location on this device" toggle that doubles as the cookie
 * consent decision (on = allow the settings cookie, off = session only).
 * Weather for the default location is already rendered behind this card.
 */
export function WelcomeCard({ onLocationSelect, onRequestGps, onSkip }: WelcomeCardProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [remember, setRemember] = useState(true);

  async function handleQueryChange(value: string) {
    setQuery(value);
    setError(null);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const zipError = getZipFormatError(trimmed);
    if (zipError) {
      setError(zipError);
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const found = await geocodeLocationMultiple(trimmed);
      if (found.length === 0) {
        setError("No matches — try a ZIP code or “city, state”.");
        setResults([]);
      } else {
        setResults(found.slice(0, 5));
      }
    } catch {
      setError("No matches — try a ZIP code or “city, state”.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(20,27,32,.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-[400px] max-w-full bg-surface border border-panelbrd rounded-card overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,.4)" }}
      >
        <div className="pt-[22px] px-6 flex items-center gap-3.5">
          <img src="/mark_black.png" alt="Zae" className="h-[46px] w-auto dark:hidden" />
          <img src="/mark_white.png" alt="Zae" className="h-[46px] w-auto hidden dark:block" />
          <div>
            <div className="text-[17px] font-bold text-ink">Welcome to EazyWeather</div>
            <div className="text-[12.5px] text-mut2 mt-0.5">Set your location to personalize your forecast.</div>
          </div>
        </div>

        <div className="pt-[18px] px-6 pb-[22px]">
          <div className="relative mb-2.5">
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--mut)" strokeWidth={2.2} strokeLinecap="round" className="absolute left-[13px] top-1/2 -translate-y-1/2">
              <circle cx={11} cy={11} r={7} />
              <line x1={16.5} y1={16.5} x2={21} y2={21} />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => void handleQueryChange(e.target.value)}
              placeholder={'City, state, or ZIP — “Austin, TX” or 78701'}
              className="w-full box-border h-11 border-[1.5px] border-panelbrd rounded-control pl-[38px] pr-3 text-[13.5px] text-ink2 bg-surface outline-none placeholder:text-mut"
              autoFocus
              autoComplete="off"
            />
          </div>

          {results.length > 0 && (
            <div className="border border-hair rounded-control mb-2.5 overflow-hidden max-h-44 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={`${result.displayName}-${index}`}
                  type="button"
                  onClick={() => onLocationSelect(result, remember)}
                  className={`w-full text-left px-3 py-[9px] cursor-pointer hover:bg-panel ${index > 0 ? "border-t border-hair" : ""}`}
                >
                  <div className="text-[13px] font-semibold text-ink2 truncate">{result.displayName}</div>
                </button>
              ))}
            </div>
          )}

          {(error || isSearching) && (
            <div className="mb-2.5 px-3 py-[9px] border border-dashed border-panelbrd rounded-control text-xs text-mut">
              {isSearching ? "Searching…" : error}
            </div>
          )}

          <button
            type="button"
            onClick={() => onRequestGps(remember)}
            className="w-full h-11 flex items-center justify-center gap-[9px] bg-brand text-brandink rounded-control text-sm font-[650] cursor-pointer hover:bg-brand2 transition-colors"
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx={12} cy={12} r={6.5} />
              <circle cx={12} cy={12} r={1.6} fill="currentColor" stroke="none" />
              <line x1={12} y1={2.5} x2={12} y2={5.5} />
              <line x1={12} y1={18.5} x2={12} y2={21.5} />
              <line x1={2.5} y1={12} x2={5.5} y2={12} />
              <line x1={18.5} y1={12} x2={21.5} y2={12} />
            </svg>
            Use my current location
          </button>

          <button
            type="button"
            onClick={() => onSkip(remember)}
            className="w-full h-10 mt-2 bg-transparent rounded-control text-[13px] font-semibold text-link cursor-pointer"
          >
            Skip — show me Chicago →
          </button>

          <div className="flex items-start gap-[11px] mt-4 pt-4 border-t border-hair">
            <CookieIcon />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-ink2">Remember my location on this device</div>
              <div className="text-[11.5px] leading-[1.55] text-mut mt-0.5">
                {remember ? "Your location stays on this device." : "We'll ask for a location each visit."}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={remember}
              aria-label="Remember my location"
              onClick={() => setRemember((v) => !v)}
              className="relative flex-none w-10 h-6 rounded-full cursor-pointer transition-colors"
              style={{ background: remember ? "var(--brand)" : "var(--barbg)" }}
            >
              <span
                className="absolute top-[2.5px] w-[19px] h-[19px] rounded-full bg-white transition-all"
                style={{ left: remember ? "18.5px" : "2.5px", boxShadow: "0 1px 2px rgba(0,0,0,.25)" }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
