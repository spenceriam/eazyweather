import { useEffect, useRef, useState } from "react";
import { Clock, Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import {
  geocodeLocationMultiple,
  getZipFormatError,
  saveLocationToHistory,
  getLocationHistory,
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
const NO_MATCHES_MESSAGE = "No matches — try a ZIP code or a city, state.";

function buildContextLine(location: LocationResult): string {
  const { city, state, country } = location;
  if (city && state && country) return `${city}, ${state}, ${country}`;
  if (city && state) return `${city}, ${state}`;
  if (city && country) return `${city}, ${country}`;
  if (state && country) return `${state}, ${country}`;
  return country || state || "";
}

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

  // Load recent searches + manual-pin state once on mount.
  useEffect(() => {
    setHistory(getLocationHistory());
    setIsPinned(hasManualPin());
  }, []);

  // Escape closes the panel.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on outside click (small delay so the click that opened the panel
  // doesn't immediately close it again).
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
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
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setResults([]);
      setSearchError(
        looksNumeric
          ? err instanceof Error
            ? err.message
            : "Unable to find that ZIP code."
          : NO_MATCHES_MESSAGE,
      );
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

  function handleHistorySelect(entry: LocationResult) {
    onLocationSelect(entry);
    onClose();
  }

  function removeHistoryEntry(entry: LocationResult, event: React.MouseEvent) {
    event.stopPropagation();
    const updated = history.filter((loc) => loc.displayName !== entry.displayName);
    setHistory(updated);
    localStorage.setItem("eazyweather_location_history", JSON.stringify(updated));
  }

  function handleClearPin() {
    clearManualPin();
    setIsPinned(false);
    onClose();
  }

  return (
    <div
      ref={panelRef}
      className={`absolute top-full right-0 mt-2 w-full md:w-[420px] max-h-[70vh] overflow-y-auto bg-surface border border-line rounded-card shadow-card z-50 ${className}`}
    >
      <div className="p-4 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mut pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, state, or ZIP code"
            autoFocus
            autoComplete="off"
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-panel border border-line rounded-control text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-link"
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mut animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mut hover:text-ink"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {searchError && <p className="text-xs text-warnink">{searchError}</p>}

        {results.length > 0 && (
          <ul className="border border-line rounded-control divide-y divide-hair overflow-hidden max-h-48 overflow-y-auto">
            {results.map((result, index) => {
              const context = buildContextLine(result);
              return (
                <li key={`${result.displayName}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left px-3 py-2 hover:bg-chip transition-colors focus:outline-none focus:bg-chip"
                  >
                    <div className="text-sm font-medium text-ink truncate">
                      {result.displayName}
                    </div>
                    {context && <div className="text-xs text-mut truncate">{context}</div>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* GPS trigger — actual geolocation request is owned by the caller */}
        <button
          type="button"
          onClick={onRequestGps}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-brand text-brandink rounded-control hover:bg-brand-dark transition-colors"
        >
          <Crosshair className="w-4 h-4" />
          Use my current location
        </button>

        {isPinned && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-control bg-chip">
            <div className="flex items-center gap-2 text-sm text-ink2 min-w-0">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: "#E8862E" }} />
              <span className="truncate">Pinned location active</span>
            </div>
            <button
              type="button"
              onClick={handleClearPin}
              className="text-xs font-semibold text-link hover:underline whitespace-nowrap"
            >
              Clear pinned location
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-mut">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-[0.06em]">Recent</span>
            </div>
            <ul className="space-y-1">
              {history.map((entry, index) => (
                <li
                  key={`${entry.displayName}-${index}`}
                  className="group flex items-center justify-between gap-1 rounded-control hover:bg-chip transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleHistorySelect(entry)}
                    className="flex-1 min-w-0 text-left px-3 py-2 text-sm text-ink2 truncate"
                  >
                    {entry.displayName}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => removeHistoryEntry(entry, e)}
                    className="p-1.5 mr-1 rounded-control text-mut opacity-0 group-hover:opacity-100 hover:text-warnink transition-all"
                    aria-label={`Remove ${entry.displayName} from recent searches`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
