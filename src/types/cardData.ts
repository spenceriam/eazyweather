import type {
  Coordinates,
  CurrentConditions,
  ForecastPeriod,
  HourlyForecast,
  MonthlyForecast,
} from "./weather";
import type { WeatherAlert } from "./alerts";

/** Shared data bag passed to every dashboard card body. */
export interface CardDataBag {
  currentConditions: CurrentConditions | null;
  forecast: ForecastPeriod[];
  hourlyForecast: HourlyForecast[];
  monthlyForecast: MonthlyForecast | null;
  timezone: string;
  coordinates: Coordinates | null;
  alerts: WeatherAlert[];
}
