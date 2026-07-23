import { WeatherIcon } from "../icons/WeatherIcon";
import { PrecipValue } from "./PrecipValue";
import { useIsDarkTheme } from "../../hooks/useIsDarkTheme";
import type { CardBodyProps } from "./registry";
import type { CardDataBag } from "../../types/cardData";

type Period = CardDataBag["forecast"][number];

// High/low accent colors from the design: warm orange for the daytime high,
// precip blue (theme-aware, same as PrecipValue's rain palette) for the low.
const HIGH_COLOR = "#E07B28";
const LOW_COLOR = { light: "#4A7BA6", dark: "#7FB2D9" };

function PeriodSection({ period, isFirst }: { period: Period; isFirst: boolean }) {
  const isDark = useIsDarkTheme();
  const tempLabel = period.isDaytime
    ? `High ${Math.round(period.temperature)}°`
    : `Low ${Math.round(period.temperature)}°`;
  const tempColor = period.isDaytime ? HIGH_COLOR : isDark ? LOW_COLOR.dark : LOW_COLOR.light;
  const precip = period.probabilityOfPrecipitation?.value;

  return (
    <div
      className={
        isFirst
          ? "flex gap-[14px] mt-3"
          : "flex gap-[14px] mt-[13px] pt-[13px] border-t border-hair"
      }
    >
      <WeatherIcon condition={period.shortForecast} isDaytime={period.isDaytime} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[13px] font-bold text-ink2">{period.name}</span>
          <span className="text-xs font-[650] tabular-nums" style={{ color: tempColor }}>
            {tempLabel}
          </span>
          {precip != null && (
            <PrecipValue
              probability={precip}
              shortForecast={period.shortForecast}
              className="text-[11.5px]"
            />
          )}
        </div>
        <div className="text-[12.5px] text-ui-body mt-1" style={{ lineHeight: 1.65 }}>
          {period.detailedForecast}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the first two NWS forecast periods verbatim (standard ordering is
 * "Today" then "Tonight", but each block is labeled with its own real
 * `.name` rather than a hardcoded string so it stays honest if the feed
 * ever starts elsewhere, e.g. a late-day fetch beginning at "Tonight").
 */
export function TodayTonightCard({ data }: CardBodyProps) {
  const periods = data.forecast.slice(0, 2);

  if (periods.length === 0) {
    return (
      <div>
        <span className="font-serif text-base font-semibold text-ink2">Today &amp; Tonight</span>
        <p className="text-sm text-mut mt-3">Forecast unavailable</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-serif text-base font-semibold text-ink2">Today &amp; Tonight</span>
        <span className="text-[11px] text-mut">NWS</span>
      </div>
      {periods.map((period, index) => (
        <PeriodSection key={period.number} period={period} isFirst={index === 0} />
      ))}
    </div>
  );
}
