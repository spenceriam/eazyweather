import type { ComponentType } from "react";
import type { CardId } from "../../types/prefs";
import type { CardDataBag } from "../../types/cardData";
import { HourlyCard } from "./HourlyCard";
import { SevenDayCard } from "./SevenDayCard";
import { RadarCard } from "./RadarCard";
import { DetailsCard } from "./DetailsCard";
import { MonthlyCard } from "./MonthlyCard";
import { TodayTonightCard } from "./TodayTonightCard";
import { ThreeDayCard } from "./ThreeDayCard";
import { SunMoonCard } from "./SunMoonCard";
import { AirUvCard } from "./AirUvCard";
import { WindCard } from "./WindCard";
import { AlmanacCard } from "./AlmanacCard";

export interface CardBodyProps {
  data: CardDataBag;
  variant?: string;
  /** For cards with an in-card variant toggle (hourly, days). */
  onVariantChange?: (value: string) => void;
}

export interface CardRegistryEntry {
  id: CardId;
  /** Name shown in the edit bar and the catalog tray. */
  label: string;
  Component: ComponentType<CardBodyProps>;
  /** Card body padding, from the design's padMap. */
  padding: string;
  /** Cards that stretch their content column-wise (radar, days). */
  flexColumn?: boolean;
  variantKey?: "hourlyVariant" | "sevenDayVariant";
  /** Cards whose data source the repo doesn't have yet are excluded from the catalog entirely. */
  isAvailable?: (data: CardDataBag) => boolean;
}

// Padding values from the design's padMap.
export const CARD_REGISTRY: Record<CardId, CardRegistryEntry> = {
  hourly: {
    id: "hourly",
    label: "Hourly",
    Component: HourlyCard,
    padding: "18px 10px 10px",
    variantKey: "hourlyVariant",
  },
  days: {
    id: "days",
    label: "7-Day forecast",
    Component: SevenDayCard,
    padding: "18px 18px 8px",
    flexColumn: true,
    variantKey: "sevenDayVariant",
  },
  radar: {
    id: "radar",
    label: "Radar",
    Component: RadarCard,
    padding: "16px 16px 16px",
    flexColumn: true,
  },
  details: {
    id: "details",
    label: "Details",
    Component: DetailsCard,
    padding: "18px 20px 20px",
  },
  monthly: {
    id: "monthly",
    label: "Monthly outlook",
    Component: MonthlyCard,
    padding: "18px 20px 18px",
  },
  today2: {
    id: "today2",
    label: "Today & Tonight",
    Component: TodayTonightCard,
    padding: "18px 20px 18px",
  },
  days3: {
    id: "days3",
    label: "Next 3 days",
    Component: ThreeDayCard,
    padding: "18px 20px 14px",
  },
  sunmoon: {
    id: "sunmoon",
    label: "Sun & Moon",
    Component: SunMoonCard,
    padding: "18px 20px 16px",
  },
  airuv: {
    id: "airuv",
    label: "Air quality & UV",
    Component: AirUvCard,
    padding: "18px 20px 16px",
    // No air-quality/UV data source in the repo yet — excluded from the catalog.
    isAvailable: () => false,
  },
  wind: {
    id: "wind",
    label: "Wind",
    Component: WindCard,
    padding: "18px 20px 16px",
  },
  almanac: {
    id: "almanac",
    label: "Almanac",
    Component: AlmanacCard,
    padding: "18px 20px 18px",
    // No NWS climate-normals/record source in the repo yet — excluded from the catalog.
    isAvailable: () => false,
  },
};
