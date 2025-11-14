import { WeatherCard } from './WeatherCard';
import { WeatherIcon } from '../icons/WeatherIcon';
import type { CurrentConditions } from '../../types/weather';
import { degreesToAbbreviatedDirection } from '../../utils/weatherHelpers';

interface CurrentWeatherCardProps {
  conditions: CurrentConditions;
  timezone?: string;
}

export function CurrentWeatherCard({ conditions, timezone }: CurrentWeatherCardProps) {
  const tempF =
    conditions.temperatureUnit === 'C'
      ? Math.round((conditions.temperature * 9) / 5 + 32)
      : Math.round(conditions.temperature);

  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;

  // Format current date as "mm/dd"
  const formatCurrentDate = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return `${month}/${day}`;
  };

  const cardTitle = `CURRENT CONDITIONS ${formatCurrentDate()}`;

  const getRealFeel = () => {
    if (conditions.heatIndex) {
      return Math.round(
        conditions.temperatureUnit === 'C'
          ? (conditions.heatIndex * 9) / 5 + 32
          : conditions.heatIndex
      );
    } else if (conditions.windChill) {
      return Math.round(
        conditions.temperatureUnit === 'C'
          ? (conditions.windChill * 9) / 5 + 32
          : conditions.windChill
      );
    } else {
      return tempF;
    }
  };

  const getDewPoint = () => {
    if (conditions.dewpoint) {
      return Math.round(
        conditions.temperatureUnit === 'C'
          ? (conditions.dewpoint * 9) / 5 + 32
          : conditions.dewpoint
      );
    }
    return Math.round(tempF - (100 - conditions.relativeHumidity) / 5);
  };

  const getWindDisplay = () => {
    const speed = Math.round(conditions.windSpeedValue || 0);

    if (speed === 0) {
      return 'Calm';
    }

    const direction =
      typeof conditions.windDirection === 'number'
        ? degreesToAbbreviatedDirection(conditions.windDirection)
        : '';

    return `${speed} mph ${direction}`;
  };

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
    if (conditions.sunriseTime) {
      return formatTime(conditions.sunriseTime);
    }
    return 'N/A';
  };

  const getSunset = () => {
    if (conditions.sunsetTime) {
      return formatTime(conditions.sunsetTime);
    }
    return 'N/A';
  };

  return (
    <WeatherCard title={cardTitle}>
      {/* Weather icon and temperature */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="mb-3">
          <WeatherIcon
            condition={conditions.textDescription}
            isDaytime={isDaytime}
            size={100}
            className="drop-shadow-lg"
          />
        </div>
        <div className="text-5xl font-light text-gray-800 mb-2">
          {tempF}°
        </div>
        <div className="text-base text-gray-600 capitalize">
          {conditions.textDescription}
        </div>
      </div>

      {/* Weather details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {/* Left column */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">High / Low</span>
            <span className="font-medium text-gray-800">
              {conditions.todayHigh && conditions.todayLow
                ? `${Math.round(conditions.todayHigh)}° / ${Math.round(conditions.todayLow)}°`
                : conditions.todayHigh
                  ? `${Math.round(conditions.todayHigh)}°`
                  : conditions.todayLow
                    ? `${Math.round(conditions.todayLow)}°`
                    : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dew point</span>
            <span className="font-medium text-gray-800">{getDewPoint()}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Humidity</span>
            <span className="font-medium text-gray-800">
              {Math.round(conditions.relativeHumidity)}%
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
            <span className="text-gray-500">Real feel</span>
            <span className="font-medium text-gray-800">{getRealFeel()}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Wind</span>
            <span className="font-medium text-gray-800 text-right">
              {getWindDisplay()}
            </span>
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
