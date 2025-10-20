import { useState } from 'react';
import { MapPin, Edit2 } from 'lucide-react';
import { geocodeLocation, getBrowserLocation, saveLocation } from '../services/locationService';
import type { Coordinates } from '../types/weather';

interface LocationSectionProps {
  coordinates: Coordinates | null;
  locationName: string;
  onLocationUpdate: (coordinates: Coordinates, name: string) => void;
}

export function LocationSection({ coordinates, locationName, onLocationUpdate }: LocationSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLocationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const coords = await geocodeLocation(searchQuery);
      onLocationUpdate(coords, searchQuery);
      saveLocation(coords, searchQuery);
      setIsEditing(false);
      setSearchQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find location');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUseCurrentLocation() {
    setIsLoading(true);
    setError(null);

    try {
      const coords = await getBrowserLocation();
      onLocationUpdate(coords, 'Your Location');
      saveLocation(coords, 'Your Location');
      setIsEditing(false);
      setSearchQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section id="location" className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-500" />
            {isEditing ? (
              <form onSubmit={handleLocationSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter city or ZIP code"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use Current
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSearchQuery('');
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">{locationName}</h2>
                {coordinates && (
                  <span className="text-sm text-gray-500">
                    {coordinates.latitude.toFixed(2)}°, {coordinates.longitude.toFixed(2)}°
                  </span>
                )}
              </div>
            )}
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Change Location
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={scrollToTop}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back to Top
        </button>
      </div>
    </section>
  );
}
