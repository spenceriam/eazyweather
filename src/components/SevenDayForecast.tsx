import { WeatherIcon } from './icons/WeatherIcon';
import type { ForecastPeriod } from '../types/weather';

interface SevenDayForecastProps {
  forecast: ForecastPeriod[];
}

export function SevenDayForecast({ forecast }: SevenDayForecastProps) {
  return (
    <div className="py-6 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
        {forecast.map((period) => (
          <div
            key={period.number}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {period.name}
                </h3>
                <div className="text-4xl font-light text-gray-800 mb-2">
                  {period.temperature}°
                </div>
                <p className="text-sm text-gray-600 capitalize mb-2">
                  {period.shortForecast}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    {period.windSpeed}
                  </span>
                  <span>{period.windDirection}</span>
                </div>
              </div>
              <div className="ml-4">
                <WeatherIcon
                  condition={period.shortForecast}
                  isDaytime={period.isDaytime}
                  size={80}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              {period.detailedForecast}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
