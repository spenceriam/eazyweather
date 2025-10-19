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
  windDirection: number;
  textDescription: string;
  icon: string;
  timestamp: string;
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
  type: 'coordinates' | 'manual';
  coordinates: Coordinates;
  displayName?: string;
}

export type ViewMode = 'current' | 'forecast' | 'hourly' | 'radar';
