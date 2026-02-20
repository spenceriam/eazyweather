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

  // Get today's date number for highlighting
  const today = new Date();
  const isCurrentMonth = today.getMonth() === forecast.month && today.getFullYear() === forecast.year;
  const todayDate = isCurrentMonth ? today.getDate() : null;
  const dataTypeStyles = {
    historical: {
      swatch: "bg-blue-100 dark:bg-blue-900/45 border-blue-300 dark:border-blue-700",
      cell: "bg-blue-100 hover:bg-blue-100 dark:bg-blue-900/45 dark:hover:bg-blue-900/55",
    },
    forecast: {
      swatch: "bg-cyan-50 dark:bg-cyan-900/35 border-cyan-200 dark:border-cyan-700",
      cell: "bg-cyan-50 hover:bg-cyan-50 dark:bg-cyan-900/35 dark:hover:bg-cyan-900/45",
    },
    prediction: {
      swatch: "bg-amber-100 dark:bg-amber-800/35 border-amber-300 dark:border-amber-700",
      cell: "bg-amber-100 hover:bg-amber-100 dark:bg-amber-800/35 dark:hover:bg-amber-800/45",
    },
  };

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section id="monthly" className="bg-slate-100 dark:bg-slate-800 scroll-mt-24 md:scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
            Monthly Forecast - {monthNames[forecast.month]} {forecast.year}
          </h2>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border ${dataTypeStyles.historical.swatch}`}></div>
                <span className="text-gray-600 dark:text-gray-300">Historical Data (Avg Temp)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border ${dataTypeStyles.forecast.swatch}`}></div>
                <span className="text-gray-600 dark:text-gray-300">7-Day Forecast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border ${dataTypeStyles.prediction.swatch}`}></div>
                <span className="text-gray-600 dark:text-gray-300">Historical Projection (Avg Temp)</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Calendar header */}
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="px-2 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
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
                  className="min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0 bg-gray-50 dark:bg-gray-800"
                />
              ))}

              {/* Calendar days */}
              {forecast.days.map((day) => {
                const bgColor =
                  day.dataType === "historical"
                    ? dataTypeStyles.historical.cell
                    : day.dataType === "forecast"
                      ? dataTypeStyles.forecast.cell
                      : dataTypeStyles.prediction.cell;
                const temperatureLabel =
                  day.dataType === "historical" || day.dataType === "prediction"
                    ? `Avg ${day.temperature}°`
                    : `${day.temperature}°`;

                const isToday = day.date === todayDate;
                const todayBorder = isToday ? "border-2 border-gray-900 dark:border-gray-200" : "";

                return (
                <div
                  key={day.date}
                  className={`min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0 p-2 ${bgColor} ${todayBorder} transition-colors`}
                >
                  <div className="flex flex-col items-start justify-between h-full">
                    <div className="text-sm font-bold text-slate-700 dark:text-gray-100 w-full">
                      {day.date}
                    </div>

                    <div className="flex flex-col items-center gap-1 w-full">
                      <WeatherIcon
                        condition={day.condition}
                        isDaytime={true}
                        size={32}
                      />
                      <div className="text-xs font-medium text-slate-800 dark:text-gray-100">
                        {temperatureLabel}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-gray-300 text-center leading-tight max-w-full truncate w-full">
                      {day.condition}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
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
