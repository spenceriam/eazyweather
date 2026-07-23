import { useEffect, useRef, useState } from "react";
import {
  geocodeLocationMultiple,
  getZipFormatError,
  saveLocationToHistory,
  getLocationHistory,
  removeLocationFromHistory,
  clearManualPin,
  hasManualPin,
  type LocationResult,
} from "../services/locationService";

interface LocationPanelProps {
  /** Caller handles setting coordinates/name and closing. */
  onLocationSelect: (location: LocationResult) => void;
  /** Caller owns the actual getBrowserLocation() call + permission overlay. */
  onRequestGps: () => void;
  onClose: () => void;
  className?: string;
}

const SEARCH_DEBOUNCE_MS = 300;
// Mirrors the "looks like an attempted ZIP" heuristic in locationService —
// digits/hyphens only — so we can gate the getZipFormatError() check without
// duplicating its internals.
const NUMERIC_LIKE_PATTERN = /^[\d-]+$/;
const NO_MATCHES_MESSAGE = "No matches — try a ZIP code or “city, state”.";

function buildContextLine(location: LocationResult): string {
  const { city, state, country } = location;
  if (city && state && country) return `${city}, ${state}, ${country}`;
  if (city && state) return `${city}, ${state}`;
  if (city && country) return `${city}, ${country}`;
  if (state && country) return `${state}, ${country}`;
  return country || state || "";
}

/** Anchored location panel per the design: search, results, GPS, clear-pin, RECENT. */
export function LocationPanel({
  onLocationSelect,
  onRequestGps,
  onClose,
  className = "",
}: LocationPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [history, setHistory] = useState<LocationResult[]>([]);
  const [isPinned, setIsPinned] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setHistory(getLocationHistory());
    setIsPinned(hasManualPin());
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on outside press. mousedown (not click) so a text-selection drag
  // that starts inside the search input and releases outside the panel
  // doesn't count as an outside click and slam the panel shut.
  useEffect(() => {
    function handlePressOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handlePressOutside);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handlePressOutside);
    };
  }, [onClose]);

  // Debounced search-as-you-type.
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      void runSearch(trimmed);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query]);

  async function runSearch(trimmed: string) {
    const requestId = ++requestIdRef.current;
    const looksNumeric = NUMERIC_LIKE_PATTERN.test(trimmed);

    if (looksNumeric) {
      const zipError = getZipFormatError(trimmed);
      if (zipError) {
        setResults([]);
        setSearchError(zipError);
        // This run supersedes any in-flight request (whose finally can no
        // longer reset the flag) — clear the spinner here or it sticks.
        setIsSearching(false);
        return;
      }
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const found = await geocodeLocationMultiple(trimmed);
      if (requestId !== requestIdRef.current) return;

      if (found.length === 0) {
        setResults([]);
        setSearchError(looksNumeric ? "No matches for that ZIP code." : NO_MATCHES_MESSAGE);
      } else {
        setResults(found);
      }
    } catch {
      if (requestId !== requestIdRef.current) return;
      setResults([]);
      setSearchError(NO_MATCHES_MESSAGE);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  }

  function handleSelectResult(result: LocationResult) {
    onLocationSelect(result);
    saveLocationToHistory(result);
    onClose();
  }

  function removeHistoryEntry(entry: LocationResult, event: React.MouseEvent) {
    event.stopPropagation();
    setHistory(removeLocationFromHistory(entry.displayName));
  }

  function handleClearPin() {
    clearManualPin();
    setIsPinned(false);
    onClose();
  }

  return (
    <div
      ref={panelRef}
      className={`absolute top-[calc(100%+8px)] right-0 max-md:right-auto max-md:left-1/2 max-md:-translate-x-[58%] w-[min(380px,calc(100vw-24px))] bg-surface border border-panelbrd rounded-card z-[60] text-left ${className}`}
      style={{ boxShadow: "0 14px 34px rgba(0,0,0,.18)" }}
    >
      <div className="px-4 pt-3.5 pb-3.5">
        <div className="relative">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--mut)" strokeWidth={2.2} strokeLinecap="round" className="absolute left-3 top-1/2 -translate-y-1/2">
            <circle cx={11} cy={11} r={7} />
            <line x1={16.5} y1={16.5} x2={21} y2={21} />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'City, state, or ZIP — try “Austin”'}
            autoFocus
            autoComplete="off"
            className="w-full box-border h-10 border-[1.5px] border-panelbrd rounded-control pl-9 pr-3 text-[13px] text-ink2 bg-surface outline-none placeholder:text-mut"
          />
        </div>

        {results.length > 0 && (
          <div className="border border-hair rounded-control mt-2 overflow-hidden max-h-56 overflow-y-auto">
            {results.map((result, index) => {
              const context = buildContextLine(result);
              return (
                <button
                  key={`${result.displayName}-${index}`}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className={`w-full text-left px-3 py-[9px] cursor-pointer hover:bg-panel ${index > 0 ? "border-t border-hair" : ""}`}
                >
                  <div className="text-[13px] font-semibold text-ink2 truncate">{result.displayName}</div>
                  {context && <div className="text-[11px] text-mut mt-px truncate">{context}</div>}
                </button>
              );
            })}
          </div>
        )}

        {(searchError || (isSearching && results.length === 0)) && (
          <div className="mt-2 px-3 py-[9px] border border-dashed border-panelbrd rounded-control text-xs text-mut">
            {isSearching ? "Searching…" : searchError}
          </div>
        )}

        <button
          type="button"
          onClick={onRequestGps}
          className="w-full h-10 mt-2.5 flex items-center justify-center gap-2 bg-brand text-brandink rounded-control text-[13px] font-[650] cursor-pointer hover:bg-brand2 transition-colors"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx={12} cy={12} r={6.5} />
            <circle cx={12} cy={12} r={1.6} fill="currentColor" stroke="none" />
            <line x1={12} y1={2.5} x2={12} y2={5.5} />
            <line x1={12} y1={18.5} x2={12} y2={21.5} />
            <line x1={2.5} y1={12} x2={5.5} y2={12} />
            <line x1={18.5} y1={12} x2={21.5} y2={12} />
          </svg>
          Use my current location
        </button>

        {isPinned && (
          <button
            type="button"
            onClick={handleClearPin}
            className="w-full h-9 mt-2 bg-transparent border border-panelbrd rounded-control text-[12.5px] font-semibold text-soft cursor-pointer hover:bg-panel transition-colors"
          >
            Clear manual pin
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div className="border-t border-hair px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.06em] text-mut mb-0.5">
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx={12} cy={12} r={9} />
              <path d="M12 7v5l3 2" />
            </svg>
            RECENT
          </div>
          {history.map((entry, index) => (
            <div
              key={`${entry.displayName}-${index}`}
              className="flex items-center gap-2 px-1 py-1.5 rounded-control hover:bg-panel"
            >
              <button
                type="button"
                onClick={() => {
                  onLocationSelect(entry);
                  onClose();
                }}
                className="flex-1 min-w-0 text-left text-[13px] text-ink2 truncate cursor-pointer"
              >
                {entry.displayName}
              </button>
              <button
                type="button"
                onClick={(e) => removeHistoryEntry(entry, e)}
                aria-label={`Remove ${entry.displayName} from recents`}
                className="w-[22px] h-[22px] flex items-center justify-center rounded-control text-mut hover:text-[#A33B24] cursor-pointer"
              >
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                  <line x1={6} y1={6} x2={18} y2={18} />
                  <line x1={18} y1={6} x2={6} y2={18} />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
