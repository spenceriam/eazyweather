import { useState } from "react";
import { WeatherIcon } from "../icons/WeatherIcon";
import { PrecipValue } from "./PrecipValue";
import type { CardDataBag } from "../../types/cardData";

interface SevenDayCardProps {
  data: CardDataBag;
  /** "rows" (day+night side by side per calendar day) is the only supported layout; any other value falls back to it. */
  variant?: string;
}

interface DayRow {
  label: string;
  day: CardDataBag["forecast"][number];
  night: CardDataBag["forecast"][number] | null;
  low: number;
  high: number;
}

const DOMAIN_LOW = 64;
const DOMAIN_SPAN = 28;
const HOT_HIGH_THRESHOLD = 88;
const COOL_GRADIENT = "linear-gradient(to right, #86B1D4, #EBA83F)";
const HOT_GRADIENT = "linear-gradient(to right, #86B1D4, #E07B28)";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", { weekday: "long" });

/**
 * Groups the flat 14-period NWS forecast array into up to 7 calendar-day
 * rows, pairing each daytime period with the night period immediately
 * following it. A lone leading night-only period (the array occasionally
 * starts with "Tonight" for late-day fetches) is skipped since it has no
 * daytime partner to anchor a row.
 */
function buildDayRows(forecast: CardDataBag["forecast"]): DayRow[] {
  const rows: DayRow[] = [];

  for (let i = 0; i < forecast.length && rows.length < 7; i++) {
    const period = forecast[i];
    if (!period.isDaytime) continue;

    const next = forecast[i + 1];
    const night = next && !next.isDaytime ? next : null;

    let label: string;
    if (rows.length === 0) {
      label = "Today";
    } else if (rows.length === 1) {
      label = "Tomorrow";
    } else {
      const parsed = new Date(period.startTime);
      label = Number.isNaN(parsed.getTime())
        ? period.name
        : WEEKDAY_FORMATTER.format(parsed);
    }

    const temps = night ? [period.temperature, night.temperature] : [period.temperature];
    rows.push({
      label,
      day: period,
      night,
      low: Math.min(...temps),
      high: Math.max(...temps),
    });

    if (night) i++;
  }

  return rows;
}

function TempRangeBar({ low, high }: { low: number; high: number }) {
  const rawLeft = ((low - DOMAIN_LOW) / DOMAIN_SPAN) * 100;
  const rawWidth = ((high - low) / DOMAIN_SPAN) * 100;
  const left = Math.min(100, Math.max(0, rawLeft));
  const width = Math.min(100 - left, Math.max(0, rawWidth));
  const gradient = high >= HOT_HIGH_THRESHOLD ? HOT_GRADIENT : COOL_GRADIENT;

  return (
    <div className="relative h-1.5 bg-panel rounded-full flex-1">
      <div
        className="absolute h-full rounded-full"
        style={{ left: `${left}%`, width: `${width}%`, background: gradient }}
      />
    </div>
  );
}

export function SevenDayCard({ data }: SevenDayCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const rows = buildDayRows(data.forecast);

  if (rows.length === 0) {
    return <p className="text-sm text-mut py-4 text-center">7-day forecast unavailable</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center pb-1.5">
        <div className="w-20 shrink-0" />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-mut">Day</span>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-mut">Night</span>
        </div>
        <div className="w-8 shrink-0" />
        <div className="flex-[1.4] shrink-0" />
        <div className="w-8 shrink-0" />
      </div>

      <div className="flex flex-col divide-y divide-line">
        {rows.map((row, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <div key={row.day.number}>
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                aria-expanded={isExpanded}
                className="w-full flex items-center gap-0 py-2.5 text-left hover:bg-panel/60 transition-colors rounded-control"
              >
                <span className="w-20 shrink-0 text-sm font-semibold text-ink truncate pr-1">
                  {row.label}
                </span>

                <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
                  <WeatherIcon condition={row.day.shortForecast} isDaytime size={22} />
                  <PrecipValue probability={undefined} shortForecast={row.day.shortForecast} />
                </div>

                <div className="hidden md:flex flex-1 items-center justify-center gap-1.5 min-w-0 border-l border-hair pl-1.5 ml-1.5">
                  {row.night ? (
                    <>
                      <WeatherIcon condition={row.night.shortForecast} isDaytime={false} size={22} />
                      <PrecipValue probability={undefined} shortForecast={row.night.shortForecast} />
                    </>
                  ) : (
                    <span className="text-xs text-mut">&mdash;</span>
                  )}
                </div>

                <span className="w-8 shrink-0 text-sm text-mut text-right tabular-nums">
                  {Math.round(row.low)}&deg;
                </span>

                <div className="flex-[1.4] shrink-0 px-2">
                  <TempRangeBar low={row.low} high={row.high} />
                </div>

                <span className="w-8 shrink-0 text-sm font-semibold text-ink tabular-nums">
                  {Math.round(row.high)}&deg;
                </span>
              </button>

              {isExpanded && (
                <div className="pb-3 px-1 space-y-2 text-sm text-ui-body">
                  <p>
                    <span className="font-semibold text-ink2">{row.day.name}: </span>
                    {row.day.detailedForecast}
                  </p>
                  {row.night && (
                    <p>
                      <span className="font-semibold text-ink2">{row.night.name}: </span>
                      {row.night.detailedForecast}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
