import { useState } from "react";
import { WeatherIcon } from "./icons/WeatherIcon";
import type { HourlyForecast as HourlyForecastType } from "../types/weather";

interface HourlyForecastProps {
  forecast: HourlyForecastType[];
  timezone?: string;
}

export function HourlyForecast({ forecast, timezone }: HourlyForecastProps) {
  const [show24Hours, setShow24Hours] = useState(true);

  const displayForecast = show24Hours
    ? forecast.slice(0, 24)
    : forecast.slice(24, 48);

  const [is24Hour, setIs24Hour] = useState(false);

  const getTimezoneAbbreviation = (tz: string): string => {
    if (!tz) return "";

    // Handle common US timezone abbreviations
    switch (tz) {
      case "America/New_York":
      case "America/Detroit":
      case "America/Montreal":
      case "America/Toronto":
        return isDaylightSaving() ? "EDT" : "EST";
      case "America/Chicago":
      case "America/Winnipeg":
      case "America/Mexico_City":
        return isDaylightSaving() ? "CDT" : "CST";
      case "America/Denver":
      case "America/Phoenix":
      case "America/Boise":
        return isDaylightSaving() ? "MDT" : "MST";
      case "America/Los_Angeles":
      case "America/Vancouver":
      case "America/Tijuana":
        return isDaylightSaving() ? "PDT" : "PST";
      default:
        // For other timezones, try to extract from name or use UTC offset
        if (tz.includes("America/")) {
          return isDaylightSaving() ? "EDT" : "EST"; // Default fallback
        }
        return tz;
    }
  };

  const isDaylightSaving = (): boolean => {
    const now = new Date();
    const month = now.getMonth(); // 0-11 (Jan=0, Dec=11)
    const date = now.getDate();

    // Simple DST detection for US (second Sunday in March to first Sunday in November)
    if (month > 2 && month < 10) return true; // April to October
    if (month < 2 || month > 10) return false; // January, February, December

    if (month === 2) {
      // March
      const firstDay = new Date(now.getFullYear(), 2, 1).getDay();
      const secondSunday = 8 + ((7 - firstDay) % 7);
      return date >= secondSunday;
    } else {
      // November
      const firstDay = new Date(now.getFullYear(), 10, 1).getDay();
      const firstSunday = 1 + ((7 - firstDay) % 7);
      return date < firstSunday;
    }
  };

  const formatTime = (timestamp: string, includeTimezone: boolean = false) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);

    const timeString = is24Hour
      ? date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

    // Format 24-hour time without leading zeros
    let formattedTime: string;
    if (is24Hour) {
      const [hours, minutes] = timeString.split(":");
      const hourNum = parseInt(hours, 10);
      const formattedHour = hourNum.toString();
      formattedTime = `${formattedHour}:${minutes.padStart(2, "0")}`;
    } else {
      formattedTime = timeString;
    }

    if (includeTimezone && timezone) {
      const tzAbbr = getTimezoneAbbreviation(timezone);
      return `${formattedTime} ${tzAbbr}`;
    }

    return formattedTime;
  };

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
              const date = new Date(hour.startTime);
              const timeStr = formatTime(hour.startTime, true);
              const dateStr = date.toLocaleDateString("en-US", {
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
