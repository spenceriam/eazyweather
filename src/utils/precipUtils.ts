export type PrecipGlyph = "raindrop" | "snowflake";

const FROZEN_PRECIP_TERMS = [
  "snow",
  "sleet",
  "ice",
  "icy",
  "flurr",
  "wintry mix",
  "freezing rain",
];

/**
 * Chooses the raindrop or snowflake glyph for a period's precipitation
 * probability based on whether its forecast text describes frozen precip.
 */
export function getPrecipGlyph(shortForecast: string): PrecipGlyph {
  const lower = shortForecast.toLowerCase();
  return FROZEN_PRECIP_TERMS.some((term) => lower.includes(term))
    ? "snowflake"
    : "raindrop";
}
