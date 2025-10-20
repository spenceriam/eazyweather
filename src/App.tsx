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
  getBrowserLocation,
  saveLocation,
  getSavedLocation,
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
    } catch {
      setError(
        "Failed to load weather data. The location may not be supported by the National Weather Service.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [coordinates]);

  const initializeLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const saved = getSavedLocation();
      if (saved) {
        setCoordinates(saved.coordinates);
        setLocationName(saved.displayName || "Your Location");
        setIsLoading(false);
        return;
      }

      const coords = await getBrowserLocation();
      setCoordinates(coords);
      setLocationName("Your Location");
      saveLocation(coords, "Your Location");
    } catch {
      setError(
        "Unable to get your location. Please enter a location manually.",
      );
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

  async function handleLocationSelect(coords: Coordinates, name: string) {
    setIsLoading(true);
    setError(null);

    try {
      setCoordinates(coords);
      setLocationName(name);
      saveLocation(coords, name);
    } catch {
      setError("Failed to find location");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading && !coordinates) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !coordinates) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} onRetry={initializeLocation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header locationName={locationName} />

      <main>
        <LocationSection
          coordinates={coordinates}
          locationName={locationName}
          onLocationUpdate={handleLocationSelect}
        />

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
              <section
                id="current"
                className="bg-gradient-to-b from-blue-50 to-white"
              >
                <div className="max-w-7xl mx-auto px-4 py-16">
                  <div className="text-center">
                    <ErrorMessage
                      message="Current conditions are not available for this location."
                      onRetry={loadWeatherData}
                    />
                  </div>
                </div>
              </section>
            )}

            {hourlyForecast.length > 0 ? (
              <HourlyForecast forecast={hourlyForecast} />
            ) : (
              <section id="hourly" className="bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <ErrorMessage
                    message="Hourly forecast data is not available for this location."
                    onRetry={loadWeatherData}
                  />
                </div>
              </section>
            )}

            {forecast.length > 0 ? (
              <SevenDayForecast forecast={forecast} />
            ) : (
              <section id="forecast" className="bg-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <ErrorMessage
                    message="7-day forecast data is not available for this location."
                    onRetry={loadWeatherData}
                  />
                </div>
              </section>
            )}

            {monthlyForecast ? (
              <MonthlyForecast forecast={monthlyForecast} />
            ) : (
              <section id="monthly" className="bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <ErrorMessage
                    message="Monthly forecast data is not available for this location."
                    onRetry={loadWeatherData}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
