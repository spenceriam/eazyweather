import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CurrentConditions } from './components/CurrentConditions';
import { SevenDayForecast } from './components/SevenDayForecast';
import { HourlyForecast } from './components/HourlyForecast';
import { RadarPlaceholder } from './components/RadarPlaceholder';
import { LocationModal } from './components/LocationModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { getCurrentConditions, get7DayForecast, getHourlyForecast } from './services/weatherApi';
import { getBrowserLocation, geocodeLocation, saveLocation, getSavedLocation } from './services/locationService';
import type { ViewMode, Coordinates, CurrentConditions as CurrentConditionsType, ForecastPeriod, HourlyForecast as HourlyForecastType } from './types/weather';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('current');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentConditions, setCurrentConditions] = useState<CurrentConditionsType | null>(null);
  const [forecast, setForecast] = useState<ForecastPeriod[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastType[]>([]);

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (coordinates) {
      loadWeatherData();
    }
  }, [coordinates]);

  async function initializeLocation() {
    setIsLoading(true);
    setError(null);

    try {
      const saved = getSavedLocation();
      if (saved) {
        setCoordinates(saved.coordinates);
        setLocationName(saved.displayName || 'Your Location');
        setIsLoading(false);
        return;
      }

      const coords = await getBrowserLocation();
      setCoordinates(coords);
      setLocationName('Your Location');
      saveLocation(coords, 'Your Location');
    } catch (err) {
      setError('Unable to get your location. Please enter a location manually.');
      setIsLocationModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadWeatherData() {
    if (!coordinates) return;

    setIsLoading(true);
    setError(null);

    try {
      const [current, sevenDay, hourly] = await Promise.all([
        getCurrentConditions(coordinates),
        get7DayForecast(coordinates),
        getHourlyForecast(coordinates)
      ]);

      setCurrentConditions(current);
      setForecast(sevenDay);
      setHourlyForecast(hourly);
    } catch (err) {
      setError('Failed to load weather data. The location may not be supported by the National Weather Service.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLocationSelect(query: string, useGPS: boolean) {
    setIsLocationModalOpen(false);
    setIsLoading(true);
    setError(null);

    try {
      let coords: Coordinates;
      let name: string;

      if (useGPS) {
        coords = await getBrowserLocation();
        name = 'Your Location';
      } else {
        coords = await geocodeLocation(query);
        name = query;
      }

      setCoordinates(coords);
      setLocationName(name);
      saveLocation(coords, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find location');
      setIsLocationModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }

  function renderContent() {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <ErrorMessage message={error} onRetry={loadWeatherData} />;
    }

    switch (currentView) {
      case 'current':
        return currentConditions ? (
          <CurrentConditions conditions={currentConditions} />
        ) : (
          <ErrorMessage message="Current conditions are not available for this location." />
        );
      case 'forecast':
        return forecast.length > 0 ? (
          <SevenDayForecast forecast={forecast} />
        ) : (
          <ErrorMessage message="Forecast data is not available for this location." />
        );
      case 'hourly':
        return hourlyForecast.length > 0 ? (
          <HourlyForecast forecast={hourlyForecast} />
        ) : (
          <ErrorMessage message="Hourly forecast is not available for this location." />
        );
      case 'radar':
        return <RadarPlaceholder />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        locationName={locationName}
        onLocationClick={() => setIsLocationModalOpen(true)}
      />

      <main className="flex-1">
        {renderContent()}
      </main>

      <Footer />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
}

export default App;
