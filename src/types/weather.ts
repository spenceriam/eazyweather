export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherPoint {
  properties: {
    forecast: string;
    forecastHourly: string;
    forecastGridData: string;
    observationStations: string;
    gridId: string;
    gridX: number;
    gridY: number;
  };
}

export interface CurrentConditions {
  temperature: number;
  temperatureUnit: string;
  relativeHumidity: number;
  windSpeed: string;
  windSpeedValue?: number;
  windDirection: number;
  textDescription: string;
  icon: string;
  timestamp: string;
  heatIndex?: number;
  windChill?: number;
  dewpoint?: number;
  windGust?: number;
  precipitationLastHour?: number;
  snowDepth?: number;
  sunriseTime?: string;
  sunsetTime?: string;
  uvIndex?: number;
  todayHigh?: number;
  todayLow?: number;
  timezone?: string;
}

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
  isDaytime: boolean;
}

export interface HourlyForecast {
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  shortForecast: string;
  icon: string;
  isDaytime: boolean;
}

export interface Location {
  type: "coordinates" | "manual";
  coordinates: Coordinates;
  displayName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface MonthlyDay {
  date: number;
  temperature: number;
  condition: string;
  icon: string;
  isAvailable: boolean;
}

export interface MonthlyForecast {
  month: number;
  year: number;
  days: MonthlyDay[];
}
