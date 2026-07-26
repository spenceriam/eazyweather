import type { ThemeMode } from "../utils/themeUtils";

export type { ThemeMode };

export type CardId =
  | "hourly"
  | "days"
  | "radar"
  | "details"
  | "monthly"
  | "today2"
  | "days3"
  | "sunmoon"
  | "airuv"
  | "wind"
  | "almanac";

export type CardSpan = 1 | 2 | "full";

export interface CardLayout {
  order: CardId[];
  visible: Record<CardId, boolean>;
  spans: Record<CardId, CardSpan>;
  columns: 1 | 2 | 3;
  hourlyVariant: "chips" | "trend";
  sevenDayVariant: "rows" | "columns";
}

export interface Prefs {
  theme: ThemeMode;
  timezone: string;
  consent: "granted" | "denied" | "unset";
  layout: CardLayout;
  radarLoop: boolean;
  hiddenAlertIds: string[];
}

export const CARD_IDS: CardId[] = [
  "hourly",
  "days",
  "radar",
  "details",
  "monthly",
  "today2",
  "days3",
  "sunmoon",
  "airuv",
  "wind",
  "almanac",
];

export const CARD_LABELS: Record<CardId, string> = {
  hourly: "Hourly",
  days: "7-Day",
  radar: "Radar",
  details: "Details",
  monthly: "Monthly",
  today2: "Today & Tonight",
  days3: "Next 3 Days",
  sunmoon: "Sun & Moon",
  airuv: "Air Quality & UV",
  wind: "Wind",
  almanac: "Almanac",
};

export const DEFAULT_CARD_LAYOUT: CardLayout = {
  order: [...CARD_IDS],
  visible: {
    hourly: true,
    days: true,
    radar: true,
    details: true,
    monthly: true,
    today2: false,
    days3: false,
    sunmoon: false,
    airuv: false,
    wind: false,
    almanac: false,
  },
  spans: {
    hourly: "full",
    days: 1,
    radar: 1,
    details: 1,
    monthly: "full",
    today2: 1,
    days3: 1,
    sunmoon: 1,
    airuv: 1,
    wind: 1,
    almanac: 1,
  },
  columns: 2,
  hourlyVariant: "chips",
  sevenDayVariant: "rows",
};
