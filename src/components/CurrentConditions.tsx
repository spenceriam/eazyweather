import { WeatherIcon } from "./icons/WeatherIcon";
import type { CurrentConditions as CurrentConditionsType } from "../types/weather";

interface CurrentConditionsProps {
  conditions: CurrentConditionsType;
}

export function CurrentConditions({ conditions }: CurrentConditionsProps) {
  const tempF =
    conditions.temperatureUnit === "C"
      ? Math.round((conditions.temperature * 9) / 5 + 32)
      : Math.round(conditions.temperature);

  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 20;

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section id="current" className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                  <div className="text-sm text-gray-400">
                    Updated:{" "}
                    {new Date(conditions.timestamp).toLocaleTimeString()}
                  </div>
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
                    Wind
                  </span>
                  <span className="text-2xl font-medium text-gray-800">
                    {conditions.windSpeed}
                  </span>
                </div>

                <div className="flex flex-col col-span-2">
                  <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                    Wind Direction
                  </span>
                  <span className="text-2xl font-medium text-gray-800">
                    {getWindDirection(conditions.windDirection)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={scrollToTop}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to Top
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function getWindDirection(degrees: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
