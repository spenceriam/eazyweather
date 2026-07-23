import { RefreshCw } from "lucide-react";
import { useIsDarkTheme } from "../hooks/useIsDarkTheme";
import { WeatherIcon } from "./icons/WeatherIcon";
import type { CurrentConditions } from "../types/weather";

interface HeroProps {
  currentConditions: CurrentConditions | null;
  isDaytime: boolean;
  locationName: string;
  onRefresh: () => void;
  lastUpdatedMinutesAgo: number | null; // null = unknown, "Updated" line is omitted
}

/**
 * The 8 sky-tint / art families the hero band groups every NWS condition
 * into. Night-only icon types from WeatherIcon (moon, partlyN) fold into
 * "sunny" and "partly" respectively — the spec's tint table pairs them on
 * the same row (sunny/moon, partly/partlyN), and all four Zae art assets
 * are day/night-agnostic scenes.
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

interface SkyTint {
  bg: string; // light theme
  bgD: string; // dark theme
}

const FAMILY_TINT: Record<ConditionFamily, SkyTint> = {
  sunny: { bg: "#CFE3F1", bgD: "#1B2B38" },
  partly: { bg: "#DDE9EF", bgD: "#1A2933" },
  cloudy: { bg: "#DEE3E6", bgD: "#1D252B" },
  rain: { bg: "#D6DEE3", bgD: "#18232C" },
  tstorm: { bg: "#CCD6DD", bgD: "#161F27" },
  snow: { bg: "#E3E9ED", bgD: "#1C2630" },
  fog: { bg: "#E0E3E3", bgD: "#1C2328" },
  wind: { bg: "#DAE4E9", bgD: "#192630" },
};

const ART_DROP_SHADOW = "drop-shadow(0 10px 16px rgba(35,46,52,.14))";

/**
 * Local classifier — deliberately not imported from WeatherIcon (its
 * getIconType is private). Same lowercased-substring approach, collapsed
 * from WeatherIcon's 11 icon types down to the 8 families the hero's
 * sky-tint + Zae art tables key on.
 */
function classifyConditionFamily(shortForecast: string): ConditionFamily {
  const lower = shortForecast.toLowerCase();

  if (lower.includes("thunderstorm") || lower.includes("t-storm")) return "tstorm";
  if (lower.includes("sleet") || lower.includes("freezing rain") || lower.includes("ice")) {
    return "snow";
  }
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

/** Family -> one of the 4 processed Zae assets. null = no art, use WeatherIcon. */
function getArtSrc(family: ConditionFamily): string | null {
  switch (family) {
    case "sunny":
    case "partly":
      return "/assets/zae_niceday_t.png";
    case "rain":
    case "tstorm":
      return "/assets/zae_rainy_t.png";
    case "cloudy":
    case "fog":
    case "wind":
      return "/assets/zae_cloud_cold_t.png";
    case "snow":
      return "/assets/zae_snowsleet_t.png";
    default:
      // Defensive only — every family above is handled, so this path is
      // unreachable given classifyConditionFamily's exhaustive default.
      return null;
  }
}

/** Short serif headline word shown under the numeral. */
function getHeadline(family: ConditionFamily, isDaytime: boolean): string {
  switch (family) {
    case "sunny":
      return isDaytime ? "Sunny" : "Clear";
    case "partly":
      return "Partly Cloudy";
    case "cloudy":
      return "Cloudy";
    case "rain":
      return "Rain";
    case "tstorm":
      return "Thunderstorms";
    case "snow":
      return "Snow";
    case "fog":
      return "Fog";
    case "wind":
      return "Windy";
    default:
      return "Cloudy";
  }
}

export function Hero({
  currentConditions,
  isDaytime,
  locationName,
  onRefresh,
  lastUpdatedMinutesAgo,
}: HeroProps) {
  const isDark = useIsDarkTheme();

  if (!currentConditions) {
    const tint = FAMILY_TINT.partly;
    const bandStyle = {
      background: `linear-gradient(to bottom, ${isDark ? tint.bgD : tint.bg} 0%, var(--bg) 100%)`,
    };

    return (
      <section className="w-full" style={bandStyle}>
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 text-center">
          <p className="font-serif italic text-2xl md:text-3xl text-ink2">Weather unavailable</p>
          <p className="mt-2 text-sm text-mut">
            {locationName
              ? `We couldn't load current conditions for ${locationName}.`
              : "We couldn't load current conditions."}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Retry loading weather"
            className="mt-4 inline-flex items-center gap-1.5 rounded-control border border-hair px-3 py-1.5 text-xs font-medium text-soft transition-colors hover:bg-chip hover:text-ink"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      </section>
    );
  }

  const family = classifyConditionFamily(currentConditions.textDescription);
  const tint = FAMILY_TINT[family];
  const artSrc = getArtSrc(family);
  const headline = getHeadline(family, isDaytime);

  const bandStyle = {
    background: `linear-gradient(to bottom, ${isDark ? tint.bgD : tint.bg} 0%, var(--bg) 100%)`,
  };

  const temp = Math.round(currentConditions.temperature);
  const feelsLike =
    currentConditions.heatIndex ?? currentConditions.windChill ?? currentConditions.temperature;
  const feelsLikeTemp = Math.round(feelsLike);

  const hasHigh = typeof currentConditions.todayHigh === "number";
  const hasLow = typeof currentConditions.todayLow === "number";
  let hiLoText: string | null = null;
  if (hasHigh && hasLow) {
    hiLoText = `H ${Math.round(currentConditions.todayHigh as number)}° / L ${Math.round(
      currentConditions.todayLow as number,
    )}°`;
  } else if (hasHigh) {
    hiLoText = `H ${Math.round(currentConditions.todayHigh as number)}°`;
  } else if (hasLow) {
    hiLoText = `L ${Math.round(currentConditions.todayLow as number)}°`;
  }

  const secondaryParts = [`Feels like ${feelsLikeTemp}°`];
  if (hiLoText) secondaryParts.push(hiLoText);
  if (currentConditions.textDescription) secondaryParts.push(currentConditions.textDescription);

  const updatedText =
    lastUpdatedMinutesAgo === null
      ? null
      : lastUpdatedMinutesAgo <= 0
        ? "Updated just now"
        : `Updated ${lastUpdatedMinutesAgo} min ago`;

  return (
    <section className="w-full" style={bandStyle}>
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-12 md:pt-14 md:pb-16">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-10">
          <div className="max-w-[420px] text-center md:text-left">
            {locationName && (
              <div className="text-sm font-medium text-soft mb-1">{locationName}</div>
            )}

            <div className="flex items-baseline justify-center md:justify-start">
              <span
                className="font-serif tabular-nums text-ink text-[58px] md:text-[92px] leading-[0.92]"
                style={{ fontWeight: 250 }}
              >
                {temp}
              </span>
              <span
                className="font-serif text-ink text-[58px] md:text-[92px] leading-[0.92]"
                style={{ fontWeight: 300 }}
              >
                °
              </span>
            </div>

            <p className="mt-1 font-serif italic text-xl md:text-2xl text-ink2">{headline}</p>

            <p className="mt-3 text-sm text-ui-body">{secondaryParts.join("  ·  ")}</p>

            <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
              {updatedText && (
                <span className="text-xs tabular-nums text-mut">{updatedText}</span>
              )}
              <button
                type="button"
                onClick={onRefresh}
                aria-label="Refresh weather data"
                className="inline-flex h-6 w-6 items-center justify-center rounded-control border border-hair text-soft transition-colors hover:bg-chip hover:text-ink"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-shrink-0">
            {artSrc ? (
              <img
                src={artSrc}
                alt=""
                className="h-[120px] w-auto md:h-[210px]"
                style={{ filter: ART_DROP_SHADOW }}
              />
            ) : (
              <WeatherIcon condition={currentConditions.textDescription} isDaytime={isDaytime} size={120} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
