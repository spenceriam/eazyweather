import { useState } from "react";
import { WeatherIcon } from "../icons/WeatherIcon";
import type { CardBodyProps } from "./registry";
import type { MonthlyDay } from "../../types/weather";

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

const DOW_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const CELL_BG: Record<MonthlyDay["dataType"], string> = {
  historical: "bg-calh",
  forecast: "bg-calf",
  prediction: "bg-calp",
};

interface CalendarCell {
  key: string;
  /** null = leading blank cell before day 1 (panel background). */
  day: MonthlyDay | null;
  isToday: boolean;
}

/**
 * Temperature label per the design: historical/prediction days show
 * "Avg N°", the 7-day-forecast window shows a plain "N°". The "Avg "
 * prefix is dropped on mobile (the design's isMobile branch), done here
 * with responsive classes rather than JS viewport state.
 */
function TemperatureLabel({ day }: { day: MonthlyDay }) {
  return (
    <span className="text-[9.5px] md:text-[11px] font-[650] text-ink2 whitespace-nowrap">
      {day.dataType !== "forecast" && <span className="hidden md:inline">Avg </span>}
      {day.temperature}&deg;
    </span>
  );
}

/**
 * Monthly calendar card per the design: collapsed-border 7-column grid,
 * kind-tinted cells, today ring, and a "Full month" toggle. The default
 * (collapsed) view is a two-week slice centered on today's week; expanded
 * shows the whole month.
 */
export function MonthlyCard({ data }: CardBodyProps) {
  const [expanded, setExpanded] = useState(false);
  const forecast = data.monthlyForecast;

  if (!forecast || forecast.days.length === 0) {
    return (
      <div>
        <span className="font-serif text-base font-semibold text-ink2">Monthly forecast</span>
        <p className="text-sm text-mut py-4 text-center">Monthly forecast unavailable</p>
      </div>
    );
  }

  // Grid-position math ported from the pre-redesign MonthlyForecast component.
  // "Today" is computed in the FORECAST LOCATION's timezone, not the
  // viewer's — a viewer several zones away would otherwise see the today
  // ring on the wrong cell for part of each day.
  const startDay = new Date(forecast.year, forecast.month, 1).getDay();
  let todayYear: number;
  let todayMonth: number; // 0-indexed to match forecast.month
  let todayDay: number;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: data.timezone || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(new Date())
      .split("-");
    todayYear = Number(parts[0]);
    todayMonth = Number(parts[1]) - 1;
    todayDay = Number(parts[2]);
  } catch {
    const now = new Date();
    todayYear = now.getFullYear();
    todayMonth = now.getMonth();
    todayDay = now.getDate();
  }
  const isCurrentMonth = todayMonth === forecast.month && todayYear === forecast.year;
  const todayDate = isCurrentMonth ? todayDay : null;

  const allCells: CalendarCell[] = [
    ...Array.from({ length: startDay }, (_, index): CalendarCell => ({
      key: `blank-${index}`,
      day: null,
      isToday: false,
    })),
    ...forecast.days.map(
      (day): CalendarCell => ({
        key: `day-${day.date}`,
        day,
        isToday: day.date === todayDate,
      })
    ),
  ];

  // Design's default view: the week containing today plus the week before,
  // sliced from the array that includes the leading blanks. When the month
  // being shown isn't the current one, fall back to the first two weeks
  // (weekIdx = 1 makes the slice [0, 14)).
  const weekIdx =
    todayDate != null ? Math.floor((startDay + todayDate - 1) / 7) : 1;
  const cells = expanded
    ? allCells
    : allCells.slice(Math.max(0, weekIdx - 1) * 7, (weekIdx + 1) * 7);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-serif text-base font-semibold text-ink2">
          Monthly forecast &mdash; {MONTH_NAMES[forecast.month]} {forecast.year}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="border-0 bg-transparent p-0 text-xs font-[650] text-link cursor-pointer"
        >
          {expanded ? "Show this week" : "Full month →"}
        </button>
      </div>

      <div className="grid grid-cols-7 mt-3 border-l border-t border-hair">
        {DOW_LABELS.map((label) => (
          <span
            key={label}
            className="px-[5px] py-[5px] md:px-2 md:py-[6px] text-[10px] font-bold text-mut bg-panel border-r border-b border-hair"
          >
            {label}
          </span>
        ))}

        {cells.map((cell) => (
          <div
            key={cell.key}
            className={`min-h-[48px] md:min-h-[76px] px-[5px] py-1 md:px-2 md:py-[6px] flex flex-col min-w-0 border-r border-b border-hair ${
              cell.day ? CELL_BG[cell.day.dataType] : "bg-panel"
            }`}
            style={cell.isToday ? { boxShadow: "inset 0 0 0 2px var(--brand)" } : undefined}
          >
            {cell.day && (
              <>
                <span className="text-[10px] font-bold text-mut">{cell.day.date}</span>
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 w-full min-w-0">
                  <span className="hidden md:block">
                    <WeatherIcon condition={cell.day.condition} isDaytime size={18} />
                  </span>
                  <span className="md:hidden">
                    <WeatherIcon condition={cell.day.condition} isDaytime size={14} />
                  </span>
                  <TemperatureLabel day={cell.day} />
                  <span className="hidden md:block max-w-full text-[10px] text-soft text-center leading-[1.2] truncate">
                    {cell.day.condition}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
        <span className="flex items-center gap-[5px] text-[11px] text-mut2">
          <span
            className="w-[9px] h-[9px] rounded-control bg-calh border border-calhb"
            aria-hidden="true"
          />
          Observed
        </span>
        <span className="flex items-center gap-[5px] text-[11px] text-mut2">
          <span
            className="w-[9px] h-[9px] rounded-control bg-calf border border-calfb"
            aria-hidden="true"
          />
          7-day forecast
        </span>
        <span className="flex items-center gap-[5px] text-[11px] text-mut2">
          <span
            className="w-[9px] h-[9px] rounded-control bg-calp border border-calpb"
            aria-hidden="true"
          />
          Historical average
        </span>
        <span className="flex items-center gap-[5px] text-[11px] text-mut2">
          <span
            className="w-[9px] h-[9px] rounded-control"
            style={{ background: "var(--surface)", border: "2px solid var(--brand)" }}
            aria-hidden="true"
          />
          Today
        </span>
      </div>
    </div>
  );
}
