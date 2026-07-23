import { WeatherIcon } from "../icons/WeatherIcon";
import type { CardDataBag } from "../../types/cardData";

interface CardProps {
  data: CardDataBag;
  variant?: string;
}

type Period = CardDataBag["forecast"][number];

/**
 * Skips periods 0-1 (today/tonight, shown elsewhere) and pulls up to the
 * next 3 daytime periods, using the same day-followed-by-night pairing
 * convention as the rest of the app (SevenDayCard) so a day's index
 * advances past its paired night rather than double-counting it.
 */
function buildUpcomingDays(forecast: Period[]): Period[] {
  const days: Period[] = [];

  for (let i = 2; i < forecast.length && days.length < 3; i++) {
    const period = forecast[i];
    if (!period.isDaytime) continue;

    days.push(period);

    const next = forecast[i + 1];
    if (next && !next.isDaytime) {
      i++; // paired night period already accounted for; skip it
    }
  }

  return days;
}

export function ThreeDayCard({ data }: CardProps) {
  const days = buildUpcomingDays(data.forecast);

  if (days.length === 0) {
    return <p className="text-sm text-mut py-4 text-center">Forecast unavailable</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {days.map((day) => (
        <div key={day.number} className="flex flex-col items-center text-center gap-1 min-w-0">
          <span className="text-xs font-semibold text-ink truncate w-full">{day.name}</span>
          <WeatherIcon condition={day.shortForecast} isDaytime size={28} />
          <span className="text-sm font-semibold text-ink tabular-nums">
            {Math.round(day.temperature)}°
          </span>
          <span className="text-[11px] text-mut leading-snug line-clamp-2">{day.shortForecast}</span>
        </div>
      ))}
    </div>
  );
}
