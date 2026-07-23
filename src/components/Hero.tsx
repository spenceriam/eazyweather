import { useIsDarkTheme } from "../hooks/useIsDarkTheme";
import { toFahrenheit } from "../utils/weatherHelpers";
import type { CurrentConditions } from "../types/weather";

interface HeroProps {
  currentConditions: CurrentConditions | null;
  isDaytime: boolean;
  timezone: string;
  /** Non-US coverage gap: hero shows the "No forecast yet" variant instead of numbers. */
  coverageGap?: boolean;
}

/**
 * The 8 sky-tint / art families from the design's condMap. Night variants
 * fold into their day family (all four Zae art scenes are time-agnostic).
 */
type ConditionFamily =
  | "sunny"
  | "partly"
  | "cloudy"
  | "rain"
  | "tstorm"
  | "snow"
  | "fog"
  | "wind";

interface FamilySpec {
  label: string;
  nightLabel?: string;
  art: string;
  bg: string;
  bgD: string;
}

const FAMILIES: Record<ConditionFamily, FamilySpec> = {
  sunny: { label: "Sunny", nightLabel: "Clear", art: "zae_niceday_t", bg: "#CFE3F1", bgD: "#1B2B38" },
  partly: { label: "Partly cloudy", art: "zae_niceday_t", bg: "#DDE9EF", bgD: "#1A2933" },
  cloudy: { label: "Mostly cloudy", art: "zae_cloud_cold_t", bg: "#DEE3E6", bgD: "#1D252B" },
  rain: { label: "Rain", art: "zae_rainy_t", bg: "#D6DEE3", bgD: "#18232C" },
  tstorm: { label: "Thunderstorms", art: "zae_rainy_t", bg: "#CCD6DD", bgD: "#161F27" },
  snow: { label: "Snow", art: "zae_snowsleet_t", bg: "#E3E9ED", bgD: "#1C2630" },
  fog: { label: "Fog", art: "zae_cloud_cold_t", bg: "#E0E3E3", bgD: "#1C2328" },
  wind: { label: "Windy", art: "zae_cloud_cold_t", bg: "#DAE4E9", bgD: "#192630" },
};

function classifyConditionFamily(text: string): ConditionFamily {
  const lower = text.toLowerCase();

  if (lower.includes("thunderstorm") || lower.includes("t-storm")) return "tstorm";
  if (lower.includes("sleet") || lower.includes("freezing rain") || lower.includes("ice")) return "snow";
  if (lower.includes("rain") || lower.includes("shower")) return "rain";
  if (lower.includes("snow") || lower.includes("flurr")) return "snow";
  if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) return "fog";
  if (lower.includes("wind")) return "wind";
  if (
    lower.includes("cloud") &&
    (lower.includes("partly") || lower.includes("few") || lower.includes("scattered"))
  ) {
    return "partly";
  }
  if (lower.includes("cloud") || lower.includes("overcast")) return "cloudy";
  if (lower.includes("clear") || lower.includes("sunny") || lower.includes("fair")) return "sunny";

  return "partly";
}

function formatDateLine(timezone: string): string {
  const now = new Date();
  try {
    return (
      now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: timezone }) +
      " · " +
      now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone, timeZoneName: "short" })
    );
  } catch {
    return (
      now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) +
      " · " +
      now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  }
}

/**
 * Hero band per the design: date line, big serif numeral with a small degree
 * symbol, condition label + sub line to the RIGHT of the numeral, and the Zae
 * art on the far side of a centered group (96px gap on desktop). NWS station
 * observations arrive in Celsius — everything shown here is converted to F.
 */
export function Hero({ currentConditions, isDaytime, timezone, coverageGap = false }: HeroProps) {
  const isDark = useIsDarkTheme();

  const family = currentConditions
    ? classifyConditionFamily(currentConditions.textDescription)
    : "cloudy";
  const spec = FAMILIES[family];

  const artSrc = coverageGap ? "/assets/zae_cloud_cold_t.png" : `/assets/${spec.art}.png`;
  const tint = coverageGap ? FAMILIES.cloudy : spec;
  const bandStyle = {
    background: `linear-gradient(180deg, ${isDark ? tint.bgD : tint.bg} 0%, var(--bg) 100%)`,
  };

  let tempText = "—";
  let label = "No forecast yet";
  let sub = "This region isn't covered by our current data source — radar below still works";

  if (!coverageGap && currentConditions) {
    const unit = currentConditions.temperatureUnit;
    tempText = String(Math.round(toFahrenheit(currentConditions.temperature, unit)));
    label =
      !isDaytime && spec.nightLabel ? spec.nightLabel : spec.label;

    const feelsRaw =
      currentConditions.heatIndex ?? currentConditions.windChill ?? currentConditions.temperature;
    const feels = Math.round(toFahrenheit(feelsRaw, unit));
    const parts = [`Feels like ${feels}°`];
    const hasHigh = typeof currentConditions.todayHigh === "number";
    const hasLow = typeof currentConditions.todayLow === "number";
    if (hasHigh && hasLow) {
      parts.push(`High ${Math.round(currentConditions.todayHigh!)}° / Low ${Math.round(currentConditions.todayLow!)}°`);
    } else if (hasHigh) {
      parts.push(`High ${Math.round(currentConditions.todayHigh!)}°`);
    } else if (hasLow) {
      parts.push(`Low ${Math.round(currentConditions.todayLow!)}°`);
    }
    // The observed text becomes the outlook tail unless it would just repeat
    // the headline (e.g. label "Mostly cloudy" + tail "Mostly Cloudy").
    const tail = currentConditions.textDescription;
    if (tail && tail.trim().toLowerCase() !== label.toLowerCase()) {
      parts.push(tail);
    }
    sub = parts.join(" · ");
  } else if (!coverageGap && !currentConditions) {
    label = "Weather unavailable";
    sub = "Current conditions couldn't be loaded — forecast cards below may still work";
  }

  return (
    <div style={bandStyle}>
      <div className="max-w-[1264px] mx-auto flex items-center justify-between md:justify-center gap-3 md:gap-24 px-4 pt-3.5 pb-1.5 md:px-12 md:pt-[22px] md:pb-2.5">
        <div className="flex-1 md:flex-none min-w-0">
          <div className="text-[12.5px] font-semibold text-soft mb-2.5">{formatDateLine(timezone)}</div>
          <div className="flex items-start">
            <span
              className="font-serif text-ink text-[58px] md:text-[84px]"
              style={{ fontWeight: 250, lineHeight: 0.92, letterSpacing: "-.015em" }}
            >
              {tempText}
            </span>
            {tempText !== "—" && (
              <span className="font-serif text-mut2 text-[28px] mt-1.5" style={{ fontWeight: 300 }}>
                °
              </span>
            )}
            <div className="mt-1 ml-3 md:mt-[9px] md:ml-[18px] min-w-0">
              <div className="font-serif italic text-xl text-ui-body">{label}</div>
              <div className="text-[12.5px] text-soft mt-1">{sub}</div>
            </div>
          </div>
        </div>

        <img
          src={artSrc}
          alt="Zae the EazyWeather duck"
          className="h-[92px] md:h-[150px] w-auto block flex-none"
          style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,.18))" }}
        />
      </div>
    </div>
  );
}
