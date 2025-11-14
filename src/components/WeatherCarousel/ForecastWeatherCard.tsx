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
  // Parse date string directly to avoid timezone issues
  const formatDate = (dateString: string) => {
    // dateString format: "2024-11-12"
    const [, month, day] = dateString.split('-');
    return `${parseInt(month, 10)}/${parseInt(day, 10)}`;
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

      {/* Detailed forecast text */}
      <p className="text-sm text-gray-600 text-center leading-relaxed">
        {forecast.detailedForecast}
      </p>
    </WeatherCard>
  );
}
