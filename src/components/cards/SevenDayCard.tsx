import { useState } from "react";
import type { CSSProperties } from "react";
import { WeatherIcon } from "../icons/WeatherIcon";
import { PrecipValue } from "./PrecipValue";
import type { CardBodyProps } from "./registry";
import type { ForecastPeriod } from "../../types/weather";

interface DayRow {
  label: string;
  day: ForecastPeriod;
  night: ForecastPeriod | null;
  low: number;
  high: number;
}

// Temp-bar domain from the design: lo0 = 64, span = 28.
const DOMAIN_LOW = 64;
const DOMAIN_SPAN = 28;
const HOT_HIGH_THRESHOLD = 88;

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", { weekday: "short" });

/**
 * Groups the flat 14-period NWS forecast array into up to 7 calendar-day
 * rows, pairing each daytime period with the night period immediately
 * following it. A lone leading night-only period (the array occasionally
 * starts with "Tonight" for late-day fetches) is skipped since it has no
 * daytime partner to anchor a row. Labels follow the design's daysRaw:
 * "Today" first, then short weekday names ("Tue", "Wed", ...).
 */
function buildDayRows(forecast: ForecastPeriod[]): DayRow[] {
  const rows: DayRow[] = [];

  for (let i = 0; i < forecast.length && rows.length < 7; i++) {
    const period = forecast[i];
    if (!period.isDaytime) continue;

    const next = forecast[i + 1];
    const night = next && !next.isDaytime ? next : null;

    let label: string;
    if (rows.length === 0) {
      label = "Today";
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

function precipChance(period: ForecastPeriod): number {
  return period.probabilityOfPrecipitation?.value ?? 0;
}

/** Mini segmented toggle button, from the design's vBtn(). */
function toggleButtonStyle(selected: boolean, first: boolean): CSSProperties {
  return {
    height: "24px",
    padding: "0 10px",
    border: `1px solid ${selected ? "var(--brand)" : "var(--panelbrd)"}`,
    borderRadius: first ? "2px 0 0 2px" : "0 2px 2px 0",
    marginLeft: first ? "0" : "-1px",
    background: selected ? "var(--brand)" : "var(--surface)",
    color: selected ? "var(--brandink)" : "var(--soft)",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

/**
 * Lo-to-hi range bar on a fixed 64-92 degree domain, per the design's
 * barStyle math. Positions are clamped to the track so out-of-domain
 * temps never overflow. The gradient warms to a hotter orange when the
 * high reaches 88.
 */
function TempRangeBar({ low, high }: { low: number; high: number }) {
  const rawLeft = ((low - DOMAIN_LOW) / DOMAIN_SPAN) * 100;
  const rawWidth = ((high - low) / DOMAIN_SPAN) * 100;
  const left = Math.min(100, Math.max(0, rawLeft));
  const width = Math.min(100 - left, Math.max(0, rawWidth));
  const gradient = `linear-gradient(90deg,#86B1D4,${high >= HOT_HIGH_THRESHOLD ? "#E07B28" : "#EBA83F"})`;

  return (
    <div className="relative flex-none h-[5px] rounded-full bg-barbg w-16 md:w-[120px]">
      <div
        className="absolute inset-y-0 rounded-full"
        style={{ left: `${left}%`, width: `${width}%`, background: gradient }}
      />
    </div>
  );
}

export function SevenDayCard({ data, variant, onVariantChange }: CardBodyProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const rows = buildDayRows(data.forecast);
  // Stored pref values are "rows" | "columns"; anything that isn't "columns" renders as rows.
  const isRows = variant !== "columns";

  const header = (
    <div className="flex items-center justify-between gap-2">
      <span className="font-serif text-base font-semibold text-ink2">Next 7 days</span>
      <div className="flex">
        <button
          type="button"
          onClick={() => onVariantChange?.("rows")}
          aria-pressed={isRows}
          style={toggleButtonStyle(isRows, true)}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => onVariantChange?.("columns")}
          aria-pressed={!isRows}
          style={toggleButtonStyle(!isRows, false)}
        >
          Tiles
        </button>
      </div>
    </div>
  );

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        {header}
        <p className="text-sm text-mut py-4 text-center">7-day forecast unavailable</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {header}

      {isRows ? (
        <div className="flex-1 flex flex-col justify-evenly">
          <div className="hidden md:flex items-center gap-[11px] pt-2">
            <span className="w-11 flex-none" />
            <span className="w-[65px] flex-none text-center text-[9px] font-bold tracking-[0.08em] text-mut">
              DAY
            </span>
            <span className="w-[58px] flex-none pl-3 text-center text-[9px] font-bold tracking-[0.08em] text-mut">
              NIGHT
            </span>
          </div>

          {rows.map((row, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div key={row.day.number} className={index > 0 ? "border-t border-hair" : undefined}>
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center gap-[11px] py-2 text-left hover:bg-panel/40 transition-colors"
                >
                  <span className="w-11 flex-none text-[13px] font-[650] text-ink2">{row.label}</span>

                  <WeatherIcon
                    condition={row.day.shortForecast}
                    isDaytime
                    size={24}
                    className="flex-none"
                  />
                  <span className="w-[30px] flex-none text-right text-[11.5px]">
                    <PrecipValue
                      probability={precipChance(row.day)}
                      shortForecast={row.day.shortForecast}
                    />
                  </span>

                  <span className="hidden md:flex items-center gap-1.5 w-[58px] flex-none pl-3 border-l border-hair">
                    {row.night && (
                      <>
                        <WeatherIcon
                          condition={row.night.shortForecast}
                          isDaytime={false}
                          size={20}
                          className="flex-none"
                        />
                        <span className="text-[11px] opacity-75">
                          <PrecipValue
                            probability={precipChance(row.night)}
                            shortForecast={row.night.shortForecast}
                            iconSize={8.5}
                          />
                        </span>
                      </>
                    )}
                  </span>

                  <span className="flex-1" />

                  <span className="text-[13px] text-mut">{Math.round(row.low)}&deg;</span>
                  <TempRangeBar low={row.low} high={row.high} />
                  <span className="text-[13px] font-bold text-ink2">{Math.round(row.high)}&deg;</span>
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
      ) : (
        <div className="flex-1 flex items-stretch mt-2.5 overflow-x-auto" data-hscroll>
          {rows.map((row) => (
            <div
              key={row.day.number}
              className="flex-1 min-w-[74px] flex flex-col items-center justify-evenly gap-1.5 py-3 px-1.5 border-l border-hair"
            >
              <span className="text-xs font-bold text-ink2">{row.label}</span>
              <WeatherIcon
                condition={row.day.shortForecast}
                isDaytime
                size={34}
                className="flex-none"
              />
              <div className="flex items-baseline gap-[5px]">
                <span className="text-base font-bold text-ink">{Math.round(row.high)}&deg;</span>
                <span className="text-[12.5px] text-mut">{Math.round(row.low)}&deg;</span>
              </div>
              <span className="text-[10.5px] text-soft text-center leading-[1.3]">
                {row.day.shortForecast}
              </span>
              <span className="h-3.5 text-[11px]">
                <PrecipValue
                  probability={precipChance(row.day)}
                  shortForecast={row.day.shortForecast}
                />
              </span>
              <div className="w-[60%] border-t border-hair" />
              <div className="flex items-center gap-[5px]">
                {row.night && (
                  <>
                    <WeatherIcon
                      condition={row.night.shortForecast}
                      isDaytime={false}
                      size={20}
                      className="flex-none"
                    />
                    <span className="text-[10.5px] opacity-80">
                      <PrecipValue
                        probability={precipChance(row.night)}
                        shortForecast={row.night.shortForecast}
                        iconSize={8.5}
                      />
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
