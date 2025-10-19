import { WeatherIcon } from './icons/WeatherIcon';
import type { HourlyForecast as HourlyForecastType } from '../types/weather';

interface HourlyForecastProps {
  forecast: HourlyForecastType[];
}

export function HourlyForecast({ forecast }: HourlyForecastProps) {
  return (
    <div className="py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {forecast.map((hour, index) => {
              const time = new Date(hour.startTime);
              const timeStr = time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                hour12: true
              });
              const dateStr = time.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center min-w-[120px] hover:shadow-lg transition-shadow"
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {timeStr}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {dateStr}
                  </div>
                  <WeatherIcon
                    condition={hour.shortForecast}
                    isDaytime={hour.isDaytime}
                    size={60}
                    className="mb-3"
                  />
                  <div className="text-2xl font-light text-gray-800 mb-2">
                    {hour.temperature}°
                  </div>
                  <div className="text-xs text-gray-600 text-center mb-2 h-8 line-clamp-2">
                    {hour.shortForecast}
                  </div>
                  <div className="text-xs text-gray-500">
                    {hour.windSpeed}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-center text-sm text-gray-400 mt-4">
          Scroll horizontally to view more hours
        </div>
      </div>
    </div>
  );
}
