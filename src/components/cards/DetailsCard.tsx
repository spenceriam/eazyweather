import type { CardDataBag } from "../../types/cardData";
import { degreesToAbbreviatedDirection, formatWindDisplay } from "../../utils/weatherHelpers";

interface CardProps {
  data: CardDataBag;
  variant?: string;
}

interface StatEntry {
  label: string;
  value: string;
}

function Stat({ label, value }: StatEntry) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] text-mut uppercase tracking-[0.04em]">{label}</span>
      <span className="text-sm font-semibold text-ink tabular-nums truncate">{value}</span>
    </div>
  );
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
 * Compact 2-column grid of real current-conditions stats. Rows for fields
 * that aren't present on this observation (dewpoint, gust, sunrise/sunset)
 * are simply omitted rather than shown with placeholder values.
 */
export function DetailsCard({ data }: CardProps) {
  const current = data.currentConditions;

  if (!current) {
    return <p className="text-sm text-mut py-4 text-center">Details unavailable</p>;
  }

  const stats: StatEntry[] = [
    {
      label: "Wind",
      value: formatWindDisplay(
        current.windSpeedValue ?? 0,
        degreesToAbbreviatedDirection(current.windDirection),
      ),
    },
    {
      label: "Humidity",
      value: `${Math.round(current.relativeHumidity)}%`,
    },
  ];

  if (current.dewpoint !== undefined) {
    // NWS reports dewpoint in Celsius; labeled explicitly rather than
    // silently implying Fahrenheit.
    stats.push({ label: "Dew point", value: `${Math.round(current.dewpoint)}°C` });
  }

  if (current.windGust !== undefined) {
    stats.push({ label: "Wind gust", value: `${Math.round(current.windGust)} mph` });
  }

  const sunrise = formatClockTime(current.sunriseTime, data.timezone);
  if (sunrise) {
    stats.push({ label: "Sunrise", value: sunrise });
  }

  const sunset = formatClockTime(current.sunsetTime, data.timezone);
  if (sunset) {
    stats.push({ label: "Sunset", value: sunset });
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {stats.map((stat) => (
        <Stat key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
