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
}

export interface VariantOption {
  value: string;
  label: string;
}

export interface CardRegistryEntry {
  id: CardId;
  label: string;
  Component: ComponentType<CardBodyProps>;
  variantKey?: "hourlyVariant" | "sevenDayVariant";
  variantOptions?: VariantOption[];
  /** Cards whose data source the repo doesn't have yet are excluded from the catalog entirely. */
  isAvailable?: (data: CardDataBag) => boolean;
}

export const CARD_REGISTRY: Record<CardId, CardRegistryEntry> = {
  hourly: {
    id: "hourly",
    label: "Hourly",
    Component: HourlyCard,
    variantKey: "hourlyVariant",
    variantOptions: [
      { value: "chips", label: "Chips" },
      { value: "trend", label: "Trend" },
    ],
  },
  days: {
    id: "days",
    label: "7-Day",
    Component: SevenDayCard,
  },
  radar: {
    id: "radar",
    label: "Radar",
    Component: RadarCard,
  },
  details: {
    id: "details",
    label: "Details",
    Component: DetailsCard,
  },
  monthly: {
    id: "monthly",
    label: "Monthly",
    Component: MonthlyCard,
  },
  today2: {
    id: "today2",
    label: "Today & Tonight",
    Component: TodayTonightCard,
  },
  days3: {
    id: "days3",
    label: "Next 3 Days",
    Component: ThreeDayCard,
  },
  sunmoon: {
    id: "sunmoon",
    label: "Sun & Moon",
    Component: SunMoonCard,
  },
  airuv: {
    id: "airuv",
    label: "Air Quality & UV",
    Component: AirUvCard,
    // No air-quality/UV data source in the repo yet — excluded from the catalog.
    isAvailable: () => false,
  },
  wind: {
    id: "wind",
    label: "Wind",
    Component: WindCard,
  },
  almanac: {
    id: "almanac",
    label: "Almanac",
    Component: AlmanacCard,
    // No NWS climate-normals/record source in the repo yet — excluded from the catalog.
    isAvailable: () => false,
  },
};
