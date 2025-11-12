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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-3xl font-light text-gray-800">
              {tempF}°
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {forecast.shortForecast}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
              {windSpeed > 0 ? `${windSpeed} mph` : 'Calm'}
            </span>
            <span>{forecast.windDirection}</span>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-end">
          <WeatherIcon
            condition={forecast.shortForecast}
            isDaytime={forecast.isDaytime}
            size={80}
          />
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-4 leading-relaxed">
        {forecast.detailedForecast}
      </p>
    </WeatherCard>
  );
}
