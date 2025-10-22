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
    <section id="hourly" className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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

          <div className="space-y-3">
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
                  {/* Mobile-first layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Top row - Time and Date */}
                    <div className="flex items-center justify-between sm:w-24">
                      <div className="text-lg font-medium text-gray-700">
                        {timeStr}
                      </div>
                      <div className="text-sm text-gray-500 sm:hidden">
                        {dateStr}
                      </div>
                    </div>

                    {/* Middle section - Icon and Temperature */}
                    <div className="flex items-center justify-center gap-4 sm:gap-2">
                      {/* Weather Icon */}
                      <div className="flex items-center justify-center">
                        <WeatherIcon
                          condition={hour.shortForecast}
                          isDaytime={hour.isDaytime}
                          size={48}
                        />
                      </div>

                      {/* Temperature - Centered */}
                      <div className="text-center">
                        <div className="text-2xl font-light text-gray-800">
                          {hour.temperature}°
                        </div>
                      </div>
                    </div>

                    {/* Desktop date - hidden on mobile */}
                    <div className="hidden sm:block w-24 text-right">
                      <div className="text-sm text-gray-500">{dateStr}</div>
                    </div>
                  </div>

                  {/* Second row - Weather Conditions and Wind */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    {/* Weather Conditions */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-600 capitalize text-center sm:text-left">
                        {hour.shortForecast}
                      </div>
                    </div>

                    {/* Wind */}
                    <div className="text-sm text-gray-500">
                      Wind: {hour.windSpeed}
                    </div>
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
      </div>
    </section>
  );
}
