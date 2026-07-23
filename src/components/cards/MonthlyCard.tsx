import { useState } from "react";
import { WeatherIcon } from "../icons/WeatherIcon";
import type { CardDataBag } from "../../types/cardData";

interface MonthlyCardProps {
  data: CardDataBag;
  /** Unused — the compressed calendar has no alternate layouts yet. */
  variant?: string;
}

type MonthlyDay = NonNullable<CardDataBag["monthlyForecast"]>["days"][number];

const MONTH_NAMES = [
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CELL_STYLES: Record<MonthlyDay["dataType"], string> = {
  historical: "bg-calh border-calhb",
  forecast: "bg-calf border-calfb",
  prediction: "bg-calp border-calpb",
};

const LEGEND_ITEMS: { type: MonthlyDay["dataType"]; label: string }[] = [
  { type: "historical", label: "Observed" },
  { type: "forecast", label: "7-day forecast" },
  { type: "prediction", label: "Historical average" },
];

/** Builds the calendar temperature label per F10: historical/prediction days are averages. */
function temperatureLabelFor(day: MonthlyDay): string {
  return day.dataType === "historical" || day.dataType === "prediction"
    ? `Avg ${day.temperature}°`
    : `${day.temperature}°`;
}

/**
 * Compressed monthly calendar (F10). Defaults to short ~60px cells showing
 * only date, icon, and temperature; an Expand toggle switches to ~100px
 * cells that add a truncated condition line. Grid-position math (leading
 * blank cells, today highlight) is ported from the pre-redesign
 * MonthlyForecast component.
 */
export function MonthlyCard({ data }: MonthlyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const forecast = data.monthlyForecast;

  if (!forecast || forecast.days.length === 0) {
    return <p className="text-sm text-mut py-4 text-center">Monthly forecast unavailable</p>;
  }

  const startDay = new Date(forecast.year, forecast.month, 1).getDay();

  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === forecast.month && today.getFullYear() === forecast.year;
  const todayDate = isCurrentMonth ? today.getDate() : null;

  const cellHeight = expanded ? "min-h-[100px]" : "min-h-[60px]";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink2">
          {MONTH_NAMES[forecast.month]} {forecast.year}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="text-xs font-semibold text-link hover:underline"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <span
              className={`inline-block w-3 h-3 rounded-control border ${CELL_STYLES[item.type]}`}
              aria-hidden="true"
            />
            <span className="text-[11px] text-mut">{item.label}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 pb-1">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="text-center text-[10px] font-bold uppercase tracking-[0.06em] text-mut"
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-${index}`} className={cellHeight} aria-hidden="true" />
          ))}

          {forecast.days.map((day) => {
            const isToday = day.date === todayDate;

            return (
              <div
                key={day.date}
                className={`${cellHeight} ${CELL_STYLES[day.dataType]} border rounded-control flex flex-col px-1 py-1 transition-colors`}
                style={isToday ? { boxShadow: "inset 0 0 0 2px var(--brand)" } : undefined}
              >
                <span className="w-full text-left text-[10px] font-bold text-ink2 tabular-nums">
                  {day.date}
                </span>

                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-0 min-w-0 w-full">
                  <WeatherIcon condition={day.condition} isDaytime={true} size={expanded ? 24 : 20} />
                  <span className="text-[10px] font-semibold text-ink tabular-nums whitespace-nowrap">
                    {temperatureLabelFor(day)}
                  </span>
                  {expanded && (
                    <span className="w-full text-center text-[9px] leading-tight text-mut truncate px-0.5">
                      {day.condition}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
