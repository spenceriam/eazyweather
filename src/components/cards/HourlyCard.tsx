import { useId, useMemo, useState } from "react";
import { WeatherIcon } from "../icons/WeatherIcon";
import { PrecipValue } from "./PrecipValue";
import type { CardDataBag } from "../../types/cardData";
import type { HourlyForecast } from "../../types/weather";

interface HourlyCardProps {
  data: CardDataBag;
  /** "chips" (default) is a row of hour chips; "trend" is a smoothed temperature curve. Any other value falls back to "chips". */
  variant?: string;
}

interface Point {
  x: number;
  y: number;
}

const CHIPS_COUNT = 14;
const TREND_COUNT = 14;
const EXPANDED_COUNT = 48;

const TREND_VIEWBOX_WIDTH = 700;
const TREND_VIEWBOX_HEIGHT = 130;
const TREND_MARGIN_X = 24;
const TREND_TOP = 28;
const TREND_BOTTOM = 116;
const TREND_CURVE_COLOR = "#E0862E";

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
 * the ui-refresh prototype's smooth() helper.
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

function ExpandedTable({ hours, timezone }: { hours: HourlyForecast[]; timezone: string }) {
  return (
    <div className="mt-2 max-h-72 overflow-y-auto border border-hair rounded-control divide-y divide-hair">
      {hours.map((hour) => (
        <div key={hour.startTime} className="flex items-center gap-3 px-2.5 py-1.5">
          <span className="w-14 shrink-0 text-xs font-semibold text-mut2 tabular-nums">
            {formatHour(hour.startTime, timezone)}
          </span>
          <WeatherIcon
            condition={hour.shortForecast}
            isDaytime={hour.isDaytime}
            size={20}
            className="shrink-0"
          />
          <span className="w-10 shrink-0 text-sm font-semibold text-ink2 text-right tabular-nums">
            {Math.round(hour.temperature)}&deg;
          </span>
          <span className="flex-1 min-w-0 truncate text-xs text-mut">{hour.shortForecast}</span>
          <PrecipValue probability={undefined} shortForecast={hour.shortForecast} />
        </div>
      ))}
    </div>
  );
}

function ExpandToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-2.5 text-xs font-semibold text-link hover:underline"
    >
      {expanded ? "Show fewer hours" : "Next 48 hours"}
    </button>
  );
}

interface VariantProps {
  data: CardDataBag;
  expanded: boolean;
  onToggleExpanded: () => void;
}

function ChipsVariant({ data, expanded, onToggleExpanded }: VariantProps) {
  const chips = data.hourlyForecast.slice(0, CHIPS_COUNT);
  const nowIndex = findNowIndex(chips);

  return (
    <div>
      <div data-hscroll className="overflow-x-auto md:overflow-visible flex md:flex-1 gap-2">
        {chips.map((hour, index) => (
          <div
            key={hour.startTime}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-control shrink-0 w-[54px] md:w-auto md:flex-1 ${
              index === nowIndex ? "bg-chip" : ""
            }`}
          >
            <span className="text-[11px] font-semibold text-mut2 whitespace-nowrap">
              {formatHour(hour.startTime, data.timezone)}
            </span>
            <WeatherIcon condition={hour.shortForecast} isDaytime={hour.isDaytime} size={30} />
            <span className="text-sm font-semibold text-ink2 tabular-nums">
              {Math.round(hour.temperature)}&deg;
            </span>
            <PrecipValue probability={undefined} shortForecast={hour.shortForecast} />
          </div>
        ))}
      </div>

      <ExpandToggle expanded={expanded} onToggle={onToggleExpanded} />
      {expanded && (
        <ExpandedTable hours={data.hourlyForecast.slice(0, EXPANDED_COUNT)} timezone={data.timezone} />
      )}
    </div>
  );
}

function TrendVariant({ data, expanded, onToggleExpanded }: VariantProps) {
  const rawId = useId().replace(/:/g, "");
  const gradientId = `hourlyTrendFill-${rawId}`;
  const hours = data.hourlyForecast.slice(0, TREND_COUNT);
  const nowIndex = findNowIndex(hours);

  const { linePath, areaPath, points } = useMemo(() => {
    const temps = hours.map((h) => h.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const range = max - min || 1;
    const usableWidth = TREND_VIEWBOX_WIDTH - TREND_MARGIN_X * 2;
    const step = hours.length > 1 ? usableWidth / (hours.length - 1) : 0;

    const pts: Point[] = hours.map((h, i) => ({
      x: hours.length > 1 ? TREND_MARGIN_X + step * i : TREND_VIEWBOX_WIDTH / 2,
      y: TREND_BOTTOM - ((h.temperature - min) / range) * (TREND_BOTTOM - TREND_TOP),
    }));

    const line = smoothPath(pts);
    let area = "";
    if (pts.length >= 2) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      area =
        line +
        `L${last.x.toFixed(1)} ${TREND_BOTTOM.toFixed(1)}` +
        `L${first.x.toFixed(1)} ${TREND_BOTTOM.toFixed(1)}Z`;
    }

    return { linePath: line, areaPath: area, points: pts };
  }, [hours]);

  const edgePaddingPct = (TREND_MARGIN_X / TREND_VIEWBOX_WIDTH) * 100;

  return (
    <div>
      <div data-hscroll className="overflow-x-auto">
        <div style={{ minWidth: "900px" }}>
          <svg
            viewBox={`0 0 ${TREND_VIEWBOX_WIDTH} ${TREND_VIEWBOX_HEIGHT}`}
            style={{ width: "100%", height: "auto", display: "block" }}
            role="img"
            aria-label="Hourly temperature trend"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TREND_CURVE_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={TREND_CURVE_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={TREND_CURVE_COLOR}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {points.map((p, i) => (
              <text
                key={`label-${hours[i].startTime}`}
                x={p.x}
                y={Math.max(12, p.y - 10)}
                textAnchor="middle"
                fontSize={11}
                fontWeight={650}
                className="fill-ink2"
              >
                {Math.round(hours[i].temperature)}&deg;
              </text>
            ))}
            {points.map((p, i) => (
              <circle
                key={`dot-${hours[i].startTime}`}
                cx={p.x}
                cy={p.y}
                r={i === nowIndex ? 3.5 : 2}
                fill={TREND_CURVE_COLOR}
              />
            ))}
          </svg>

          <div
            className="flex"
            style={{ paddingLeft: `${edgePaddingPct}%`, paddingRight: `${edgePaddingPct}%` }}
          >
            {hours.map((hour, index) => (
              <div
                key={hour.startTime}
                className={`flex-1 min-w-0 flex flex-col items-center gap-1 pt-1 pb-2 ${
                  index === nowIndex ? "bg-chip rounded-control" : ""
                }`}
              >
                <WeatherIcon condition={hour.shortForecast} isDaytime={hour.isDaytime} size={20} />
                <PrecipValue probability={undefined} shortForecast={hour.shortForecast} />
                <span className="text-[10.5px] font-semibold text-mut2 whitespace-nowrap">
                  {formatHour(hour.startTime, data.timezone)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ExpandToggle expanded={expanded} onToggle={onToggleExpanded} />
      {expanded && (
        <ExpandedTable hours={data.hourlyForecast.slice(0, EXPANDED_COUNT)} timezone={data.timezone} />
      )}
    </div>
  );
}

export function HourlyCard({ data, variant }: HourlyCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!data.hourlyForecast || data.hourlyForecast.length === 0) {
    return <p className="text-sm text-mut py-4 text-center">Hourly forecast unavailable</p>;
  }

  const resolvedVariant = variant === "trend" ? "trend" : "chips";
  const toggleExpanded = () => setExpanded((prev) => !prev);

  return resolvedVariant === "trend" ? (
    <TrendVariant data={data} expanded={expanded} onToggleExpanded={toggleExpanded} />
  ) : (
    <ChipsVariant data={data} expanded={expanded} onToggleExpanded={toggleExpanded} />
  );
}
