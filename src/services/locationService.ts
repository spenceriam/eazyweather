import type { Coordinates } from '../types/weather';

export async function getBrowserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        timeout: 10000,
        maximumAge: 600000
      }
    );
  });
}

export async function geocodeLocation(query: string): Promise<Coordinates> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'EazyWeather/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('Location not found');
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Unable to find location. Please try a different search.');
  }
}

export function saveLocation(coords: Coordinates, displayName?: string): void {
  localStorage.setItem('eazyweather_location', JSON.stringify({
    coordinates: coords,
    displayName,
    timestamp: Date.now()
  }));
}

export function getSavedLocation(): { coordinates: Coordinates; displayName?: string } | null {
  try {
    const saved = localStorage.getItem('eazyweather_location');
    if (!saved) return null;

    const data = JSON.parse(saved);
    const age = Date.now() - data.timestamp;

    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('eazyweather_location');
      return null;
    }

    return {
      coordinates: data.coordinates,
      displayName: data.displayName
    };
  } catch {
    return null;
  }
}
