import { useId } from "react";
import type { CSSProperties } from "react";
import { WeatherIcon } from "../icons/WeatherIcon";
import { PrecipValue } from "./PrecipValue";
import { useIsDarkTheme } from "../../hooks/useIsDarkTheme";
import type { CardBodyProps } from "./registry";
import type { HourlyForecast } from "../../types/weather";

interface Point {
  x: number;
  y: number;
}

/** The design shows exactly the next 24h window: 14 hourly entries. */
const HOURS_COUNT = 14;

// Meteogram geometry, from the design's meteogram construction.
const VIEW_W = 1000;
const VIEW_H = 148;
const BASE = 138;
const TOP = 22;
const CURVE_COLOR = "#E0862E";

/**
 * Formats an ISO hourly timestamp as a short local hour ("3 PM") in the
 * forecast location's timezone (not the browser's).
 */
function formatHour(iso: string, timezone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  try {
    return date.toLocaleTimeString("en-US", { hour: "numeric", timeZone: timezone });
  } catch {
    return date.toLocaleTimeString("en-US", { hour: "numeric" });
  }
}

/**
 * Index of the current/closest-upcoming hour: the last entry whose
 * startTime has already passed, or 0 if every entry is still in the future.
 * Assumes hourlyForecast is in chronological order (NWS periods are).
 */
function findNowIndex(hours: HourlyForecast[]): number {
  const now = Date.now();
  let idx = 0;
  for (let i = 0; i < hours.length; i++) {
    const t = new Date(hours[i].startTime).getTime();
    if (Number.isNaN(t) || t > now) break;
    idx = i;
  }
  return idx;
}

/**
 * Catmull-Rom-to-cubic-Bezier smoothing (tension /6), ported verbatim from
 * the design's smooth() helper.
 */
function smoothPath(pts: Point[]): string {
  if (pts.length < 2) return "";
  let d = "M" + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d +=
      "C" +
      (p1.x + (p2.x - p0.x) / 6).toFixed(1) +
      " " +
      (p1.y + (p2.y - p0.y) / 6).toFixed(1) +
      " " +
      (p2.x - (p3.x - p1.x) / 6).toFixed(1) +
      " " +
      (p2.y - (p3.y - p1.y) / 6).toFixed(1) +
      " " +
      p2.x.toFixed(1) +
      " " +
      p2.y.toFixed(1);
  }
  return d;
}

function precipProbability(hour: HourlyForecast): number {
  return hour.probabilityOfPrecipitation?.value ?? 0;
}

/**
 * Up to 3 "nice" 5-degree-multiple gridline values within [lo, hi], spread
 * across the range (ends plus middle when more than 3 exist). The design
 * hardcodes 75/80/85 for its 71-88 domain; this derives the equivalent for
 * any real temperature range.
 */
function gridlineTemps(lo: number, hi: number): number[] {
  const first = Math.ceil(lo / 5) * 5;
  const last = Math.floor(hi / 5) * 5;
  const all: number[] = [];
  for (let t = first; t <= last; t += 5) all.push(t);
  if (all.length <= 3) return all;
  const mid = all[Math.floor(all.length / 2)];
  return [all[0], mid, all[all.length - 1]];
}

/** Mini segmented-toggle button style, per the design's vBtn(). */
function vBtnStyle(selected: boolean, first: boolean): CSSProperties {
  return {
    height: "24px",
    padding: "0 10px",
    border: selected ? "1px solid var(--brand)" : "1px solid var(--panelbrd)",
    borderRadius: first ? "2px 0 0 2px" : "0 2px 2px 0",
    marginLeft: first ? 0 : "-1px",
    background: selected ? "var(--brand)" : "var(--surface)",
    color: selected ? "var(--brandink)" : "var(--soft)",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

interface VariantContentProps {
  hours: HourlyForecast[];
  nowIndex: number;
  timezone: string;
}

function ChipsVariant({ hours, nowIndex, timezone }: VariantContentProps) {
  return (
    <div
      data-hscroll
      className="flex items-stretch mt-[2px] overflow-x-hidden max-md:overflow-x-auto max-md:pb-[4px]"
    >
      {hours.map((hour, index) => (
        <div
          key={hour.startTime}
          className={
            index === nowIndex
              ? "flex-[1_1_0%] min-w-0 max-md:flex-[0_0_54px] flex flex-col items-center gap-[6px] pt-[10px] px-[2px] pb-2 rounded-control bg-chip"
              : "flex-[1_1_0%] min-w-0 max-md:flex-[0_0_54px] flex flex-col items-center gap-[6px] pt-[10px] px-[2px] pb-2 rounded-control"
          }
        >
          <span className="text-[11px] font-semibold text-mut2 whitespace-nowrap">
            {index === nowIndex ? "Now" : formatHour(hour.startTime, timezone)}
          </span>
          <WeatherIcon condition={hour.shortForecast} isDaytime={hour.isDaytime} size={26} />
          <span className="text-[13.5px] font-[650] text-ink2 tabular-nums">
            {Math.round(hour.temperature)}&deg;
          </span>
          <PrecipValue
            probability={precipProbability(hour)}
            shortForecast={hour.shortForecast}
            iconSize={9}
            className="text-[10.5px] h-[13px]"
          />
        </div>
      ))}
    </div>
  );
}

function TrendVariant({ hours, nowIndex, timezone }: VariantContentProps) {
  const isDark = useIsDarkTheme();
  const gradientId = `hourlyTrendFill-${useId().replace(/:/g, "")}`;

  // Theme-aware meteogram colors, from the design.
  const gridCol = isDark ? "#212B33" : "#F0EDE2";
  const lblCol = isDark ? "#5E6E79" : "#B9B3A2";
  const inkCol = isDark ? "#E7ECEF" : "#26333A";
  const precipCol = isDark ? "#7FB2D9" : "#4A7BA6";
  const surfCol = isDark ? "#1A2228" : "#FFFFFF";
  const nowBandFill = isDark ? "rgba(255,255,255,.045)" : "rgba(38,51,58,.045)";

  const temps = hours.map((h) => h.temperature);
  const hiT = Math.max(...temps);
  const loT = Math.min(...temps);
  // The design hardcodes y = TOP + (90 - t) * 4.6 for its 71-88 domain; this
  // scales any real range so hiT sits at TOP and loT at BASE - 18.
  const scale = (BASE - 18 - TOP) / Math.max(1, hiT - loT);
  const yForTemp = (t: number) => TOP + (hiT - t) * scale;
  const yForPrecip = (pp: number) => BASE - pp * 0.62;

  const colW = VIEW_W / hours.length;
  const pts = hours.map((hour, i) => ({
    x: (i + 0.5) * colW,
    y: yForTemp(hour.temperature),
    py: yForPrecip(precipProbability(hour)),
    pp: precipProbability(hour),
    t: hour.temperature,
  }));

  const first = pts[0];
  const last = pts[pts.length - 1];
  const tempPath = smoothPath(pts);
  const tempArea =
    pts.length >= 2
      ? tempPath + "L" + last.x.toFixed(1) + " " + BASE + "L" + first.x.toFixed(1) + " " + BASE + "Z"
      : "";
  const precipPath = pts
    .map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + " " + p.py.toFixed(1))
    .join("");
  const precipArea =
    pts.length >= 2
      ? precipPath +
        "L" +
        last.x.toFixed(1) +
        " " +
        BASE +
        "L" +
        first.x.toFixed(1) +
        " " +
        BASE +
        "Z"
      : "";

  return (
    <>
      <div className="flex items-center gap-[14px] pt-[6px] px-2 flex-wrap">
        <span className="text-[11px] font-[650] text-mut2">Temperature trend</span>
        <div className="flex-1" />
        <span className="flex items-center gap-[6px] text-[11px] text-mut">
          <span
            style={{ width: "14px", height: "3px", borderRadius: "99px", background: CURVE_COLOR }}
          />
          Temperature
        </span>
        <span className="flex items-center gap-[6px] text-[11px] text-mut">
          <span
            style={{
              width: "11px",
              height: "9px",
              borderRadius: "2px",
              background: "rgba(74,123,166,.25)",
              borderBottom: "2px solid rgba(74,123,166,.6)",
            }}
          />
          Precip chance
        </span>
      </div>
      <div data-hscroll className="max-md:overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="min-w-0 max-md:min-w-[760px]">
          <div style={{ padding: "2px 8px 0" }}>
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              style={{ display: "block", width: "100%", height: "auto" }}
              role="img"
              aria-label="Hourly temperature and precipitation trend"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CURVE_COLOR} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={CURVE_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <rect
                x={nowIndex * colW}
                y={8}
                width={colW}
                height={BASE - 8}
                rx={2}
                fill={nowBandFill}
              />
              {gridlineTemps(loT, hiT).map((g) => (
                <g key={`grid-${g}`}>
                  <line
                    x1={8}
                    y1={yForTemp(g)}
                    x2={966}
                    y2={yForTemp(g)}
                    stroke={gridCol}
                    strokeWidth={1}
                    strokeDasharray="3 4"
                  />
                  <text
                    x={996}
                    y={yForTemp(g) + 3}
                    textAnchor="end"
                    fill={lblCol}
                    style={{ font: "500 9.5px system-ui,sans-serif" }}
                  >
                    {g}&deg;
                  </text>
                </g>
              ))}
              <line x1={0} y1={BASE} x2={VIEW_W} y2={BASE} stroke={gridCol} strokeWidth={1} />
              {precipArea && <path d={precipArea} fill="rgba(74,123,166,.16)" />}
              {precipPath && (
                <path
                  d={precipPath}
                  fill="none"
                  stroke="rgba(74,123,166,.55)"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {tempArea && <path d={tempArea} fill={`url(#${gradientId})`} />}
              {tempPath && (
                <path
                  d={tempPath}
                  fill="none"
                  stroke={CURVE_COLOR}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              )}
              {pts.map((p, i) => {
                const isExtreme = p.t === hiT || p.t === loT;
                return (
                  <g key={`pt-${hours[i].startTime}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isExtreme ? 4 : 3}
                      fill={surfCol}
                      stroke={CURVE_COLOR}
                      strokeWidth={2}
                    />
                    <text
                      x={p.x}
                      y={p.y - (isExtreme ? 11 : 8)}
                      textAnchor="middle"
                      fill={isExtreme ? CURVE_COLOR : inkCol}
                      style={{
                        font: (isExtreme ? "700 11px" : "600 10px") + " system-ui,sans-serif",
                      }}
                    >
                      {Math.round(p.t)}&deg;
                    </text>
                    {p.pp >= 30 && (
                      <text
                        x={p.x}
                        y={p.py - 5}
                        textAnchor="middle"
                        fill={precipCol}
                        style={{ font: "650 9.5px system-ui,sans-serif" }}
                      >
                        {p.pp}%
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex px-2 pb-[4px]">
            {hours.map((hour, index) => (
              <div
                key={hour.startTime}
                className="flex-[1_1_0%] min-w-0 flex flex-col items-center gap-[3px] pt-[5px] pb-[2px]"
              >
                <WeatherIcon condition={hour.shortForecast} isDaytime={hour.isDaytime} size={22} />
                <span className="text-[10.5px] font-semibold text-mut2 whitespace-nowrap">
                  {index === nowIndex
                    ? "Now"
                    : formatHour(hour.startTime, timezone).replace(" ", "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function HourlyCard({ data, variant, onVariantChange }: CardBodyProps) {
  const resolvedVariant = variant === "trend" ? "trend" : "chips";
  const hours = data.hourlyForecast.slice(0, HOURS_COUNT);
  const nowIndex = findNowIndex(hours);

  return (
    <div>
      <div className="flex items-center justify-between px-2 gap-2">
        <span className="font-serif text-base font-semibold text-ink2">Next 24 hours</span>
        <div className="flex">
          <button
            type="button"
            onClick={() => onVariantChange?.("chips")}
            style={vBtnStyle(resolvedVariant === "chips", true)}
          >
            Hourly
          </button>
          <button
            type="button"
            onClick={() => onVariantChange?.("trend")}
            style={vBtnStyle(resolvedVariant === "trend", false)}
          >
            Trend
          </button>
        </div>
      </div>
      {hours.length === 0 ? (
        <p className="text-sm text-mut py-4 text-center">Hourly forecast unavailable</p>
      ) : resolvedVariant === "trend" ? (
        <TrendVariant hours={hours} nowIndex={nowIndex} timezone={data.timezone} />
      ) : (
        <ChipsVariant hours={hours} nowIndex={nowIndex} timezone={data.timezone} />
      )}
    </div>
  );
}
