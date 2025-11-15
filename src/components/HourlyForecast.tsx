import { useState } from "react";
import { WeatherIcon } from "./icons/WeatherIcon";
import type { HourlyForecast as HourlyForecastType } from "../types/weather";

interface HourlyForecastProps {
  forecast: HourlyForecastType[];
  timezone?: string;
}

export function HourlyForecast({ forecast, timezone }: HourlyForecastProps) {
  const [show24Hours, setShow24Hours] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const displayForecast = show24Hours
    ? forecast.slice(0, 24)
    : forecast.slice(24, 48);

  function toggleCard(index: number) {
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: timezone,
    });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone: timezone,
    });
  }

  function isToday(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.toLocaleDateString("en-US", { timeZone: timezone }) ===
      today.toLocaleDateString("en-US", { timeZone: timezone })
    );
  }

  function isTomorrow(dateString: string) {
    const date = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.toLocaleDateString("en-US", { timeZone: timezone }) ===
      tomorrow.toLocaleDateString("en-US", { timeZone: timezone })
    );
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section id="hourly" className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Hourly Forecast
            </h2>
            <button
              onClick={() => setShow24Hours(!show24Hours)}
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
            >
              {show24Hours ? "Show Next 24 Hours" : "Show First 24 Hours"}
            </button>
          </div>

          <div className="space-y-3">
            {displayForecast.map((hour, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => toggleCard(index)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-2">
                      {isToday(hour.startTime) ? (
                        "Today"
                      ) : isTomorrow(hour.startTime) ? (
                        <>
                          {formatDate(hour.startTime)}
                          <div>(Tomorrow)</div>
                        </>
                      ) : (
                        formatDate(hour.startTime)
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      {formatTime(hour.startTime)}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-light text-gray-800">
                        {hour.temperature}°
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {hour.shortForecast}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <WeatherIcon
                      condition={hour.shortForecast}
                      isDaytime={hour.isDaytime}
                      size={60}
                    />
                  </div>
                </div>
                {expandedIndex === index && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {/* Placeholder for Gemma3n summary */}
                      <strong>Summary:</strong> {hour.shortForecast}.
                    </p>
                    <div className="text-sm text-gray-500 mt-2">
                      Wind: {hour.windSpeed}
                    </div>
                  </div>
                )}
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
