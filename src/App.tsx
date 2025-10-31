/**
 * EazyWeather - Simple, ad-free weather
 * Copyright (c) 2025 Spencer Francisco
 * Licensed under MIT License
 * Contact: https://x.com/spencer_i_am
 */

import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CurrentConditions } from "./components/CurrentConditions";
import { SevenDayForecast } from "./components/SevenDayForecast";
import { HourlyForecast } from "./components/HourlyForecast";
import { MonthlyForecast } from "./components/MonthlyForecast";
import { LocationSection } from "./components/LocationSection";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorMessage } from "./components/ErrorMessage";
import { InitialLocationModal } from "./components/InitialLocationModal";
import { LocationPinModal } from "./components/LocationPinModal";

import { getAllWeatherData } from "./services/weatherApi";
import {
  reverseGeocode,
  getBrowserLocation,
  saveLocation,
  getSavedLocation,
  getManualPin,
  saveManualPin,
  getChicagoFallback,
  type LocationResult,
} from "./services/locationService";
import { refreshService } from "./services/refreshService";
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
  const [showSearch, setShowSearch] = useState(false);
  const [showInitialModal, setShowInitialModal] = useState(true);
  const [hasWeatherLoaded, setHasWeatherLoaded] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingGPSCoordinates, setPendingGPSCoordinates] = useState<Coordinates | null>(null);

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
                value: conditions.windSpeed,
                unitText: conditions.windSpeed.includes("mph") ? "mph" : "km/h",
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
    } catch (error) {
      console.warn("Failed to update structured data:", error);
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

  const loadWeatherData = useCallback(
    async (skipRateLimit = false) => {
      if (!coordinates) return;

      // Only set loading if weather hasn't loaded yet
      if (!hasWeatherLoaded) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const {
          current,
          forecast: sevenDay,
          hourly,
          monthly,
        } = await getAllWeatherData(coordinates, { skipRateLimit });

        setCurrentConditions(current);
        setForecast(sevenDay);
        setHourlyForecast(hourly);
        setMonthlyForecast(monthly);

        // Check if we got any meaningful data
        const hasData = current || sevenDay.length > 0 || hourly.length > 0;

        if (!hasData) {
          console.error("❌ No weather data received");
          setError(
            "Weather data unavailable for this location. Try searching for a nearby city.",
          );
        } else {
          console.log("✅ Weather data loaded successfully");
          setError(null);

          // Update structured data when weather data loads
          if (current && coordinates) {
            // Parse location name to extract city and state
            const locationParts = locationName.split(",");
            const locationResult = {
              coordinates,
              displayName: locationName,
              city: locationParts[0]?.trim() || "",
              state: locationParts[1]?.trim() || "",
              country:
                locationParts.length > 2 ? locationParts[2]?.trim() : "US",
            };
            updateStructuredData(locationResult, current);
          }

          // Reset refresh service after successful load
          refreshService.updateConfig({ enableAutoRefresh: true });

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
        console.log(
          "Page visible with stale data, triggering immediate refresh",
        );
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
    setShowSearch(false);

    try {
      // First, check for manual pin - it takes priority over automatic location
      const manualPin = getManualPin();
      if (manualPin) {
        console.log("Using manual pin location:", manualPin.displayName);
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
      console.log("Location initialization failed:", locationError);
      // Default to Chicago as fallback
      const chicagoLocation = getChicagoFallback();
      setCoordinates(chicagoLocation.coordinates);
      setLocationName(chicagoLocation.displayName);
      updatePageTitle("Chicago, IL Weather - EazyWeather");
      setShowInitialModal(true);
      // Don't set loading state - let weather load silently for Chicago default
    }
  }, []);

  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  useEffect(() => {
    // Load weather data if we have coordinates
    if (coordinates) {
      loadWeatherData();
    }
  }, [coordinates, loadWeatherData]);

  async function handleLocationSelect(location: LocationResult) {
    setIsLoading(true);
    setError(null);
    setShowSearch(false);

    try {
      setCoordinates(location.coordinates);
      setLocationName(location.displayName);
      saveLocation(location);
      updatePageTitle(location.displayName);

      // Load weather data immediately to prevent flash
      await loadWeatherData();
    } catch (error) {
      console.error("Location change error:", error);
      setError("Failed to set location");
      setIsLoading(false);
    }
  }

  async function handlePinLocationConfirm(coords: Coordinates, displayName: string) {
    console.log("📍 Pin confirmed - Coordinates:", coords, "Display Name:", displayName);

    // Get full location data with proper reverse geocoding
    let locationResult: LocationResult;
    try {
      locationResult = await reverseGeocode(coords);
      console.log("📍 Full location data:", locationResult);
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
      await loadWeatherData(true);
    } catch (error) {
      console.error("Error loading weather data:", error);
      setError("Failed to load weather data");
      setIsLoading(false);
    }
  }

  function handlePinModalClose() {
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
        await loadWeatherData(true); // skipRateLimit=true for location changes
      }
    } catch (error) {
      console.log("Location selection failed:", error);
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

  if (error && !coordinates && !showSearch && !isLoading) {
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
        <Header locationName={locationName} />

        <main>
          {/* Location section - full width */}
          <LocationSection
            coordinates={coordinates}
            locationName={locationName}
            onLocationUpdate={handleLocationSelect}
            forceShowSearch={showSearch}
          />

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
                {currentConditions ? (
                  <CurrentConditions
                    conditions={currentConditions}
                    onRefresh={handleManualRefresh}
                    isRefreshing={refreshState.isRefreshing}
                    lastUpdated={
                      refreshState.lastRefreshTime
                        ? new Date(refreshState.lastRefreshTime).toISOString()
                        : currentConditions?.timestamp
                    }
                    hourlyForecast={hourlyForecast}
                    timezone={currentConditions.timezone}
                  />
                ) : (
                  <section id="current" className="bg-gray-100">
                    <div className="max-w-7xl mx-auto px-4 py-16">
                      <div className="max-w-4xl mx-auto">
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
                    timezone={currentConditions.timezone}
                  />
                ) : (
                  <section id="hourly" className="bg-gray-100">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                      <div className="max-w-4xl mx-auto">
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
                  <section id="forecast" className="bg-gray-100">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                      <div className="max-w-4xl mx-auto">
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
                ) : (
                  <section id="monthly" className="bg-gray-100">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                      <div className="max-w-4xl mx-auto">
                        <ErrorMessage
                          message="Monthly forecast data is not available for this location."
                          onRetry={loadWeatherData}
                        />
                      </div>
                    </div>
                  </section>
                )}
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
        />
      </div>
    </div>
  );
}

export default App;
