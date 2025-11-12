import { WeatherCard } from './WeatherCard';
import { WeatherIcon } from '../icons/WeatherIcon';
import type { DailyForecast } from '../../types/weather';
import { extractWindSpeed } from '../../utils/weatherHelpers';

interface ForecastWeatherCardProps {
  forecast: DailyForecast;
}

export function ForecastWeatherCard({ forecast }: ForecastWeatherCardProps) {
  const tempF =
    forecast.temperatureUnit === 'C'
      ? Math.round((forecast.high * 9) / 5 + 32)
      : Math.round(forecast.high);

  const windSpeed = extractWindSpeed(forecast.windSpeed);

  // Format date as "Mon 11/12"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const cardTitle = `${forecast.dayName.toUpperCase()} ${formatDate(forecast.date)}`;

  return (
    <WeatherCard title={cardTitle}>
      {/* Weather icon and temperature - matching Current Conditions layout */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="mb-3">
          <WeatherIcon
            condition={forecast.shortForecast}
            isDaytime={forecast.isDaytime}
            size={100}
            className="drop-shadow-lg"
          />
        </div>
        <div className="text-5xl font-light text-gray-800 mb-2">
          {tempF}°
        </div>
        <div className="text-lg text-gray-600 capitalize mb-2">
          {forecast.shortForecast}
        </div>
      </div>
    </WeatherCard>
  );
}
