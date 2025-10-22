import { MapPin } from "lucide-react";
import type { LocationResult } from "../services/locationService";

interface SearchResultsProps {
  results: LocationResult[];
  onSelect: (location: LocationResult) => void;
  isLoading: boolean;
}

export function SearchResults({
  results,
  onSelect,
  isLoading,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
        <span className="text-sm text-gray-500">Searching...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No locations found. Try a different search.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {results.map((location, index) => (
        <button
          key={index}
          onClick={() => onSelect(location)}
          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {location.displayName}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {getLocationDetails(location)}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function getLocationDetails(location: LocationResult): string {
  const parts: string[] = [];

  if (location.city) {
    parts.push(location.city);
  }

  if (location.state) {
    parts.push(location.state);
  }

  if (location.country) {
    parts.push(location.country);
  }

  // If display name is different from parts, show the breakdown
  const displayNameParts = location.displayName
    .split(", ")
    .map((p) => p.trim());
  const uniqueParts = parts.filter((p) => !displayNameParts.includes(p));

  if (uniqueParts.length > 0) {
    return `Also: ${uniqueParts.join(", ")}`;
  }

  // If no additional context, show a more descriptive label
  if (location.city && location.state && location.country) {
    return "Complete location information";
  } else if (location.city && location.country) {
    return "City and country";
  } else if (location.city) {
    return "City location";
  }

  return "Location details";
}
