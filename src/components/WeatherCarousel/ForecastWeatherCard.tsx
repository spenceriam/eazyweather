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

  const lowF =
    forecast.temperatureUnit === 'C'
      ? Math.round((forecast.low * 9) / 5 + 32)
      : Math.round(forecast.low);

  const windSpeed = extractWindSpeed(forecast.windSpeed);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getSunrise = () => {
    if (forecast.sunriseTime) {
      return formatTime(forecast.sunriseTime);
    }
    return 'N/A';
  };

  const getSunset = () => {
    if (forecast.sunsetTime) {
      return formatTime(forecast.sunsetTime);
    }
    return 'N/A';
  };

  return (
    <WeatherCard title={forecast.dayName.toUpperCase()}>
      {/* Weather icon and temperature */}
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
        <div className="text-base text-gray-600 capitalize">
          {forecast.shortForecast}
        </div>
      </div>

      {/* Weather details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {/* Left column */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">High / Low</span>
            <span className="font-medium text-gray-800">
              {tempF}° / {lowF}°
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Humidity</span>
            <span className="font-medium text-gray-800">
              {forecast.humidity ? `${Math.round(forecast.humidity)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Wind</span>
            <span className="font-medium text-gray-800 text-right">
              {windSpeed > 0 ? `${windSpeed} mph ${forecast.windDirection}` : 'Calm'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sunrise</span>
            <span className="font-medium text-gray-800">{getSunrise()}</span>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">&nbsp;</span>
            <span className="font-medium text-gray-800">&nbsp;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">&nbsp;</span>
            <span className="font-medium text-gray-800">&nbsp;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">&nbsp;</span>
            <span className="font-medium text-gray-800">&nbsp;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sunset</span>
            <span className="font-medium text-gray-800">{getSunset()}</span>
          </div>
        </div>
      </div>
    </WeatherCard>
  );
}
