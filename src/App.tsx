/**
 * EazyWeather - Simple, ad-free weather
 * Copyright (c) 2025 Spencer Francisco
 * Licensed under MIT License
 * Contact: https://x.com/spencer_i_am
 */

import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WeatherCarousel } from "./components/WeatherCarousel";
import { SevenDayForecast } from "./components/SevenDayForecast";
import { HourlyForecast } from "./components/HourlyForecast";
import { MonthlyForecast } from "./components/MonthlyForecast";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorMessage } from "./components/ErrorMessage";
import { InitialLocationModal } from "./components/InitialLocationModal";
import { LocationPinModal } from "./components/LocationPinModal";
import { LocationPermissionOverlay } from "./components/LocationPermissionOverlay";
import { CookieConsentModal } from "./components/modals/CookieConsentModal";
import { RadarModal } from "./components/modals/RadarModal";

import { getAllWeatherData, getMonthlyForecast } from "./services/weatherApi";
import {
  reverseGeocode,
  geocodeLocation,
  getBrowserLocation,
  saveLocation,
  getSavedLocation,
  getManualPin,
  saveManualPin,
  getChicagoFallback,
  type LocationResult,
} from "./services/locationService";
import { getCookieConsent, setCookieConsent } from "./utils/cookieUtils";
import { getPotentialLocationFromUrl } from "./utils/urlUtils";
import { refreshService } from "./services/refreshService";
import {
  getInitialThemeMode,
  persistThemeMode,
  resolveThemeMode,
  type ThemeMode,
} from "./utils/themeUtils";
import { getInitialTimezone, persistTimezone } from "./utils/timezoneUtils";
import type {
  Coordinates,
  CurrentConditions as CurrentConditionsType,
  ForecastPeriod,
  HourlyForecast as HourlyForecastType,
  MonthlyForecast as MonthlyForecastType,
} from "./types/weather";

function App() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState("Chicago, Illinois");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInitialModal, setShowInitialModal] = useState(false);
  const [hasWeatherLoaded, setHasWeatherLoaded] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [isConsentResolved, setIsConsentResolved] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [pendingGPSCoordinates, setPendingGPSCoordinates] = useState<Coordinates | null>(null);
  const [isRequestingLocationPermission, setIsRequestingLocationPermission] = useState(false);
  const [isInitialChicagoLoad, setIsInitialChicagoLoad] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    resolveThemeMode(getInitialThemeMode()),
  );
  const [selectedTimezone, setSelectedTimezone] = useState<string>(getInitialTimezone);

  // Refresh state
  const [refreshState, setRefreshState] = useState(refreshService.getState());
  // Update page title for SEO
  function updatePageTitle(location: string) {
    const baseTitle = "EazyWeather - Free Local Weather Forecast";
    if (
      location &&
      location !== "Loading..." &&
      location !== "Enter your location"
    ) {
      document.title = `${location} Weather Forecast | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }

  // Update structured data for SEO
  function updateStructuredData(
    location: LocationResult,
    conditions: CurrentConditionsType | null,
  ) {
    try {
      const script = document.getElementById("weather-structured-data");
      if (!script) return;

      const structuredData = {
        "@context": "https://schema.org",
        "@type": "WeatherForecast",
        name: `${location.displayName} Weather Forecast`,
        description: `Current weather conditions and forecast for ${location.displayName}`,
        location: {
          "@type": "Place",
          name: location.displayName,
          address: {
            "@type": "PostalAddress",
            addressLocality:
              location.city || location.displayName.split(",")[0],
            addressRegion:
              location.state || location.displayName.split(",")[1]?.trim(),
            addressCountry: location.country || "US",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
          },
        },
        forecast: conditions
          ? {
              "@type": "WeatherConditions",
              temperature: {
                "@type": "QuantitativeValue",
                value: conditions.temperature,
                unitCode: conditions.temperatureUnit === "C" ? "C" : "F",
              },
              humidity: {
                "@type": "QuantitativeValue",
                value: conditions.relativeHumidity,
                unitCode: "P1",
              },
              windSpeed: {
                "@type": "QuantitativeValue",
                value: conditions.windSpeedValue || 0,
                unitText: "mph",
              },
              weatherCondition: conditions.textDescription,
            }
          : {},
        dateModified: new Date().toISOString(),
        provider: {
          "@type": "Organization",
          name: "National Weather Service",
          url: "https://weather.gov",
        },
      };

      script.textContent = JSON.stringify(structuredData);
    } catch {
      // Silently handle structured data errors
    }
  }

  const [currentConditions, setCurrentConditions] =
    useState<CurrentConditionsType | null>(null);
  const [forecast, setForecast] = useState<ForecastPeriod[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastType[]>(
    [],
  );
  const [monthlyForecast, setMonthlyForecast] =
    useState<MonthlyForecastType | null>(null);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState(false);

  function handleTimezoneChange(timezone: string) {
    setSelectedTimezone(timezone);
    persistTimezone(timezone);
  }

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
    persistThemeMode(mode);
  }

  useEffect(() => {
    const applyTheme = () => {
      const resolved = resolveThemeMode(themeMode);
      document.documentElement.classList.toggle("dark", resolved === "dark");
      setResolvedTheme(resolved);
    };

    applyTheme();

    if (themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme();
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [themeMode]);

  const loadWeatherData = useCallback(
    async (skipRateLimit = false, coordsOverride?: Coordinates) => {
      const activeCoords = coordsOverride || coordinates;
      if (!activeCoords) return;

      // Only set loading if weather hasn't loaded yet
      if (!hasWeatherLoaded) {
        setIsLoading(true);
      }
      setError(null);

      try {
        // For initial Chicago load, include monthly forecast to avoid extra loading time
        const shouldIncludeMonthly = isInitialChicagoLoad && locationName === "Chicago, Illinois";

        console.log(`🔍 Loading weather data - Location: "${locationName}", Initial Chicago: ${isInitialChicagoLoad}, Include Monthly: ${shouldIncludeMonthly}`);
        const loadStartTime = Date.now();

        const {
          current,
          forecast: sevenDay,
          hourly,
          monthly,
        } = await getAllWeatherData(activeCoords, {
          skipRateLimit,
          includeMonthly: shouldIncludeMonthly,
        });

        const loadDuration = ((Date.now() - loadStartTime) / 1000).toFixed(2);
        console.log(`⏱️ Weather data loaded in ${loadDuration}s (Monthly included: ${!!monthly})`);

        setCurrentConditions(current);
        setForecast(sevenDay);
        setHourlyForecast(hourly);

        // Set monthly forecast if it was included (initial Chicago load)
        if (monthly) {
          setMonthlyForecast(monthly);
          console.log('✅ Monthly forecast loaded synchronously with initial data');
        }

        // Check if we got any meaningful data
        const hasData = current || sevenDay.length > 0 || hourly.length > 0;

        if (!hasData) {
          console.error("❌ No weather data received");
          setError(
            "Weather data unavailable for this location. Try searching for a nearby city.",
          );
        } else {
          setError(null);

          // Update structured data when weather data loads
          if (current && activeCoords) {
            // Parse location name to extract city and state
            const locationParts = locationName.split(",");
            const locationResult = {
              coordinates: activeCoords,
              displayName: locationName,
              city: locationParts[0]?.trim() || "",
              state: locationParts[1]?.trim() || "",
              country:
                locationParts.length > 2 ? locationParts[2]?.trim() : "US",
            };
            updateStructuredData(locationResult, current);
          }

          // Mark weather as loaded
          if (!hasWeatherLoaded) {
            setHasWeatherLoaded(true);
            setIsLoading(false);
          }
        }
      } finally {
        // Only clear loading if weather has loaded
        if (hasWeatherLoaded) {
          setIsLoading(false);
        }
      }
    },
    [coordinates, locationName, hasWeatherLoaded],
  );

  // Track when user changes location from initial Chicago
  useEffect(() => {
    if (locationName !== "Chicago, Illinois" && isInitialChicagoLoad) {
      setIsInitialChicagoLoad(false);
      console.log('📍 Location changed from initial Chicago, future monthly loads will be async');
    }
  }, [locationName, isInitialChicagoLoad]);

  // Load monthly forecast asynchronously after main content loads
  // UNLESS it's the initial Chicago load (then it's loaded during initial load)
  useEffect(() => {
    if (!coordinates || !hasWeatherLoaded) return;

    // Skip async load for initial Chicago - it's already loaded synchronously
    if (isInitialChicagoLoad && locationName === "Chicago, Illinois") {
      console.log('📅 Skipping async monthly load for initial Chicago (already loaded)');
      return;
    }

    const loadMonthlyForecast = async () => {
      setIsMonthlyLoading(true);
      setMonthlyError(false);

      try {
        console.log('📅 Loading monthly forecast asynchronously...');
        const monthly = await getMonthlyForecast(coordinates);
        setMonthlyForecast(monthly);
        console.log('✅ Monthly forecast loaded');
      } catch (error) {
        console.warn('Could not load monthly forecast:', error);
        setMonthlyError(true);
      } finally {
        setIsMonthlyLoading(false);
      }
    };

    loadMonthlyForecast();
  }, [coordinates, hasWeatherLoaded, isInitialChicagoLoad, locationName]);

  // Refresh service effects
  useEffect(() => {
    // Listen for refresh state changes
    const unsubscribe = refreshService.addListener(() => {
      setRefreshState(refreshService.getState());

      // Handle immediate refresh when page becomes visible and data is stale
      const state = refreshService.getState();
      if (
        document.visibilityState === "visible" &&
        refreshService.isDataStale() &&
        !state.isRefreshing &&
        coordinates
      ) {
        loadWeatherData(true); // Pass true to indicate this is auto-refresh, not manual
      }
    });

    // Handle auto-refresh triggers - smarter timing that respects API cache
    const handleAutoRefresh = () => {
      // Only refresh if auto-refresh is enabled and we have coordinates
      if (refreshService.shouldAutoRefresh() && coordinates) {
        loadWeatherData(true); // Pass true to indicate this is auto-refresh, not manual
      }
    };

    // Set up auto-refresh after initial location setup (only for non-Chicago default)
    if (coordinates && locationName !== "Chicago, Illinois") {
      refreshService.startAutoRefresh();
    }

    // Custom auto-refresh handler - optimized to check less frequently
    const intervalId = setInterval(() => {
      if (
        refreshService.getState().nextAutoRefreshTime &&
        Date.now() >= refreshService.getState().nextAutoRefreshTime! &&
        refreshService.shouldAutoRefresh()
      ) {
        handleAutoRefresh();
      }
    }, 5000); // Check every 5 seconds instead of every second

    return () => {
      unsubscribe();
      clearInterval(intervalId);
      refreshService.destroy();
    };
  }, [coordinates, locationName, loadWeatherData]);

  const initializeLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 0. Check for URL-based location (ZIP or postal code)
      const potentialLocationCode = getPotentialLocationFromUrl();

      if (potentialLocationCode) {
        try {
          console.log(`🔍 Checking URL location: "${potentialLocationCode}"`);
          const locationResult = await geocodeLocation(potentialLocationCode);

          // If the display name is just the ZIP code, try to format it nicely
          let finalDisplayName = locationResult.displayName;
          if (finalDisplayName === potentialLocationCode) {
            if (locationResult.city && locationResult.state) {
              finalDisplayName = `${locationResult.city}, ${locationResult.state}`;
            } else if (locationResult.city && locationResult.country) {
              finalDisplayName = `${locationResult.city}, ${locationResult.country}`;
            }
          }

          setCoordinates(locationResult.coordinates);
          setLocationName(finalDisplayName);
          updatePageTitle(finalDisplayName);
          setShowInitialModal(false);
          setIsLoading(false);

          // NOTE: We deliberately do NOT call saveLocation() here.
          // This allows the URL location to be temporary for this session/view
          // without overwriting the user's saved preference.
          return;
        } catch (urlError) {
          console.warn("URL location lookup failed, falling back to stored location", urlError);
          // Fall through to normal initialization
        }
      }

      // First, check for manual pin - it takes priority over automatic location
      const manualPin = getManualPin();
      if (manualPin) {
        setCoordinates(manualPin.coordinates);
        setLocationName(manualPin.displayName);
        updatePageTitle(manualPin.displayName);
        setShowInitialModal(false);
        setIsLoading(false);
        return;
      }

      // Second, check for saved location
      const saved = getSavedLocation();
      if (saved) {
        setCoordinates(saved.coordinates);
        setShowInitialModal(false);
        // If saved location still shows "Your Location" or coordinates, try to reverse geocode it
        if (
          saved.displayName === "Your Location" ||
          saved.displayName.includes(",")
        ) {
          try {
            const locationResult = await reverseGeocode(saved.coordinates);
            setLocationName(locationResult.displayName);
            saveLocation(locationResult);
            updatePageTitle(locationResult.displayName);
          } catch {
            setLocationName(saved.displayName);
            updatePageTitle(saved.displayName);
          }
        } else {
          setLocationName(saved.displayName);
          updatePageTitle(saved.displayName);
        }
        setIsLoading(false);
        return;
      }

      // Default to Chicago coordinates to load weather immediately
      const chicagoCoords: Coordinates = {
        latitude: 41.8781,
        longitude: -87.6298,
      };
      setCoordinates(chicagoCoords);
      setLocationName("Chicago, Illinois");
      updatePageTitle("Chicago, IL Weather - EazyWeather");
      setShowInitialModal(true);
      // Don't set loading state - let weather load silently for Chicago default
    } catch (locationError) {
      // Default to Chicago as fallback
      const chicagoLocation = getChicagoFallback();
      setCoordinates(chicagoLocation.coordinates);
      setLocationName(chicagoLocation.displayName);
      updatePageTitle("Chicago, IL Weather - EazyWeather");
      setShowInitialModal(true);
      // Don't set loading state - let weather load silently for Chicago default
    }
  }, []);

  // Check for cookie consent on mount
  useEffect(() => {
    const consent = getCookieConsent();
    const potentialLocationUrl = getPotentialLocationFromUrl();

    // If there is a direct URL location (e.g. /60613), we bypass the consent modal
    // but we do NOT automatically set the consent to granted/denied.
    if (potentialLocationUrl) {
      console.log('📍 Direct URL location detected, bypassing cookie consent modal');
      setIsConsentResolved(true);
      return;
    }

    if (consent === null) {
      setShowCookieConsent(true);
    } else {
      setIsConsentResolved(true);
    }
  }, []);

  // Run initialization once consent is resolved
  useEffect(() => {
    if (isConsentResolved) {
      initializeLocation();
    }
  }, [isConsentResolved, initializeLocation]);

  useEffect(() => {
    // Load weather data if we have coordinates
    if (coordinates) {
      loadWeatherData();
    }
  }, [coordinates, loadWeatherData]);

  const handleCookieConsentResolve = (granted: boolean) => {
    setCookieConsent(granted);
    setShowCookieConsent(false);
    setIsConsentResolved(true);
  };

  async function handleLocationSelect(location: LocationResult) {
    setIsLoading(true);
    setError(null);

    try {
      setCoordinates(location.coordinates);
      setLocationName(location.displayName);
      saveLocation(location);
      updatePageTitle(location.displayName);

      // Load weather data immediately to prevent flash
      await loadWeatherData(true, location.coordinates);
    } catch (error) {
      console.error("Location change error:", error);
      setError("Failed to set location");
      setIsLoading(false);
    }
  }

  async function handlePinLocationConfirm(coords: Coordinates, displayName: string) {
    // Dismiss the permission overlay
    setIsRequestingLocationPermission(false);

    // Get full location data with proper reverse geocoding
    let locationResult: LocationResult;
    try {
      locationResult = await reverseGeocode(coords);
    } catch (error) {
      console.error("Reverse geocode failed, using basic data:", error);
      // Fallback to basic data if reverse geocode fails
      locationResult = {
        coordinates: coords,
        displayName,
        city: "",
        state: "",
        country: "",
      };
    }

    saveManualPin(locationResult);
    saveLocation(locationResult);
    setCoordinates(coords);
    setLocationName(locationResult.displayName);
    updatePageTitle(locationResult.displayName);
    setShowPinModal(false);
    setPendingGPSCoordinates(null);
    setShowInitialModal(false); // Keep welcome modal closed
    setIsLoading(true);

    // Load weather data
    try {
      await loadWeatherData(true, coords);
    } catch (error) {
      console.error("Error loading weather data:", error);
      setError("Failed to load weather data");
      setIsLoading(false);
    }
  }

  function handlePinModalClose() {
    // Dismiss the permission overlay
    setIsRequestingLocationPermission(false);

    setShowPinModal(false);
    setPendingGPSCoordinates(null);

    // Only show initial modal again if:
    // 1. No coordinates are set at all (null)
    // 2. Still on default Chicago AND no saved location exists
    const savedLocation = getSavedLocation();
    if (!coordinates && !savedLocation) {
      setShowInitialModal(true);
    } else if (
      coordinates &&
      coordinates.latitude === 41.8781 &&
      coordinates.longitude === -87.6298 &&
      !savedLocation
    ) {
      setShowInitialModal(true);
    }
  }

  async function handleInitialLocationSelect(query: string, useGPS: boolean) {
    setShowInitialModal(false);
    setIsLoading(true);
    setError(null);

    try {
      if (useGPS) {
        // Show permission overlay while requesting location
        setIsRequestingLocationPermission(true);

        // Get GPS location and open pin modal for refinement
        const coords = await getBrowserLocation();
        setPendingGPSCoordinates(coords);
        setShowPinModal(true);
        setIsLoading(false);
      } else {
        // Use searched location
        const { geocodeLocation } = await import("./services/locationService");
        const locationResult = await geocodeLocation(query);
        setCoordinates(locationResult.coordinates);
        setLocationName(locationResult.displayName);
        saveLocation(locationResult);
        updatePageTitle(locationResult.displayName);

        // Load weather data for new location
        await loadWeatherData(true, locationResult.coordinates); // skipRateLimit=true for location changes
      }
    } catch (error) {
      // Dismiss overlay on error
      setIsRequestingLocationPermission(false);

      // Fall back to Chicago
      const chicagoLocation = getChicagoFallback();
      setCoordinates(chicagoLocation.coordinates);
      setLocationName(chicagoLocation.displayName);
      updatePageTitle("Chicago, IL Weather - EazyWeather");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInitialModalClose() {
    setShowInitialModal(false);
    // User chose to use Chicago - weather is already loaded, just close modal
    // No need to load weather data again
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-brand-cream z-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !coordinates && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} onRetry={initializeLocation} />
      </div>
    );
  }

  // Manual refresh handler
  const handleManualRefresh = () => {
    if (coordinates) {
      loadWeatherData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 pb-24 md:pb-20">
      {/* Darker sides background */}
      <div className="min-h-screen">
        {/* Header with full width */}
        <Header
          locationName={locationName}
          coordinates={coordinates}
          onLocationUpdate={handleLocationSelect}
          themeMode={themeMode}
          onThemeChange={handleThemeChange}
          selectedTimezone={selectedTimezone}
          onTimezoneChange={handleTimezoneChange}
          onRadarOpen={() => setShowRadarModal(true)}
        />

        <main>
          {/* Centered white content area */}
          <div className="bg-white">
            {isLoading || (error && !coordinates) ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="max-w-7xl mx-auto px-4 py-16">
                <ErrorMessage message={error} onRetry={loadWeatherData} />
              </div>
            ) : (
              <>
                {currentConditions && forecast.length > 0 ? (
                  <WeatherCarousel
                    conditions={currentConditions}
                    forecast={forecast}
                    timezone={selectedTimezone}
                  />
                ) : (
                  <section id="current" className="bg-gray-100 scroll-mt-24 md:scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 py-16">
                      <div className="max-w-6xl mx-auto">
                        <div className="text-center">
                          <ErrorMessage
                            message="Current conditions are not available for this location."
                            onRetry={loadWeatherData}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {hourlyForecast.length > 0 ? (
                  <HourlyForecast
                    forecast={hourlyForecast}
                    timezone={selectedTimezone}
                  />
                ) : (
                  <section id="hourly" className="bg-gray-100 scroll-mt-24 md:scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                      <div className="max-w-6xl mx-auto">
                        <ErrorMessage
                          message="Hourly forecast data is not available for this location."
                          onRetry={loadWeatherData}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {forecast.length > 0 ? (
                  <SevenDayForecast forecast={forecast} />
                ) : (
                  <section id="forecast" className="bg-gray-100 scroll-mt-24 md:scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                      <div className="max-w-6xl mx-auto">
                        <ErrorMessage
                          message="7-day forecast data is not available for this location."
                          onRetry={loadWeatherData}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {monthlyForecast ? (
                  <MonthlyForecast forecast={monthlyForecast} />
                ) : isMonthlyLoading ? (
                  <section id="monthly" className="bg-gray-100 scroll-mt-24 md:scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                      <div className="max-w-6xl mx-auto">
                        <div className="bg-brand-cream rounded-lg shadow-md p-8 flex items-center justify-center">
                          <LoadingSpinner />
                          <span className="ml-3 text-gray-700">
                            Loading monthly forecast
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                ) : monthlyError ? (
                  <section id="monthly" className="bg-gray-100 scroll-mt-24 md:scroll-mt-28">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                      <div className="max-w-6xl mx-auto">
                        <ErrorMessage
                          message="Monthly forecast data is not available for this location."
                          onRetry={loadWeatherData}
                        />
                      </div>
                    </div>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </main>

        <Footer />

        {/* Initial Location Selection Modal */}
        <InitialLocationModal
          isOpen={showInitialModal}
          onClose={handleInitialModalClose}
          onLocationSelect={handleInitialLocationSelect}
        />

        {/* Location Pin Modal for refinement */}
        <LocationPinModal
          isOpen={showPinModal}
          onClose={handlePinModalClose}
          onLocationSelect={handlePinLocationConfirm}
          initialCoordinates={pendingGPSCoordinates || coordinates || undefined}
          isDarkMode={resolvedTheme === "dark"}
        />

        {/* Location Permission Overlay */}
        {isRequestingLocationPermission && <LocationPermissionOverlay />}

        {/* Cookie Consent Modal */}
        <CookieConsentModal
          isOpen={showCookieConsent}
          onResolve={handleCookieConsentResolve}
        />

        <RadarModal
          isOpen={showRadarModal}
          onClose={() => setShowRadarModal(false)}
          coordinates={coordinates}
          isDarkMode={resolvedTheme === "dark"}
        />
      </div>
    </div>
  );
}

export default App;
