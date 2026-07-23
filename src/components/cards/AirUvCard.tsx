import type { CardDataBag } from "../../types/cardData";

interface CardProps {
  data: CardDataBag;
  variant?: string;
}

/**
 * No air-quality (AQI) or UV-index data source is integrated anywhere in
 * this repo, so no numeric values can be shown honestly. This card is
 * marked unavailable in the card registry regardless (see registry.tsx),
 * but still compiles and renders a plain, honest message if ever mounted
 * directly.
 */
// TODO: air quality (AQI) and UV index data source
export function AirUvCard({ data }: CardProps) {
  void data; // no fields of the data bag apply until an AQI/UV source exists

  return (
    <div className="flex items-center justify-center py-4 text-center">
      <p className="text-sm text-mut">Air quality and UV data aren't available yet.</p>
    </div>
  );
}
