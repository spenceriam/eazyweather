import { WeatherIcon } from "./icons/WeatherIcon";
import type { ForecastPeriod } from "../types/weather";

interface SevenDayForecastProps {
  forecast: ForecastPeriod[];
}

export function SevenDayForecast({ forecast }: SevenDayForecastProps) {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section id="forecast" className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            7-Day Forecast
          </h2>

          <div className="space-y-4">
            {forecast.map((period) => (
              <div
                key={period.number}
                className="bg-gray-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {period.name}
                    </h3>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-3xl font-light text-gray-800">
                        {period.temperature}°
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {period.shortForecast}
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
                        {period.windSpeed}
                      </span>
                      <span>{period.windDirection}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <WeatherIcon
                      condition={period.shortForecast}
                      isDaytime={period.isDaytime}
                      size={80}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                  {period.detailedForecast}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToTop}
            className="mt-8 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to Top
          </button>
        </div>
      </div>
    </section>
  );
}
