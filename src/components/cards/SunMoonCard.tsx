import type { CardDataBag } from "../../types/cardData";

interface CardProps {
  data: CardDataBag;
  variant?: string;
}

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

/**
 * Sunrise/sunset/day-length from real currentConditions fields only.
 * Moon phase, moonrise, and moonset are intentionally omitted — there is
 * no such data source in this repo.
 */
// TODO: moon phase data source
export function SunMoonCard({ data }: CardProps) {
  const current = data.currentConditions;
  const sunriseIso = current?.sunriseTime;
  const sunsetIso = current?.sunsetTime;

  if (!sunriseIso || !sunsetIso) {
    return <p className="text-sm text-mut py-4 text-center">Sun &amp; moon data unavailable</p>;
  }

  const sunrise = formatClockTime(sunriseIso, data.timezone);
  const sunset = formatClockTime(sunsetIso, data.timezone);
  const dayLength = formatDayLength(sunriseIso, sunsetIso);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-mut uppercase tracking-[0.04em]">Sunrise</span>
          <span className="text-sm font-semibold text-ink tabular-nums">{sunrise ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-mut uppercase tracking-[0.04em]">Sunset</span>
          <span className="text-sm font-semibold text-ink tabular-nums">{sunset ?? "—"}</span>
        </div>
      </div>
      {dayLength && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-mut uppercase tracking-[0.04em]">Day length</span>
          <span className="text-sm font-semibold text-ink tabular-nums">{dayLength}</span>
        </div>
      )}
    </div>
  );
}
