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
import {
  getCurrentConditions,
  get7DayForecast,
  getHourlyForecast,
  getMonthlyForecast,
} from "./services/weatherApi";
import {
  reverseGeocode,
  getBrowserLocation,
  saveLocation,
  getSavedLocation,
  type LocationResult,
} from "./services/locationService";
import type {
  Coordinates,
  CurrentConditions as CurrentConditionsType,
  ForecastPeriod,
  HourlyForecast as HourlyForecastType,
  MonthlyForecast as MonthlyForecastType,
} from "./types/weather";

function App() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

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
          addressLocality: location.city,
          addressRegion: location.state,
          addressCountry: location.country,
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
  }

  const [currentConditions, setCurrentConditions] =
    useState<CurrentConditionsType | null>(null);
  const [forecast, setForecast] = useState<ForecastPeriod[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastType[]>(
    [],
  );
  const [monthlyForecast, setMonthlyForecast] =
    useState<MonthlyForecastType | null>(null);

  const loadWeatherData = useCallback(async () => {
    if (!coordinates) return;

    setIsLoading(true);
    setError(null);

    try {
      const [current, sevenDay, hourly, monthly] = await Promise.all([
        getCurrentConditions(coordinates),
        get7DayForecast(coordinates),
        getHourlyForecast(coordinates),
        getMonthlyForecast(coordinates),
      ]);

      setCurrentConditions(current);
      setForecast(sevenDay);
      setHourlyForecast(hourly);
      setMonthlyForecast(monthly);

      // Update structured data when weather data loads
      if (current && coordinates) {
        const locationResult = {
          coordinates,
          displayName: locationName,
          city: "",
          state: "",
          country: "",
        };
        updateStructuredData(locationResult, current);
      }
    } catch (err) {
      setError(
        "Failed to load weather data. The location may not be supported by the National Weather Service.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [coordinates, locationName, currentConditions]);

  const initializeLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setShowSearch(false);

    try {
      const saved = getSavedLocation();
      if (saved) {
        setCoordinates(saved.coordinates);
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

      const coords = await getBrowserLocation();
      const locationResult = await reverseGeocode(coords);
      setCoordinates(coords);
      setLocationName(locationResult.displayName);
      saveLocation(locationResult);
      updatePageTitle(locationResult.displayName);
      console.log("Location detected:", locationResult.displayName);
    } catch (locationError) {
      console.log("Location detection failed:", locationError);
      // Don't set error message, just show search interface
      setLocationName("Enter your location");
      setShowSearch(true);
      updatePageTitle("EazyWeather - Free Local Weather Forecast");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  useEffect(() => {
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
      updateStructuredData(location, currentConditions);
    } catch {
      setError("Failed to find location");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !coordinates && !showSearch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} onRetry={initializeLocation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
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
            {isLoading ? (
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
                  <CurrentConditions conditions={currentConditions} />
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
                  <HourlyForecast forecast={hourlyForecast} />
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
      </div>
    </div>
  );
}

export default App;
