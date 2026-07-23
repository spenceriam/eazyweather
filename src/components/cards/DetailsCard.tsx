import type { CardBodyProps } from "./registry";
import {
  degreesToAbbreviatedDirection,
  formatWindDisplay,
  toFahrenheit,
} from "../../utils/weatherHelpers";

interface StatEntry {
  label: string;
  value: string;
}

function formatClockTime(iso: string | undefined, timezone: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone || undefined,
  });
}

/**
 * Label/value grid of real current-conditions stats in the design's
 * two-column layout. Rows whose fields aren't present on this observation
 * (dew point, pressure, sunrise/sunset) are omitted rather than shown with
 * placeholder values.
 */
export function DetailsCard({ data }: CardBodyProps) {
  const current = data.currentConditions;

  if (!current) {
    return (
      <div>
        <span className="font-serif text-base font-semibold text-ink2">Details</span>
        <p className="text-sm text-mut mt-3">Details unavailable</p>
      </div>
    );
  }

  // QC-failed station fields arrive as null — rows are omitted rather than
  // rendering fabricated zeros.
  const stats: StatEntry[] = [
    {
      label: "Wind",
      value: formatWindDisplay(
        current.windSpeedValue ?? 0,
        degreesToAbbreviatedDirection(current.windDirection),
      ),
    },
  ];

  if (current.relativeHumidity != null) {
    stats.push({ label: "Humidity", value: `${Math.round(current.relativeHumidity)}%` });
  }

  if (current.dewpoint != null) {
    // NWS observations report dew point in Celsius; convert before display.
    stats.push({
      label: "Dew point",
      value: `${Math.round(toFahrenheit(current.dewpoint, current.temperatureUnit))}°`,
    });
  }

  if (current.pressureInHg != null) {
    stats.push({ label: "Pressure", value: `${current.pressureInHg.toFixed(2)} in` });
  }

  const sunrise = formatClockTime(current.sunriseTime, data.timezone);
  if (sunrise) {
    stats.push({ label: "Sunrise", value: sunrise });
  }

  const sunset = formatClockTime(current.sunsetTime, data.timezone);
  if (sunset) {
    stats.push({ label: "Sunset", value: sunset });
  }

  // Hairline under every visual row of the 2-column grid except the last.
  const lastRowStart = stats.length - (stats.length % 2 === 0 ? 2 : 1);

  return (
    <div>
      <span className="font-serif text-base font-semibold text-ink2">Details</span>
      <div className="grid grid-cols-2 gap-x-[22px] gap-y-[10px] mt-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={
              index < lastRowStart
                ? "flex justify-between items-baseline border-b border-hair pb-2"
                : "flex justify-between items-baseline"
            }
          >
            <span className="text-[11.5px] text-mut font-[550]">{stat.label}</span>
            <span className="text-[13px] font-[650] text-ink2 tabular-nums">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
