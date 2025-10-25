import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { WeatherIcon } from "./icons/WeatherIcon";
import type { CurrentConditions as CurrentConditionsType } from "../types/weather";

interface CurrentConditionsProps {
  conditions: CurrentConditionsType;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
}

export function CurrentConditions({
  conditions,
  onRefresh,
  isRefreshing,
  lastUpdated,
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              {/* Left side - Weather icon and temperature */}
              <div className="flex flex-col items-center md:items-start">
                <div className="mb-4">
                  <WeatherIcon
                    condition={conditions.textDescription}
                    isDaytime={isDaytime}
                    size={120}
                    className="drop-shadow-lg"
                  />
                </div>
                <div className="text-center md:text-left">
                  <div className="text-5xl font-light text-gray-800 mb-2">
                    {tempF}°
                  </div>
                  <div className="text-lg text-gray-600 capitalize mb-1">
                    {conditions.textDescription}
                  </div>
                  {lastUpdated && (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>Updated:</span>
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
                        {formatTime(lastUpdated)}
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
                  )}
                </div>
              </div>

              {/* Right side - Weather details */}
              <div className="flex-1 grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                    Humidity
                  </span>
                  <span className="text-2xl font-medium text-gray-800">
                    {Math.round(conditions.relativeHumidity)}%
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                    Wind Speed
                  </span>
                  <span className="text-2xl font-medium text-gray-800">
                    {conditions.windSpeed}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                    Wind Direction
                  </span>
                  <span className="text-2xl font-medium text-gray-800">
                    {getWindDirection(conditions.windDirection)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                    Dew Point
                  </span>
                  <span className="text-2xl font-medium text-gray-800">
                    {Math.round(
                      tempF - (100 - conditions.relativeHumidity) / 5,
                    )}
                    °
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getWindDirection(degrees: number): string {
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
    "West by Northwest",
    "Northwest",
    "North by Northwest",
  ];

  const index = Math.round(((degrees + 22.5) % 360) / 22.5);
  return directions[index];
}
