import { WeatherIcon } from './icons/WeatherIcon';
import type { CurrentConditions as CurrentConditionsType } from '../types/weather';

interface CurrentConditionsProps {
  conditions: CurrentConditionsType;
}

export function CurrentConditions({ conditions }: CurrentConditionsProps) {
  const tempF = conditions.temperatureUnit === 'C'
    ? Math.round((conditions.temperature * 9) / 5 + 32)
    : Math.round(conditions.temperature);

  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="mb-8">
        <WeatherIcon
          condition={conditions.textDescription}
          isDaytime={isDaytime}
          size={180}
          className="drop-shadow-lg"
        />
      </div>

      <div className="text-center mb-8">
        <div className="text-7xl md:text-8xl font-light text-gray-800 mb-2">
          {tempF}°
        </div>
        <div className="text-2xl md:text-3xl text-gray-600 mb-4 capitalize">
          {conditions.textDescription}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-center">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 uppercase tracking-wide">Humidity</span>
          <span className="text-2xl font-medium text-gray-800">
            {Math.round(conditions.relativeHumidity)}%
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-500 uppercase tracking-wide">Wind</span>
          <span className="text-2xl font-medium text-gray-800">
            {conditions.windSpeed}
          </span>
        </div>

        <div className="flex flex-col col-span-2">
          <span className="text-sm text-gray-500 uppercase tracking-wide">Wind Direction</span>
          <span className="text-2xl font-medium text-gray-800">
            {getWindDirection(conditions.windDirection)}
          </span>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-400">
        Updated: {new Date(conditions.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
