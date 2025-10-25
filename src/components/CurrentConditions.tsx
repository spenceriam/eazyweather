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
}

export function CurrentConditions({
  conditions,
  onRefresh,
  isRefreshing,
  lastUpdated,
  hourlyForecast,
}: CurrentConditionsProps) {
  const [is24Hour, setIs24Hour] = useState(false);

  const tempF =
    conditions.temperatureUnit === "C"
      ? Math.round((conditions.temperature * 9) / 5 + 32)
      : Math.round(conditions.temperature);

  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;

  const formatTime = (timestamp: string) => {
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

    // For 24-hour, format without leading zeros: "18:20" instead of "18:20"
    if (is24Hour) {
      const [hours, minutes] = timeString.split(":");
      const hourNum = parseInt(hours, 10);
      const formattedHour = hourNum.toString();
      const formattedTime = `${formattedHour}:${minutes.padStart(2, "0")}`;
      return formattedTime;
    } else {
      return timeString;
    }
  };

  const toggleTimeFormat = () => {
    setIs24Hour(!is24Hour);
  };

  // Generate weather trend comments based on hourly forecast
  const getWeatherTrends = () => {
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

    // Check when rain/snow will end
    if (isRaining || isSnowing) {
      for (let i = 1; i < Math.min(12, hourlyForecast.length); i++) {
        const nextHour = hourlyForecast[i];
        const nextCondition = nextHour.shortForecast.toLowerCase();

        if (
          !nextCondition.includes("rain") &&
          !nextCondition.includes("drizzle") &&
          !nextCondition.includes("shower") &&
          !nextCondition.includes("snow") &&
          !nextCondition.includes("flurries")
        ) {
          const endTime = new Date(nextHour.startTime);
          const timeString = is24Hour
            ? endTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
              })
            : endTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

          // Format 24-hour time without leading zeros
          if (is24Hour) {
            const [hours, minutes] = timeString.split(":");
            const hourNum = parseInt(hours, 10);
            const formattedHour = hourNum.toString();
            trends.push(
              `${isRaining ? "Rain" : "Snow"} to end by ${formattedHour}:${minutes.padStart(2, "0")}`,
            );
          } else {
            trends.push(
              `${isRaining ? "Rain" : "Snow"} to end by ${timeString}`,
            );
          }
          break;
        }
      }
      if (trends.length === 0) {
        trends.push(`${isRaining ? "Rain" : "Snow"} to continue`);
      }
    }

    // Check for fog/mist clearing
    if (isFoggy) {
      for (let i = 1; i < Math.min(8, hourlyForecast.length); i++) {
        const nextHour = hourlyForecast[i];
        const nextCondition = nextHour.shortForecast.toLowerCase();

        if (!nextCondition.includes("fog") && !nextCondition.includes("mist")) {
          const endTime = new Date(nextHour.startTime);
          const timeString = is24Hour
            ? endTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
              })
            : endTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

          if (is24Hour) {
            const [hours, minutes] = timeString.split(":");
            const hourNum = parseInt(hours, 10);
            const formattedHour = hourNum.toString();
            trends.push(
              `Fog to clear by ${formattedHour}:${minutes.padStart(2, "0")}`,
            );
          } else {
            trends.push(`Fog to clear by ${timeString}`);
          }
          break;
        }
      }
    }

    // Check when rain/snow will start
    if (!isRaining && !isSnowing && !isFoggy) {
      const nextHours = hourlyForecast.slice(
        1,
        Math.min(8, hourlyForecast.length),
      );
      for (const hour of nextHours) {
        const condition = hour.shortForecast.toLowerCase();
        if (
          condition.includes("rain") ||
          condition.includes("drizzle") ||
          condition.includes("shower")
        ) {
          const startTime = new Date(hour.startTime);
          const timeString = is24Hour
            ? startTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
              })
            : startTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

          if (is24Hour) {
            const [hours, minutes] = timeString.split(":");
            const hourNum = parseInt(hours, 10);
            const formattedHour = hourNum.toString();
            trends.push(
              `Rain beginning ${formattedHour}:${minutes.padStart(2, "0")}`,
            );
          } else {
            trends.push(`Rain beginning ${timeString}`);
          }
          break;
        }

        if (condition.includes("snow") || condition.includes("flurries")) {
          const startTime = new Date(hour.startTime);
          const timeString = is24Hour
            ? startTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
              })
            : startTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

          if (is24Hour) {
            const [hours, minutes] = timeString.split(":");
            const hourNum = parseInt(hours, 10);
            const formattedHour = hourNum.toString();
            trends.push(
              `Snow beginning ${formattedHour}:${minutes.padStart(2, "0")}`,
            );
          } else {
            trends.push(`Snow beginning ${timeString}`);
          }
          break;
        }

        if (condition.includes("fog") || condition.includes("mist")) {
          const startTime = new Date(hour.startTime);
          const timeString = is24Hour
            ? startTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
              })
            : startTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

          if (is24Hour) {
            const [hours, minutes] = timeString.split(":");
            const hourNum = parseInt(hours, 10);
            const formattedHour = hourNum.toString();
            trends.push(
              `Fog developing ${formattedHour}:${minutes.padStart(2, "0")}`,
            );
          } else {
            trends.push(`Fog developing ${timeString}`);
          }
          break;
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
    let windText =
      conditions.windSpeedValue > 0
        ? `${Math.round(conditions.windSpeedValue)} mph`
        : "Calm";

    if (
      conditions.windGust &&
      conditions.windGust > conditions.windSpeedValue
    ) {
      windText += ` gusts ${Math.round(conditions.windGust)} mph`;
    }

    return windText;
  };

  const getSnowDepth = () => {
    if (conditions.snowDepth && conditions.snowDepth > 0) {
      return `${Math.round(conditions.snowDepth)} in`;
    }
    return null;
  };

  const getCloudCeiling = () => {
    if (conditions.cloudCeiling && conditions.cloudCeiling > 0) {
      return `${Math.round(conditions.cloudCeiling)} ft`;
    }
    return "Unlimited";
  };

  const getUVIndex = () => {
    if (conditions.uvIndex !== undefined && conditions.uvIndex >= 0) {
      const index = Math.round(conditions.uvIndex);
      if (index <= 2) return `${index} (Low)`;
      if (index <= 5) return `${index} (Moderate)`;
      if (index <= 7) return `${index} (High)`;
      if (index <= 10) return `${index} (Very High)`;
      return `${index} (Extreme)`;
    }
    return "Low";
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
                  <span className="text-gray-500">Real feel</span>
                  <span className="font-medium text-gray-800">
                    {getRealFeel()}°
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
                  <span className="text-gray-500">Wind</span>
                  <span className="font-medium text-gray-800 text-right">
                    {getWindDisplay()}
                    {conditions.windSpeedValue > 0 && (
                      <span className="block text-xs text-gray-600">
                        {getWindDirection(conditions.windDirection)}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">UV index</span>
                  <span className="font-medium text-gray-800">
                    {getUVIndex()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cloud ceiling</span>
                  <span className="font-medium text-gray-800">
                    {getCloudCeiling()}
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Updated</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleTimeFormat}
                      className="font-sans text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      style={{
                        width: "4.5rem",
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
                      {lastUpdated ? formatTime(lastUpdated) : "N/A"}
                    </button>
                    {onRefresh && (
                      <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          isRefreshing
                            ? "Refreshing..."
                            : "Refresh weather data"
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
          </div>
        </div>
      </div>
    </section>
  );
}
