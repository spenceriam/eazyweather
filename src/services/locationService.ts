import type { Coordinates } from "../types/weather";

export interface LocationResult {
  coordinates: Coordinates;
  displayName: string;
  city: string;
  state: string;
  country: string;
}

export async function getBrowserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    // Try multiple strategies for better compatibility
    const options = {
      enableHighAccuracy: false, // Start with lower accuracy for faster response
      timeout: 15000, // Increased timeout for better reliability
      maximumAge: 300000, // 5 minutes cache
    };

    // First attempt with standard settings
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.log("First location attempt failed:", error.message);

        // Second attempt with high accuracy enabled
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (secondError) => {
            console.log("Second location attempt failed:", secondError.message);

            // Final attempt with maximum timeout
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (finalError) => {
                let errorMessage = "Unable to get your location";

                switch (finalError.code) {
                  case 1: // PERMISSION_DENIED
                    errorMessage =
                      "Location access denied. Please enter your location manually.";
                    break;
                  case 2: // POSITION_UNAVAILABLE
                    errorMessage =
                      "Location information unavailable. Please enter your location manually.";
                    break;
                  case 3: // TIMEOUT
                    errorMessage =
                      "Location request timed out. Please enter your location manually.";
                    break;
                  default:
                    errorMessage =
                      "Location detection failed. Please enter your location manually.";
                }

                reject(new Error(errorMessage));
              },
              {
                enableHighAccuracy: true,
                timeout: 30000, // 30 seconds max timeout
                maximumAge: 0, // No cache for final attempt
              },
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 20000, // 20 seconds
            maximumAge: 60000, // 1 minute cache
          },
        );
      },
      options,
    );
  });
}

export async function reverseGeocode(
  coords: Coordinates,
): Promise<LocationResult> {
  try {
    console.log("Reverse geocoding coordinates:", coords);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "EazyWeather/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Reverse geocoding response:", data);

    if (!data || !data.address) {
      throw new Error("Invalid response format from geocoding service");
    }

    const address = data.address;

    const city =
      address.city || address.town || address.village || address.county || "";
    const state = address.state || address.province || "";
    const country = address.country || "";

    console.log("Parsed address:", { city, state, country });

    // Format display name based on location type
    let displayName = "";
    if (country === "United States" || country === "Canada") {
      displayName =
        city && state
          ? `${city}, ${state}`
          : city ||
            state ||
            `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`;
    } else {
      displayName =
        city && state
          ? `${city}, ${state}`
          : city ||
            country ||
            `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`;
    }

    console.log("Final display name:", displayName);

    return {
      coordinates: coords,
      displayName,
      city,
      state,
      country,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    // Return coordinates as fallback instead of "Your Location"
    return {
      coordinates: coords,
      displayName: `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`,
      city: "",
      state: "",
      country: "",
    };
  }
}

export async function geocodeLocation(query: string): Promise<LocationResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
      {
        headers: {
          "User-Agent": "EazyWeather/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error("Location not found");
    }

    const result = data[0];
    const address = result.address;
    const coords = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    const city = address.city || address.town || address.village || "";
    const state = address.state || address.province || "";
    const country = address.country || "";

    // Format display name based on location type
    let displayName = "";
    if (country === "United States" || country === "Canada") {
      displayName =
        city && state ? `${city}, ${state}` : city || state || query;
    } else {
      displayName =
        city && state ? `${city}, ${state}` : city || country || query;
    }

    return {
      coordinates: coords,
      displayName,
      city,
      state,
      country,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    throw new Error("Unable to find location. Please try a different search.");
  }
}

export function saveLocation(locationResult: LocationResult): void {
  localStorage.setItem(
    "eazyweather_location",
    JSON.stringify({
      ...locationResult,
      timestamp: Date.now(),
    }),
  );
}

export function getSavedLocation(): LocationResult | null {
  try {
    const saved = localStorage.getItem("eazyweather_location");
    if (!saved) return null;

    const data = JSON.parse(saved);
    const age = Date.now() - data.timestamp;

    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem("eazyweather_location");
      return null;
    }

    return {
      coordinates: data.coordinates,
      displayName: data.displayName,
      city: data.city,
      state: data.state,
      country: data.country,
    };
  } catch {
    return null;
  }
}

export function saveLocationToHistory(locationResult: LocationResult): void {
  try {
    const history = getLocationHistory();

    // Remove if already exists to avoid duplicates
    const filteredHistory = history.filter(
      (loc) => loc.displayName !== locationResult.displayName,
    );

    // Add to beginning and keep only last 4
    const newHistory = [locationResult, ...filteredHistory].slice(0, 4);

    localStorage.setItem(
      "eazyweather_location_history",
      JSON.stringify(newHistory),
    );
  } catch (error) {
    console.error("Error saving location history:", error);
  }
}

export function getLocationHistory(): LocationResult[] {
  try {
    const saved = localStorage.getItem("eazyweather_location_history");
    if (!saved) return [];

    const data = JSON.parse(saved);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
