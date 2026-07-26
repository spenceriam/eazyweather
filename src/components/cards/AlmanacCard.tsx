import type { CardBodyProps } from "./registry";

/**
 * There is no NWS climate-normals data source integrated in this repo, so
 * no record highs/lows or today-vs-normal comparison can be shown. Only
 * today's real high/low (already derived from the live forecast
 * elsewhere) are rendered in the design's label/value row style, with an
 * honest note in place of fabricated historical figures. This card is
 * marked unavailable in the card registry regardless (see registry.tsx),
 * but still renders reasonably if ever mounted directly.
 */
// TODO: NWS climate-normals data source for record highs/lows and today-vs-normal comparison
export function AlmanacCard({ data }: CardBodyProps) {
  const current = data.currentConditions;
  const high = current?.todayHigh;
  const low = current?.todayLow;
  const hasTodayStats = high !== undefined || low !== undefined;

  return (
    <div>
      <span className="font-serif text-base font-semibold text-ink2">Almanac</span>
      {hasTodayStats && (
        <div className="grid grid-cols-2 gap-x-[22px] gap-y-[10px] mt-3">
          {high !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-[11.5px] text-mut font-[550]">Today's high</span>
              <span className="text-[13px] font-[650] text-ink2 tabular-nums">
                {Math.round(high)}°
              </span>
            </div>
          )}
          {low !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-[11.5px] text-mut font-[550]">Today's low</span>
              <span className="text-[13px] font-[650] text-ink2 tabular-nums">
                {Math.round(low)}°
              </span>
            </div>
          )}
        </div>
      )}
      <p className="text-sm text-mut mt-3">Historical records aren't available yet.</p>
    </div>
  );
}
