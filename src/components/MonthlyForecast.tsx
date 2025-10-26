import { WeatherIcon } from "./icons/WeatherIcon";
import type { MonthlyForecast as MonthlyForecastType } from "../types/weather";

interface MonthlyForecastProps {
  forecast: MonthlyForecastType;
}

export function MonthlyForecast({ forecast }: MonthlyForecastProps) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get the first day of the month and how many days to offset
  const firstDay = new Date(forecast.year, forecast.month, 1);
  const startDay = firstDay.getDay();

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section id="monthly" className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Monthly Forecast - {monthNames[forecast.month]} {forecast.year}
          </h2>

          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-brand-lighter border border-brand-light rounded"></div>
                <span className="text-gray-600">Available Forecast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-gray-600">Estimated Average</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Calendar header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="px-2 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startDay }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="min-h-[100px] border-r border-b border-gray-200 last:border-r-0 bg-gray-50"
                />
              ))}

              {/* Calendar days */}
              {forecast.days.map((day) => (
                <div
                  key={day.date}
                  className={`min-h-[100px] border-r border-b border-gray-200 last:border-r-0 p-2 ${
                    day.isAvailable
                      ? "bg-brand-lighter hover:bg-brand-lighter"
                      : "bg-gray-50 hover:bg-gray-100"
                  } transition-colors`}
                >
                  <div className="flex flex-col items-center justify-between h-full">
                    <div className="text-sm font-medium text-gray-700">
                      {day.date}
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <WeatherIcon
                        condition={day.condition}
                        isDaytime={true}
                        size={32}
                      />
                      <div className="text-xs font-medium text-gray-800">
                        {day.temperature}°
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 text-center leading-tight max-w-full truncate">
                      {day.condition}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p>
              <strong>Note:</strong> Days 1-7 show actual forecast data from the
              National Weather Service. Days 8-31 show estimated averages based
              on the current weather pattern.
            </p>
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
