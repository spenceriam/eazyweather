import type { CardBodyProps } from "./registry";

/**
 * No air-quality (AQI) or UV-index data source is integrated anywhere in
 * this repo, so no numeric values can be shown honestly. This card is
 * marked unavailable in the card registry regardless (see registry.tsx),
 * but still compiles and renders a plain, honest message if ever mounted
 * directly.
 */
// TODO: air quality (AQI) and UV index data source
export function AirUvCard({ data }: CardBodyProps) {
  void data; // no fields of the data bag apply until an AQI/UV source exists

  return (
    <div>
      <span className="font-serif text-base font-semibold text-ink2">Air quality &amp; UV</span>
      <p className="text-sm text-mut mt-3">Air quality and UV data aren't available yet.</p>
    </div>
  );
}
