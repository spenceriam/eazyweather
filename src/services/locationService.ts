import type { Coordinates } from "../types/weather";
import { setCookie, getCookie, eraseCookie, getCookieConsent } from "../utils/cookieUtils";

export interface LocationResult {
  coordinates: Coordinates;
  displayName: string;
  city: string;
  state: string;
  country: string;
}

// Storage configuration
const STORAGE_EXPIRATION_DAYS = 180;
const STORAGE_EXPIRATION_MS = STORAGE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

type PostalContext = {
  normalizedPostalCode: string;
  displayPostalCode: string;
  countryCodes?: string;
};

const LATAM_COUNTRY_CODES =
  "ar,bo,br,cl,co,cr,cu,do,ec,sv,gt,hn,mx,ni,pa,py,pe,uy,ve";

function normalizeUSZip(zip: string): string {
  const trimmed = zip.trim();
  if (trimmed.includes("-")) {
    return trimmed.split("-")[0];
  }
  return trimmed;
}

function normalizeCanadianPostalCode(postalCode: string): string {
  const compact = postalCode.toUpperCase().replace(/\s+/g, "");
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

function detectPostalContext(query: string): PostalContext | null {
  const trimmed = query.trim();
  const upperTrimmed = trimmed.toUpperCase();

  // US ZIP: 12345 or 12345-6789
  if (/^\d{5}(-\d{4})?$/.test(trimmed)) {
    const normalized = normalizeUSZip(trimmed);
    return {
      normalizedPostalCode: normalized,
      displayPostalCode: trimmed,
      countryCodes: "us,mx",
    };
  }

  // Canada postal code: A1A 1A1 or A1A1A1
  if (/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(trimmed)) {
    const displayCode = normalizeCanadianPostalCode(trimmed);
    return {
      normalizedPostalCode: displayCode.replace(/\s+/g, ""),
      displayPostalCode: displayCode,
      countryCodes: "ca",
    };
  }

  // Brazil: 12345-678 or 12345678
  if (/^\d{5}-?\d{3}$/.test(trimmed)) {
    return {
      normalizedPostalCode: trimmed.replace("-", ""),
      displayPostalCode: trimmed,
      countryCodes: "br",
    };
  }

  // Argentina: A1234AAA
  if (/^[A-Z]\d{4}[A-Z]{3}$/i.test(upperTrimmed)) {
    return {
      normalizedPostalCode: upperTrimmed,
      displayPostalCode: upperTrimmed,
      countryCodes: "ar",
    };
  }

  // Chile: 7 digits
  if (/^\d{7}$/.test(trimmed)) {
    return {
      normalizedPostalCode: trimmed,
      displayPostalCode: trimmed,
      countryCodes: "cl",
    };
  }

  // Colombia: 6 digits
  if (/^\d{6}$/.test(trimmed)) {
    return {
      normalizedPostalCode: trimmed,
      displayPostalCode: trimmed,
      countryCodes: "co",
    };
  }

  // General LATAM fallback when query looks like a postal code.
  if (!trimmed.includes(",") && /^[A-Za-z0-9-]{3,10}$/.test(trimmed) && /\d/.test(trimmed)) {
    return {
      normalizedPostalCode: trimmed.toUpperCase(),
      displayPostalCode: trimmed.toUpperCase(),
      countryCodes: LATAM_COUNTRY_CODES,
    };
  }

  return null;
}

// Chicago fallback location for consistent behavior
export function getChicagoFallback(): LocationResult {
  return {
    coordinates: {
      latitude: 41.8781,
      longitude: -87.6298,
    },
    displayName: "Chicago, Illinois",
    city: "Chicago",
    state: "Illinois",
    country: "United States",
  };
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
        // Second attempt with high accuracy enabled
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (secondError) => {
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
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "EazyWeather/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.address) {
      throw new Error("Invalid response format from geocoding service");
    }

    const address = data.address;

    // Try multiple city-level fields, but never county
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.locality ||
      address.hamlet ||
      "";
    const state = address.state || address.province || "";
    const country = address.country || "";

    // Format display name based on location type
    let displayName = "";

    // For US and Canada, always require city + state/province
    if (country === "United States" || country === "Canada") {
      if (city && state) {
        displayName = `${city}, ${state}`;
      } else if (city) {
        // If we have a city but no state, still show the city
        displayName = city;
      } else {
        // No city found - fall back to coordinates
        displayName = `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`;
      }
    } else {
      // For international locations, prefer city + state/province, then city + country
      if (city && state) {
        displayName = `${city}, ${state}`;
      } else if (city && country) {
        displayName = `${city}, ${country}`;
      } else if (city) {
        displayName = city;
      } else {
        // No city found - fall back to coordinates
        displayName = `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`;
      }
    }

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
    const searchQuery = query.trim();
    const originalQuery = searchQuery;
    const postalContext = detectPostalContext(searchQuery);

    let searchParams = `format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`;
    if (postalContext) {
      const countryCodeParam = postalContext.countryCodes
        ? `&countrycodes=${postalContext.countryCodes}`
        : "";
      searchParams = `format=json&postalcode=${encodeURIComponent(postalContext.normalizedPostalCode)}${countryCodeParam}&limit=1&addressdetails=1`;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${searchParams}`,
      {
        headers: {
          "User-Agent": "EazyWeather/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    let data = await response.json();

    // Postal fallback: if strict postal query returns no rows, retry with free-form q search.
    if (postalContext && (!data || data.length === 0)) {
      const fallbackResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
        {
          headers: {
            "User-Agent": "EazyWeather/1.0",
          },
        },
      );

      if (fallbackResponse.ok) {
        data = await fallbackResponse.json();
      }
    }

    if (!data || data.length === 0) {
      throw new Error("Location not found");
    }

    const result = data[0];
    const address = result.address;
    const coords = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    // Try multiple city-level fields, but never county
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.locality ||
      address.hamlet ||
      "";
    const state = address.state || address.province || "";
    const country = address.country || "";

    // Format display name based on location type - same logic as reverse geocoding
    let displayName = "";

    // If original query was a ZIP code, show the ZIP code
    if (postalContext) {
      displayName = postalContext.displayPostalCode;
    } else if (country === "United States" || country === "Canada") {
      // For US and Canada, always require city + state/province
      if (city && state) {
        displayName = `${city}, ${state}`;
      } else if (city) {
        // If we have a city but no state, still show the city
        displayName = city;
      } else {
        // No city found - use the original query
        displayName = originalQuery;
      }
    } else {
      // For international locations, prefer city + state/province, then city + country
      if (city && state) {
        displayName = `${city}, ${state}`;
      } else if (city && country) {
        displayName = `${city}, ${country}`;
      } else if (city) {
        displayName = city;
      } else {
        // No city found - use the original query
        displayName = originalQuery;
      }
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

export async function geocodeLocationMultiple(
  query: string,
): Promise<LocationResult[]> {
  try {
    const searchQuery = query.trim();
    const originalQuery = searchQuery;
    const postalContext = detectPostalContext(searchQuery);

    let searchParams = `format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`;
    if (postalContext) {
      const countryCodeParam = postalContext.countryCodes
        ? `&countrycodes=${postalContext.countryCodes}`
        : "";
      searchParams = `format=json&postalcode=${encodeURIComponent(postalContext.normalizedPostalCode)}${countryCodeParam}&limit=5&addressdetails=1`;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${searchParams}`,
      {
        headers: {
          "User-Agent": "EazyWeather/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    let data = await response.json();

    // Postal fallback: if strict postal query returns no rows, retry with free-form q search.
    if (postalContext && (!data || data.length === 0)) {
      const fallbackResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        {
          headers: {
            "User-Agent": "EazyWeather/1.0",
          },
        },
      );

      if (fallbackResponse.ok) {
        data = await fallbackResponse.json();
      }
    }

    if (!data || data.length === 0) {
      throw new Error("Location not found");
    }

    return data.map((result: any) => {
      const address = result.address;
      const coords = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };

      // Try multiple city-level fields, but never county
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.locality ||
        address.hamlet ||
        "";
      const state = address.state || address.province || "";
      const country = address.country || "";

      // Format full display name with complete context
      let displayName = "";

      // If original query was a ZIP code, show the ZIP code with city/state context
      if (postalContext) {
        displayName = `${postalContext.displayPostalCode} - ${city && state ? `${city}, ${state}` : city || "Location"}`;
      } else if (city && state && country) {
        displayName = `${city}, ${state}, ${country}`;
      } else if (city && country) {
        displayName = `${city}, ${country}`;
      } else if (city && state) {
        displayName = `${city}, ${state}`;
      } else if (city) {
        displayName = city;
      } else {
        // Fallback to the display name from the API or original query
        displayName = result.display_name || originalQuery;
      }

      return {
        coordinates: coords,
        displayName,
        city,
        state,
        country,
      };
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    throw new Error("Unable to find location. Please try a different search.");
  }
}

export function saveLocation(locationResult: LocationResult): void {
  const data = {
    ...locationResult,
    timestamp: Date.now(),
  };
  const json = JSON.stringify(data);

  // Always save to localStorage as baseline
  try {
    localStorage.setItem("eazyweather_location", json);
  } catch {
    // Ignore localStorage errors
  }

  // Save to cookie if consent granted
  if (getCookieConsent() === "granted") {
    setCookie("eazyweather_location", json, STORAGE_EXPIRATION_DAYS);
  }
}

export function getSavedLocation(): LocationResult | null {
  try {
    let saved: string | null = null;
    const consent = getCookieConsent();

    // 1. Try cookie if consented
    if (consent === "granted") {
      saved = getCookie("eazyweather_location");
    }

    // 2. Fallback to localStorage if no cookie or not consented
    if (!saved) {
      saved = localStorage.getItem("eazyweather_location");
    }

    if (!saved) return null;

    const data = JSON.parse(saved);
    const age = Date.now() - data.timestamp;

    if (age > STORAGE_EXPIRATION_MS) {
      localStorage.removeItem("eazyweather_location");
      if (consent === "granted") {
        eraseCookie("eazyweather_location");
      }
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
    const json = JSON.stringify(newHistory);

    localStorage.setItem(
      "eazyweather_location_history",
      json,
    );

    if (getCookieConsent() === "granted") {
      setCookie("eazyweather_location_history", json, STORAGE_EXPIRATION_DAYS);
    }
  } catch (error) {
    console.error("Error saving location history:", error);
  }
}

export function getLocationHistory(): LocationResult[] {
  try {
    let saved: string | null = null;
    const consent = getCookieConsent();

    if (consent === "granted") {
      saved = getCookie("eazyweather_location_history");
    }

    if (!saved) {
      saved = localStorage.getItem("eazyweather_location_history");
    }

    if (!saved) return [];

    const data = JSON.parse(saved);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Manual pin location functions
export function saveManualPin(locationResult: LocationResult): void {
  const data = {
    ...locationResult,
    isManualPin: true,
    timestamp: Date.now(),
  };
  const json = JSON.stringify(data);

  localStorage.setItem(
    "eazyweather_manual_pin",
    json,
  );

  if (getCookieConsent() === "granted") {
    setCookie("eazyweather_manual_pin", json, STORAGE_EXPIRATION_DAYS);
  }
}

export function getManualPin(): LocationResult | null {
  try {
    let saved: string | null = null;
    const consent = getCookieConsent();

    if (consent === "granted") {
      saved = getCookie("eazyweather_manual_pin");
    }

    if (!saved) {
      saved = localStorage.getItem("eazyweather_manual_pin");
    }

    if (!saved) return null;

    const data = JSON.parse(saved);

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

export function clearManualPin(): void {
  localStorage.removeItem("eazyweather_manual_pin");
  if (getCookieConsent() === "granted") {
    eraseCookie("eazyweather_manual_pin");
  }
}

export function hasManualPin(): boolean {
  if (getCookieConsent() === "granted") {
    if (getCookie("eazyweather_manual_pin")) return true;
  }
  return localStorage.getItem("eazyweather_manual_pin") !== null;
}
