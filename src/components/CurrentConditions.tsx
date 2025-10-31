import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { WeatherIcon } from "./icons/WeatherIcon";
import type {
  CurrentConditions as CurrentConditionsType,
  HourlyForecast as HourlyForecastType,
} from "../types/weather";

interface CurrentConditionsProps {
  conditions: CurrentConditionsType;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
  hourlyForecast?: HourlyForecastType[];
  timezone?: string;
}

export function CurrentConditions({
  conditions,
  onRefresh,
  isRefreshing,
  lastUpdated,
  hourlyForecast,
  timezone,
}: CurrentConditionsProps) {
  const [is24Hour, setIs24Hour] = useState(false);

  const tempF =
    conditions.temperatureUnit === "C"
      ? Math.round((conditions.temperature * 9) / 5 + 32)
      : Math.round(conditions.temperature);

  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;

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

  const toggleTimeFormat = () => {
    setIs24Hour(!is24Hour);
  };

  // Temporal helper functions for day context
  const getDaysDifference = (timestamp: string): number => {
    const date = new Date(timestamp);
    const today = new Date();

    // Get the date strings (e.g., "2025-10-31") which are timezone-independent
    // This avoids all timezone calculation issues
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Parse both as UTC midnight to avoid any timezone issues
    const dateUTC = new Date(dateStr + 'T00:00:00Z');
    const todayUTC = new Date(todayStr + 'T00:00:00Z');

    // Calculate difference in days
    const diffInMs = dateUTC.getTime() - todayUTC.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

    return diffInDays;
  };

  const isToday = (timestamp: string): boolean => {
    return getDaysDifference(timestamp) === 0;
  };

  const isTomorrow = (timestamp: string): boolean => {
    return getDaysDifference(timestamp) === 1;
  };

  const getDayOfWeek = (timestamp: string): string => {
    const date = new Date(timestamp);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[date.getDay()];
  };

  const formatTimeWithDay = (
    timestamp: string,
    includeTimezone: boolean = false,
  ): string => {
    if (!timestamp) return "N/A";

    const formattedTime = formatTime(timestamp, includeTimezone);
    const daysDiff = getDaysDifference(timestamp);

    if (daysDiff === 1) {
      // Tomorrow
      return `tomorrow at ${formattedTime}`;
    } else if (daysDiff === 0) {
      // Today
      return formattedTime;
    } else if (daysDiff > 1) {
      // 2+ days in the future
      return `on ${getDayOfWeek(timestamp)} at ${formattedTime}`;
    } else {
      // In the past (shouldn't happen, but handle it)
      return formattedTime;
    }
  };

  // Generate weather trend comments based on hourly forecast
  const getWeatherTrends = () => {
    if (!hourlyForecast || hourlyForecast.length === 0) return [];

    const trends: string[] = [];
    const currentCondition = conditions.textDescription.toLowerCase();

    // Detect current conditions
    const isRaining =
      currentCondition.includes("rain") ||
      currentCondition.includes("drizzle") ||
      currentCondition.includes("shower");
    const isSnowing =
      currentCondition.includes("snow") ||
      currentCondition.includes("flurries");
    const isFoggy =
      currentCondition.includes("fog") || currentCondition.includes("mist");

    // Helper to find when a condition starts in the forecast
    const findConditionStart = (
      conditionTypes: string[],
      startIndex: number = 1,
    ): { timestamp: string; index: number } | null => {
      for (
        let i = startIndex;
        i < Math.min(startIndex + 12, hourlyForecast.length);
        i++
      ) {
        const hour = hourlyForecast[i];
        const condition = hour.shortForecast.toLowerCase();
        if (conditionTypes.some((type) => condition.includes(type))) {
          return { timestamp: hour.startTime, index: i };
        }
      }
      return null;
    };

    // Helper to find when a condition ends in the forecast
    const findConditionEnd = (
      conditionTypes: string[],
      startIndex: number = 1,
    ): string | null => {
      // Search up to 36 hours ahead to catch multi-day events
      for (
        let i = startIndex;
        i < Math.min(startIndex + 36, hourlyForecast.length);
        i++
      ) {
        const hour = hourlyForecast[i];
        const condition = hour.shortForecast.toLowerCase();
        if (!conditionTypes.some((type) => condition.includes(type))) {
          return hour.startTime;
        }
      }
      return null;
    };

    // Process rain conditions
    if (isRaining) {
      // Currently raining - show end time only
      const rainEnd = findConditionEnd(["rain", "drizzle", "shower"]);
      if (rainEnd) {
        trends.push(`Rain to end ${formatTimeWithDay(rainEnd, true)}`);
      } else {
        trends.push("Rain to continue");
      }
    } else {
      // Not currently raining - check if rain is expected
      const rainStartResult = findConditionStart(["rain", "drizzle", "shower"]);
      if (rainStartResult) {
        const rainStart = rainStartResult.timestamp;

        // Search for end starting AFTER the rain starts
        const rainEnd = findConditionEnd(["rain", "drizzle", "shower"], rainStartResult.index + 1);
        const startFormatted = isToday(rainStart)
          ? `later starting at ${formatTime(rainStart, true)}`
          : `${formatTimeWithDay(rainStart, true).replace("at ", "starting at ")}`;

        if (rainEnd) {
          trends.push(
            `Rain expected ${startFormatted} and ending ${formatTimeWithDay(rainEnd, true)}`,
          );
        } else {
          trends.push(`Rain expected ${startFormatted}`);
        }
      }
    }

    // Process snow conditions
    if (isSnowing) {
      // Currently snowing - show end time only
      const snowEnd = findConditionEnd(["snow", "flurries"]);
      if (snowEnd) {
        trends.push(`Snow to end ${formatTimeWithDay(snowEnd, true)}`);
      } else {
        trends.push("Snow to continue");
      }
    } else {
      // Not currently snowing - check if snow is expected
      const snowStartResult = findConditionStart(["snow", "flurries"]);
      if (snowStartResult) {
        const snowStart = snowStartResult.timestamp;
        // Search for end starting AFTER the snow starts
        const snowEnd = findConditionEnd(["snow", "flurries"], snowStartResult.index + 1);
        const startFormatted = isToday(snowStart)
          ? `later starting at ${formatTime(snowStart, true)}`
          : `${formatTimeWithDay(snowStart, true).replace("at ", "starting at ")}`;

        if (snowEnd) {
          trends.push(
            `Snow expected ${startFormatted} and ending ${formatTimeWithDay(snowEnd, true)}`,
          );
        } else {
          trends.push(`Snow expected ${startFormatted}`);
        }
      }
    }

    // Process fog conditions
    if (isFoggy) {
      // Currently foggy - show end time only
      const fogEnd = findConditionEnd(["fog", "mist"]);
      if (fogEnd) {
        trends.push(`Fog to clear ${formatTimeWithDay(fogEnd, true)}`);
      } else {
        trends.push("Fog to continue");
      }
    } else {
      // Not currently foggy - check if fog is expected
      const fogStartResult = findConditionStart(["fog", "mist"]);
      if (fogStartResult) {
        const fogStart = fogStartResult.timestamp;
        // Search for end starting AFTER the fog starts
        const fogEnd = findConditionEnd(["fog", "mist"], fogStartResult.index + 1);
        const startFormatted = isToday(fogStart)
          ? `later starting at ${formatTime(fogStart, true)}`
          : `${formatTimeWithDay(fogStart, true).replace("at ", "starting at ")}`;

        if (fogEnd) {
          trends.push(
            `Fog expected ${startFormatted} and clearing ${formatTimeWithDay(fogEnd, true)}`,
          );
        } else {
          trends.push(`Fog expected ${startFormatted}`);
        }
      }
    }

    return trends;
  };

  const getWindDirection = (degrees: number): string => {
    const directions = [
      "North",
      "North by Northeast",
      "Northeast",
      "East by Northeast",
      "East",
      "East by Southeast",
      "Southeast",
      "South by Southeast",
      "South",
      "South by Southwest",
      "Southwest",
      "West by Southwest",
      "West",
      "West by Northwest",
      "Northwest",
      "North by Northwest",
    ];

    const index = Math.round(((degrees + 22.5) % 360) / 22.5);
    return directions[index];
  };

  const getRealFeel = () => {
    // Use heat index if available (summer), wind chill if available (winter), otherwise regular temp
    if (conditions.heatIndex) {
      return Math.round(
        conditions.temperatureUnit === "C"
          ? (conditions.heatIndex * 9) / 5 + 32
          : conditions.heatIndex,
      );
    } else if (conditions.windChill) {
      return Math.round(
        conditions.temperatureUnit === "C"
          ? (conditions.windChill * 9) / 5 + 32
          : conditions.windChill,
      );
    } else {
      return tempF;
    }
  };

  const getDewPoint = () => {
    if (conditions.dewpoint) {
      return Math.round(
        conditions.temperatureUnit === "C"
          ? (conditions.dewpoint * 9) / 5 + 32
          : conditions.dewpoint,
      );
    }
    // Fallback calculation if not available from API
    return Math.round(tempF - (100 - conditions.relativeHumidity) / 5);
  };

  const getWindDisplay = () => {
    if (conditions.windSpeedValue === 0) {
      return "Calm";
    }

    let windText = `${Math.round(conditions.windSpeedValue || 0)} mph ${getWindDirection(conditions.windDirection)}`;

    if (
      conditions.windGust &&
      conditions.windSpeedValue &&
      conditions.windGust > conditions.windSpeedValue
    ) {
      windText += `, gusts ${Math.round(conditions.windGust)} mph`;
    }

    return windText;
  };

  const getSnowDepth = () => {
    if (conditions.snowDepth && conditions.snowDepth > 0) {
      return `${Math.round(conditions.snowDepth)} in`;
    }
    return null;
  };

  const getSunrise = () => {
    if (conditions.sunriseTime) {
      return formatTime(conditions.sunriseTime, false);
    }
    return "N/A";
  };

  const getSunset = () => {
    if (conditions.sunsetTime) {
      return formatTime(conditions.sunsetTime, false);
    }
    return "N/A";
  };

  const trends = getWeatherTrends();

  return (
    <section id="current" className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Current Conditions
            </h2>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Main weather display */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4">
                <WeatherIcon
                  condition={conditions.textDescription}
                  isDaytime={isDaytime}
                  size={120}
                  className="drop-shadow-lg"
                />
              </div>
              <div className="text-5xl font-light text-gray-800 mb-2">
                {tempF}°
              </div>
              <div className="text-lg text-gray-600 capitalize mb-2">
                {conditions.textDescription}
              </div>

              {/* Weather trends */}
              {trends.length > 0 && (
                <div className="text-sm text-gray-500 space-y-1">
                  {trends.map((trend, index) => (
                    <div key={index}>{trend}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Two-column weather details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Left column */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">High / Low</span>
                  <span className="font-medium text-gray-800">
                    {conditions.todayHigh && conditions.todayLow
                      ? `${Math.round(conditions.todayHigh)}° / ${Math.round(conditions.todayLow)}°`
                      : conditions.todayHigh
                        ? `${Math.round(conditions.todayHigh)}°`
                        : conditions.todayLow
                          ? `${Math.round(conditions.todayLow)}°`
                          : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dew point</span>
                  <span className="font-medium text-gray-800">
                    {getDewPoint()}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Humidity</span>
                  <span className="font-medium text-gray-800">
                    {Math.round(conditions.relativeHumidity)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sunrise</span>
                  <span className="font-medium text-gray-800">
                    {getSunrise()}
                  </span>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Real feel</span>
                  <span className="font-medium text-gray-800">
                    {getRealFeel()}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">UV Index</span>
                  <span className="font-medium text-gray-800">
                    {conditions.uvIndex ?? 0} out of 11
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Wind</span>
                  <span className="font-medium text-gray-800 text-right">
                    {getWindDisplay()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sunset</span>
                  <span className="font-medium text-gray-800">
                    {getSunset()}
                  </span>
                </div>
                {getSnowDepth() && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Snow depth</span>
                    <span className="font-medium text-gray-800">
                      {getSnowDepth()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Updated time - centered at bottom */}
            <div className="flex justify-center items-center gap-2 text-sm mt-4">
              <span className="text-gray-500">Updated</span>
              <button
                onClick={toggleTimeFormat}
                className="font-sans text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                style={{
                  width: "6rem",
                  height: "1.25rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  boxSizing: "border-box",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  verticalAlign: "middle",
                  transform: "translateZ(0)",
                }}
              >
                {lastUpdated ? formatTime(lastUpdated, true) : "N/A"}
              </button>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-1 text-gray-400 hover:text-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    isRefreshing ? "Refreshing..." : "Refresh weather data"
                  }
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
