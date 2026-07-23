import type { CardDataBag } from "../../types/cardData";

interface CardProps {
  data: CardDataBag;
  variant?: string;
}

/**
 * There is no NWS climate-normals data source integrated in this repo, so
 * no record highs/lows or today-vs-normal comparison can be shown. Only
 * today's real high/low (already derived from the live forecast
 * elsewhere) are rendered, with an honest note in place of fabricated
 * historical figures. This card is marked unavailable in the card
 * registry regardless (see registry.tsx), but still renders reasonably
 * if ever mounted directly.
 */
// TODO: NWS climate-normals data source for record highs/lows and today-vs-normal comparison
export function AlmanacCard({ data }: CardProps) {
  const current = data.currentConditions;
  const high = current?.todayHigh;
  const low = current?.todayLow;
  const hasTodayStats = high !== undefined || low !== undefined;

  return (
    <div className="flex flex-col gap-3">
      {hasTodayStats && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {high !== undefined && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-mut uppercase tracking-[0.04em]">Today's high</span>
              <span className="text-sm font-semibold text-ink tabular-nums">{Math.round(high)}°</span>
            </div>
          )}
          {low !== undefined && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-mut uppercase tracking-[0.04em]">Today's low</span>
              <span className="text-sm font-semibold text-ink tabular-nums">{Math.round(low)}°</span>
            </div>
          )}
        </div>
      )}
      <p className="text-sm text-mut">Historical records aren't available yet.</p>
    </div>
  );
}
