import type { CardBodyProps } from "./registry";

function formatClockTime(iso: string, timezone: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone || undefined,
  });
}

function formatDayLength(sunriseIso: string, sunsetIso: string): string | null {
  const start = new Date(sunriseIso).getTime();
  const end = new Date(sunsetIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;

  const totalMinutes = Math.round((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

// Sun-arc geometry from the design: a semicircle of radius 110 centered at
// (135, 110) inside a 270x128 viewBox, horizon along y=110.
const ARC_CX = 135;
const ARC_CY = 110;
const ARC_R = 110;

/**
 * Sunrise/sunset/day-length from real currentConditions fields only, with
 * the design's sun-arc showing how far through the daylight window "now"
 * falls. Moon phase, moonrise, and moonset are intentionally omitted —
 * there is no such data source in this repo.
 */
// TODO: moon phase data source
export function SunMoonCard({ data }: CardBodyProps) {
  const current = data.currentConditions;
  const sunriseIso = current?.sunriseTime;
  const sunsetIso = current?.sunsetTime;

  if (!sunriseIso || !sunsetIso) {
    return (
      <div>
        <span className="font-serif text-base font-semibold text-ink2">Sun &amp; Moon</span>
        <p className="text-sm text-mut mt-3">Sun &amp; moon data unavailable</p>
      </div>
    );
  }

  const sunrise = formatClockTime(sunriseIso, data.timezone);
  const sunset = formatClockTime(sunsetIso, data.timezone);
  const dayLength = formatDayLength(sunriseIso, sunsetIso);

  const sunriseMs = new Date(sunriseIso).getTime();
  const sunsetMs = new Date(sunsetIso).getTime();
  const span = sunsetMs - sunriseMs;
  const rawFrac = span > 0 ? (Date.now() - sunriseMs) / span : 0;
  const frac = Math.min(1, Math.max(0, rawFrac));

  const angle = Math.PI + Math.PI * frac;
  const sunX = ARC_CX + ARC_R * Math.cos(angle);
  const sunY = ARC_CY + ARC_R * Math.sin(angle);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-serif text-base font-semibold text-ink2">Sun &amp; Moon</span>
        {dayLength && <span className="text-[11px] text-mut">{dayLength} of daylight</span>}
      </div>
      <div className="flex gap-5 items-center mt-[6px] flex-wrap">
        <svg
          width={270}
          height={128}
          viewBox="0 0 270 128"
          className="flex-none max-w-full"
          aria-hidden="true"
        >
          <path
            d="M 25 110 A 110 110 0 0 1 245 110"
            fill="none"
            stroke="var(--hair)"
            strokeWidth={2.5}
          />
          {frac > 0 && (
            <path
              d={`M 25 110 A 110 110 0 0 1 ${sunX.toFixed(1)} ${sunY.toFixed(1)}`}
              fill="none"
              stroke="#F0A81C"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          )}
          <line x1={12} y1={110} x2={258} y2={110} stroke="var(--line)" strokeWidth={1} />
          <circle cx={sunX.toFixed(1)} cy={sunY.toFixed(1)} r={7} fill="#F0A81C" />
          <circle
            cx={sunX.toFixed(1)}
            cy={sunY.toFixed(1)}
            r={11}
            fill="none"
            stroke="#F0A81C"
            strokeOpacity={0.35}
            strokeWidth={2}
          />
          {sunrise && (
            <text
              x={25}
              y={124}
              textAnchor="middle"
              style={{ font: "600 10px system-ui,sans-serif" }}
              fill="var(--mut)"
            >
              {sunrise}
            </text>
          )}
          {sunset && (
            <text
              x={245}
              y={124}
              textAnchor="middle"
              style={{ font: "600 10px system-ui,sans-serif" }}
              fill="var(--mut)"
            >
              {sunset}
            </text>
          )}
        </svg>
        <div className="flex-1 min-w-[150px] flex flex-col gap-[9px]">
          <div className="flex justify-between items-baseline border-b border-hair pb-[7px]">
            <span className="text-[11.5px] text-mut font-[550]">Sunrise</span>
            <span className="text-[13px] font-[650] text-ink2 tabular-nums">{sunrise ?? "—"}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[11.5px] text-mut font-[550]">Sunset</span>
            <span className="text-[13px] font-[650] text-ink2 tabular-nums">{sunset ?? "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
