import type { CardDataBag } from "../../types/cardData";
import { degreesToAbbreviatedDirection, formatWindDisplay } from "../../utils/weatherHelpers";

interface CardProps {
  data: CardDataBag;
  variant?: string;
}

/**
 * Current wind speed/direction/gust from live currentConditions, plus an
 * optional secondary line showing the next forecast period's already
 * display-ready wind text (e.g. "Tonight").
 */
export function WindCard({ data }: CardProps) {
  const current = data.currentConditions;

  if (!current) {
    return <p className="text-sm text-mut py-4 text-center">Wind data unavailable</p>;
  }

  const windDisplay = formatWindDisplay(
    current.windSpeedValue ?? 0,
    degreesToAbbreviatedDirection(current.windDirection),
  );
  const nextPeriod = data.forecast[1];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-mut uppercase tracking-[0.04em]">Current wind</span>
        <span className="text-lg font-semibold text-ink tabular-nums">{windDisplay}</span>
      </div>

      {current.windGust !== undefined && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-mut uppercase tracking-[0.04em]">Gusts</span>
          <span className="text-sm font-semibold text-ink tabular-nums">
            {Math.round(current.windGust)} mph
          </span>
        </div>
      )}

      {nextPeriod && (
        <div className="flex flex-col gap-0.5 pt-2 border-t border-hair">
          <span className="text-[11px] text-mut uppercase tracking-[0.04em]">{nextPeriod.name}</span>
          <span className="text-sm text-ink2 tabular-nums">
            {nextPeriod.windSpeed} {nextPeriod.windDirection}
          </span>
        </div>
      )}
    </div>
  );
}
