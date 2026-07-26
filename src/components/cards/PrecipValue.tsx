import { useIsDarkTheme } from "../../hooks/useIsDarkTheme";
import { getPrecipGlyph } from "../../utils/precipUtils";

interface PrecipValueProps {
  /** NWS probability of precipitation; null/undefined renders as the dimmed 0% state. */
  probability: number | null | undefined;
  /** NWS short-forecast text for the same period; used to detect frozen precip. */
  shortForecast?: string;
  /** Glyph size in px (the design uses 9 in most rows, 8.5 in night cells). */
  iconSize?: number;
  className?: string;
}

const RAIN_COLOR = { light: "#4A7BA6", dark: "#7FB2D9" };
const SNOW_COLOR = { light: "#7FA8C9", dark: "#A8CCE6" };

// Raindrop path from the design's dropIc().
const DROP_PATH =
  "M12 3.2s5.8 6.9 5.8 10.9a5.8 5.8 0 0 1-11.6 0C6.2 10.1 12 3.2 12 3.2Z";

function SnowflakeGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none" }}>
      <g stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
        <line x1={12} y1={2.5} x2={12} y2={21.5} />
        <line x1={3.8} y1={7.3} x2={20.2} y2={16.7} />
        <line x1={20.2} y1={7.3} x2={3.8} y2={16.7} />
      </g>
    </svg>
  );
}

/**
 * Precip probability per the design's ppEl(): filled raindrop + "N%".
 * Zero (or missing) probability renders dimmed at reduced opacity — the
 * design shows a muted "0%", not an empty slot. Swaps to a snowflake when
 * the period's forecast text describes frozen precipitation. Font size is
 * inherited from the parent so each row can set its own.
 */
export function PrecipValue({
  probability,
  shortForecast = "",
  iconSize = 9,
  className = "",
}: PrecipValueProps) {
  const isDark = useIsDarkTheme();
  const value = Math.round(probability ?? 0);
  const glyph = getPrecipGlyph(shortForecast);
  const palette = glyph === "snowflake" ? SNOW_COLOR : RAIN_COLOR;
  const activeColor = isDark ? palette.dark : palette.light;

  const style =
    value > 0
      ? { color: activeColor }
      : { color: "var(--mut)", opacity: 0.75 };

  return (
    <span
      className={`inline-flex items-center gap-[3px] font-[650] tabular-nums ${className}`}
      style={style}
    >
      {glyph === "snowflake" ? (
        <SnowflakeGlyph size={iconSize} />
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none" }}>
          <path d={DROP_PATH} fill="currentColor" />
        </svg>
      )}
      {value}%
    </span>
  );
}
