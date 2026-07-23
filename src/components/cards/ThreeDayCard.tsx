import { WeatherIcon } from "../icons/WeatherIcon";
import { PrecipValue } from "./PrecipValue";
import type { CardBodyProps } from "./registry";
import type { CardDataBag } from "../../types/cardData";

type Period = CardDataBag["forecast"][number];

interface DayEntry {
  day: Period;
  /** Paired night period, when the feed provides one; supplies the low. */
  night?: Period;
}

/**
 * Skips periods 0-1 (today/tonight, shown elsewhere) and pulls up to the
 * next 3 daytime periods, using the same day-followed-by-night pairing
 * convention as the rest of the app (SevenDayCard) so a day's index
 * advances past its paired night rather than double-counting it. The
 * paired night is kept so the row can show a real high/low.
 */
function buildUpcomingDays(forecast: Period[]): DayEntry[] {
  const days: DayEntry[] = [];

  for (let i = 2; i < forecast.length && days.length < 3; i++) {
    const period = forecast[i];
    if (!period.isDaytime) continue;

    const next = forecast[i + 1];
    if (next && !next.isDaytime) {
      days.push({ day: period, night: next });
      i++; // paired night period consumed; skip it
    } else {
      days.push({ day: period });
    }
  }

  return days;
}

export function ThreeDayCard({ data }: CardBodyProps) {
  const days = buildUpcomingDays(data.forecast);

  if (days.length === 0) {
    return (
      <div>
        <span className="font-serif text-base font-semibold text-ink2">Next 3 days</span>
        <p className="text-sm text-mut mt-3">Forecast unavailable</p>
      </div>
    );
  }

  return (
    <div>
      <span className="font-serif text-base font-semibold text-ink2">Next 3 days</span>
      {days.map((entry, index) => {
        const precip = entry.day.probabilityOfPrecipitation?.value;
        return (
          <div
            key={entry.day.number}
            className={
              index === 0
                ? "flex gap-[13px] mt-[10px]"
                : "flex gap-[13px] mt-[11px] pt-[11px] border-t border-hair"
            }
          >
            <WeatherIcon condition={entry.day.shortForecast} isDaytime size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold text-ink2">{entry.day.name}</span>
                <span className="text-xs text-mut tabular-nums">
                  {Math.round(entry.day.temperature)}°
                  {entry.night ? ` / ${Math.round(entry.night.temperature)}°` : ""}
                </span>
                {precip != null && (
                  <PrecipValue
                    probability={precip}
                    shortForecast={entry.day.shortForecast}
                    className="text-[11.5px]"
                  />
                )}
              </div>
              <div
                className="text-[12.5px] text-ui-body mt-[3px] line-clamp-2"
                style={{ lineHeight: 1.6 }}
              >
                {entry.day.detailedForecast}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
