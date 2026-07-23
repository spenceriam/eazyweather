import type { CardDataBag } from "../../types/cardData";

interface CardProps {
  data: CardDataBag;
  variant?: string;
}

type Period = CardDataBag["forecast"][number];

function PeriodBlock({ period }: { period: Period }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-ink">{period.name}</span>
        <span className="text-sm font-semibold text-ink tabular-nums">
          {Math.round(period.temperature)}°
        </span>
      </div>
      <p className="text-sm text-ui-body leading-snug">{period.detailedForecast}</p>
    </div>
  );
}

/**
 * Renders the first two NWS forecast periods verbatim (standard ordering is
 * "Today" then "Tonight", but each block is labeled with its own real
 * `.name` rather than a hardcoded string so it stays honest if the feed
 * ever starts elsewhere, e.g. a late-day fetch beginning at "Tonight").
 */
export function TodayTonightCard({ data }: CardProps) {
  const periods = data.forecast.slice(0, 2);

  if (periods.length === 0) {
    return <p className="text-sm text-mut py-4 text-center">Forecast unavailable</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-line">
      {periods.map((period, index) => (
        <div key={period.number} className={index > 0 ? "pt-3 mt-3" : undefined}>
          <PeriodBlock period={period} />
        </div>
      ))}
    </div>
  );
}
