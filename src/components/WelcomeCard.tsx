import { useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import {
  geocodeLocationMultiple,
  getZipFormatError,
  type LocationResult,
} from "../services/locationService";

interface WelcomeCardProps {
  onLocationSelect: (location: LocationResult) => void;
  onRequestGps: () => void;
  onSkip: () => void;
}

/**
 * First-visit overlay (F12). Weather for the default location is already
 * rendered behind this card by the caller — this never blocks first paint.
 * No consent toggle lives here; that's the separate ConsentBanner.
 */
export function WelcomeCard({ onLocationSelect, onRequestGps, onSkip }: WelcomeCardProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LocationResult[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const zipError = getZipFormatError(trimmed);
    if (zipError) {
      setError(zipError);
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const found = await geocodeLocationMultiple(trimmed);
      if (found.length === 0) {
        setError("No matches — try a ZIP code or a city, state.");
        setResults([]);
      } else if (found.length === 1) {
        onLocationSelect(found[0]);
      } else {
        setResults(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed — try again.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-line rounded-card shadow-card p-6">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <img src="/mark_black.png" alt="" className="h-12 w-12 dark:hidden" />
          <img src="/mark_white.png" alt="" className="h-12 w-12 hidden dark:block" />
          <div>
            <h2 className="text-lg font-semibold text-ink">Welcome to EazyWeather</h2>
            <p className="text-sm text-mut mt-1">
              Set your location to personalize your forecast.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
              placeholder="City, state, or ZIP code"
              className="w-full pl-3 pr-9 py-2.5 text-sm bg-panel border border-line rounded-control text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-link"
              autoFocus
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setError(null);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mut hover:text-ink"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mut pointer-events-none" />
            )}
          </div>

          {error && <p className="text-xs text-warnink">{error}</p>}

          {results.length > 0 && (
            <div className="border border-line rounded-control max-h-40 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onLocationSelect(result)}
                  className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-chip border-b border-hair last:border-b-0"
                >
                  {result.displayName}
                </button>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="w-full py-2.5 text-sm font-semibold bg-panel border border-line rounded-control text-ink hover:bg-chip transition-colors disabled:opacity-50"
          >
            {isSearching ? "Searching…" : "Search"}
          </button>
        </form>

        <button
          type="button"
          onClick={onRequestGps}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-brand text-brandink rounded-control hover:bg-brand2 transition-colors"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          Use my current location
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full mt-3 py-1.5 text-sm text-link hover:underline"
        >
          Skip — show me Chicago
        </button>
      </div>
    </div>
  );
}
