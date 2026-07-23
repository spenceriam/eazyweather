import { useIsDarkTheme } from "../../hooks/useIsDarkTheme";
import { getPrecipGlyph } from "../../utils/precipUtils";

interface PrecipValueProps {
  probability: number | null | undefined;
  /** NWS short-forecast text for the same period; used to detect frozen precip. */
  shortForecast?: string;
  className?: string;
}

const RAIN_COLOR = { light: "#4A7BA6", dark: "#7FB2D9" };
const SNOW_COLOR = { light: "#7FA8C9", dark: "#A8CCE6" };

function RaindropGlyph({ color }: { color: string }) {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2c4 5.5 7 9.4 7 13a7 7 0 1 1-14 0c0-3.6 3-7.5 7-13Z"
        fill={color}
      />
    </svg>
  );
}

function SnowflakeGlyph({ color }: { color: string }) {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" aria-hidden="true">
      <g stroke={color} strokeWidth={2} strokeLinecap="round">
        <line x1={12} y1={2} x2={12} y2={22} />
        <line x1={3.5} y1={7} x2={20.5} y2={17} />
        <line x1={20.5} y1={7} x2={3.5} y2={17} />
      </g>
    </svg>
  );
}

/**
 * Filled raindrop + percentage per F14. Zero probability renders an empty
 * (but same-size) slot so columns stay aligned. Swaps to a snowflake glyph
 * when the period's forecast text describes frozen precipitation.
 */
export function PrecipValue({ probability, shortForecast = "", className = "" }: PrecipValueProps) {
  const isDark = useIsDarkTheme();

  if (!probability || probability <= 0) {
    return <span className={`inline-block w-8 ${className}`} aria-hidden="true" />;
  }

  const glyph = getPrecipGlyph(shortForecast);
  const color = glyph === "snowflake" ? SNOW_COLOR : RAIN_COLOR;
  const resolvedColor = isDark ? color.dark : color.light;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums ${className}`}
      style={{ color: resolvedColor }}
    >
      {glyph === "snowflake" ? (
        <SnowflakeGlyph color={resolvedColor} />
      ) : (
        <RaindropGlyph color={resolvedColor} />
      )}
      {Math.round(probability)}%
    </span>
  );
}
