import type { CardBodyProps } from "./registry";
import { degreesToAbbreviatedDirection, formatWindDisplay } from "../../utils/weatherHelpers";

/**
 * Current wind from live currentConditions only: the design's compass dial
 * (arrow, center speed readout) plus Sustained/Gusts rows. The gust row and
 * header note render only when the observation actually includes a gust.
 */
export function WindCard({ data }: CardBodyProps) {
  const current = data.currentConditions;

  if (!current) {
    return (
      <div>
        <span className="font-serif text-base font-semibold text-ink2">Wind</span>
        <p className="text-sm text-mut mt-3">Wind data unavailable</p>
      </div>
    );
  }

  const speed = Math.round(current.windSpeedValue ?? 0);
  const directionAbbr = degreesToAbbreviatedDirection(current.windDirection);
  const windDisplay = formatWindDisplay(current.windSpeedValue ?? 0, directionAbbr);
  const gust = current.windGust !== undefined ? Math.round(current.windGust) : undefined;

  // NWS reports the direction the wind blows FROM; the design's arrow points
  // the way the air is moving (a SW wind renders as rotate(45)), so flip 180.
  const arrowRotation = (current.windDirection + 180) % 360;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-serif text-base font-semibold text-ink2">Wind</span>
        {gust !== undefined && (
          <span className="text-[11px] text-mut">gusting to {gust} mph</span>
        )}
      </div>
      <div className="flex gap-[22px] items-center mt-2 flex-wrap">
        <svg width={128} height={128} viewBox="0 0 128 128" className="flex-none" aria-hidden="true">
          <circle cx={64} cy={64} r={56} fill="var(--panel)" stroke="var(--line)" strokeWidth={1.5} />
          <text
            x={64}
            y={20}
            textAnchor="middle"
            style={{ font: "700 10px system-ui,sans-serif" }}
            fill="var(--mut)"
          >
            N
          </text>
          <text
            x={112}
            y={68}
            textAnchor="middle"
            style={{ font: "700 10px system-ui,sans-serif" }}
            fill="var(--mut)"
            fillOpacity={0.55}
          >
            E
          </text>
          <text
            x={64}
            y={116}
            textAnchor="middle"
            style={{ font: "700 10px system-ui,sans-serif" }}
            fill="var(--mut)"
            fillOpacity={0.55}
          >
            S
          </text>
          <text
            x={16}
            y={68}
            textAnchor="middle"
            style={{ font: "700 10px system-ui,sans-serif" }}
            fill="var(--mut)"
            fillOpacity={0.55}
          >
            W
          </text>
          <g transform={`rotate(${arrowRotation} 64 64)`}>
            <path d="M64 24 L70 42 L64 38 L58 42 Z" fill="var(--link)" />
            <line x1={64} y1={40} x2={64} y2={50} stroke="var(--link)" strokeWidth={2.5} strokeLinecap="round" />
          </g>
          <text
            x={64}
            y={61}
            textAnchor="middle"
            style={{ font: "300 20px system-ui,sans-serif" }}
            fill="var(--ink)"
          >
            {speed}
          </text>
          <text
            x={64}
            y={76}
            textAnchor="middle"
            style={{ font: "600 9px system-ui,sans-serif" }}
            fill="var(--mut)"
          >
            mph {directionAbbr}
          </text>
        </svg>
        <div className="flex-1 min-w-[150px] flex flex-col gap-[9px]">
          <div
            className={
              gust !== undefined
                ? "flex justify-between items-baseline border-b border-hair pb-[7px]"
                : "flex justify-between items-baseline"
            }
          >
            <span className="text-[11.5px] text-mut font-[550]">Sustained</span>
            <span className="text-[13px] font-[650] text-ink2 tabular-nums">{windDisplay}</span>
          </div>
          {gust !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-[11.5px] text-mut font-[550]">Gusts</span>
              <span className="text-[13px] font-[650] text-ink2 tabular-nums">{gust} mph</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
