import { useState } from "react";
import { WeatherIcon } from "./icons/WeatherIcon";
import type { HourlyForecast as HourlyForecastType } from "../types/weather";

interface HourlyForecastProps {
  forecast: HourlyForecastType[];
}

export function HourlyForecast({ forecast }: HourlyForecastProps) {
  const [show24Hours, setShow24Hours] = useState(true);

  const displayForecast = show24Hours
    ? forecast.slice(0, 24)
    : forecast.slice(24, 48);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section id="hourly" className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Hourly Forecast
          </h2>
          <button
            onClick={() => setShow24Hours(!show24Hours)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {show24Hours ? "Show Next 24 Hours" : "Show First 24 Hours"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayForecast.map((hour, index) => {
            const time = new Date(hour.startTime);
            const timeStr = time.toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: true,
            });
            const dateStr = time.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-lg font-medium text-gray-700">
                      {timeStr}
                    </div>
                    <div className="text-sm text-gray-500">{dateStr}</div>
                  </div>
                  <div className="text-2xl font-light text-gray-800">
                    {hour.temperature}°
                  </div>
                </div>

                <div className="flex items-center justify-center mb-3">
                  <WeatherIcon
                    condition={hour.shortForecast}
                    isDaytime={hour.isDaytime}
                    size={80}
                  />
                </div>

                <div className="text-sm text-gray-600 text-center mb-2">
                  {hour.shortForecast}
                </div>

                <div className="text-xs text-gray-500 text-center">
                  Wind: {hour.windSpeed}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={scrollToTop}
          className="mt-8 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back to Top
        </button>
      </div>
    </section>
  );
}
