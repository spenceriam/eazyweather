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

  // Generate weather trend comments based on hourly forecast
  const getWeatherTrends = () => {
    if (!hourlyForecast || hourlyForecast.length === 0) return [];

    // Helper function to find when condition starts
    const findConditionStart = (
      conditionType: string,
      conditionName: string,
      verb: string = "beginning",
      startIndex: number = 1,
    ): string | null => {
      const searchHours = hourlyForecast.slice(
        startIndex,
        Math.min(startIndex + 12, hourlyForecast.length),
      );

      for (const hour of searchHours) {
        const condition = hour.shortForecast.toLowerCase();
        if (conditionType.split(",").some((type) => condition.includes(type))) {
          return `${conditionName} ${verb} ${formatTime(hour.startTime, true)}`;
        }
      }
      return null;
    };

    // Helper function to find when condition ends
    const findConditionEnd = (
      conditionTypes: string[],
      conditionName: string,
      startIndex: number = 1,
    ): string | null => {
      for (
        let i = startIndex!;
        i < Math.min(startIndex + 12, hourlyForecast.length);
        i++
      ) {
        const nextHour = hourlyForecast[i];
        const nextCondition = nextHour.shortForecast.toLowerCase();

        if (!conditionTypes.some((type) => nextCondition.includes(type))) {
          return `${conditionName} to end by ${formatTime(nextHour.startTime, true)}`;
        }
      }
      return null;
    };

    if (!hourlyForecast || hourlyForecast.length === 0) return [];

    const trends: string[] = [];
    const currentCondition = conditions.textDescription.toLowerCase();
    const isRaining =
      currentCondition.includes("rain") ||
      currentCondition.includes("drizzle") ||
      currentCondition.includes("shower");
    const isSnowing =
      currentCondition.includes("snow") ||
      currentCondition.includes("flurries");
    const isFoggy =
      currentCondition.includes("fog") || currentCondition.includes("mist");

    // Get weather events within next 12 hours
    const rainEvents: { start?: string; end?: string } = {};
    const snowEvents: { start?: string; end?: string } = {};
    const fogEvents: { start?: string; end?: string } = {};

    // Find rain events
    const searchHours = hourlyForecast.slice(
      1,
      Math.min(13, hourlyForecast.length),
    );
    for (const hour of searchHours) {
      const condition = hour.shortForecast.toLowerCase();
      const hasRain = ["rain", "drizzle", "shower"].some((type) =>
        condition.includes(type),
      );

      if (hasRain && !rainEvents.start) {
        rainEvents.start = formatTime(hour.startTime, true);
      } else if (!hasRain && rainEvents.start && !rainEvents.end) {
        rainEvents.end = formatTime(hour.startTime, true);
      }
    }

    // Find snow events
    for (const hour of searchHours) {
      const condition = hour.shortForecast.toLowerCase();
      const hasSnow = ["snow", "flurries"].some((type) =>
        condition.includes(type),
      );

      if (hasSnow && !snowEvents.start) {
        snowEvents.start = formatTime(hour.startTime, true);
      } else if (!hasSnow && snowEvents.start && !snowEvents.end) {
        snowEvents.end = formatTime(hour.startTime, true);
      }
    }

    // Find fog events
    for (const hour of searchHours) {
      const condition = hour.shortForecast.toLowerCase();
      const hasFog = ["fog", "mist"].some((type) => condition.includes(type));

      if (hasFog && !fogEvents.start) {
        fogEvents.start = formatTime(hour.startTime, true);
      } else if (!hasFog && fogEvents.start && !fogEvents.end) {
        fogEvents.end = formatTime(hour.startTime, true);
      }
    }

    // Display consolidated weather information
    if (isRaining) {
      trends.push(`Rain beginning ${rainEvents.start}`);

      const rainEnd = findConditionEnd(
        ["rain", "drizzle", "shower"],
        "Rain",
        1,
      );
      if (rainEnd) {
        trends.push(rainEnd);
      } else {
        trends.push("Rain to continue");
      }

      // Check for next rain period
      const nextRainStart = findConditionStart(
        "rain,drizzle,shower",
        "Rain",
        "beginning",
        2,
      );
      if (nextRainStart) {
        trends.push(`Next rain beginning ${nextRainStart}`);
      }
    }

    if (isSnowing) {
      trends.push(`Snow beginning ${snowEvents.start}`);

      const snowEnd = findConditionEnd(["snow", "flurries"], "Snow", 1);
      if (snowEnd) {
        trends.push(snowEnd);
      } else {
        trends.push("Snow to continue");
      }

      const nextSnowStart = findConditionStart(
        "snow,flurries",
        "Snow",
        "beginning",
        2,
      );
      if (nextSnowStart) {
        trends.push(`Next snow beginning ${nextSnowStart}`);
      }
    }

    if (isFoggy) {
      trends.push(`Fog developing ${fogEvents.start}`);

      const fogEnd = findConditionEnd(["fog", "mist"], "Fog", 1);
      if (fogEnd) {
        trends.push(fogEnd.replace("to end by", "to clear by"));
      } else {
        trends.push("Fog to continue");
      }

      const nextFogStart = findConditionStart(
        "fog,mist",
        "Fog",
        "developing",
        2,
      );
      if (nextFogStart) {
        trends.push(`Next fog developing ${nextFogStart}`);
      }
    }

    // If currently clear, show upcoming events
    if (!isRaining && !isSnowing && !isFoggy) {
      if (rainEvents.start) {
        const rainEnd = findConditionEnd(
          ["rain", "drizzle", "shower"],
          "Rain",
          1,
        );
        if (rainEnd) {
          const endTime = rainEnd.replace("Rain to end by ", "");
          trends.push(
            `Rain beginning ${rainEvents.start} and ending ${endTime}`,
          );
        } else {
          trends.push(`Rain beginning ${rainEvents.start}`);
        }
      }

      if (snowEvents.start) {
        const snowEnd = findConditionEnd(["snow", "flurries"], "Snow", 1);
        if (snowEnd) {
          const endTime = snowEnd.replace("Snow to end by ", "");
          trends.push(
            `Snow beginning ${snowEvents.start} and ending ${endTime}`,
          );
        } else {
          trends.push(`Snow beginning ${snowEvents.start}`);
        }
      }

      if (fogEvents.start) {
        const fogEnd = findConditionEnd(["fog", "mist"], "Fog", 1);
        if (fogEnd) {
          const endTime = fogEnd.replace("Fog to end by ", "");
          trends.push(
            `Fog developing ${fogEvents.start} and clearing ${endTime}`,
          );
        } else {
          trends.push(`Fog developing ${fogEvents.start}`);
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
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
