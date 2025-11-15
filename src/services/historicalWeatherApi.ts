import type { Coordinates } from '../types/weather';

const BASE_URL = 'https://api.open-meteo.com/v1';
const USER_AGENT = '(EazyWeather, eazyweather@example.com)';

// Cache historical data since it doesn't change
const historicalCache = new Map<
  string,
  {
    data: HistoricalWeatherResponse;
    timestamp: number;
  }
>();

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Open-Meteo API response structure for historical weather data
 */
export interface HistoricalWeatherResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[]; // ISO 8601 dates: ["2025-11-01", "2025-11-02", ...]
    temperature_2m_max: number[]; // Max temperature in Fahrenheit
    temperature_2m_min: number[]; // Min temperature in Fahrenheit
    weather_code: number[]; // WMO Weather interpretation codes
  };
}

/**
 * Transformed historical day data
 */
export interface HistoricalDay {
  date: string; // ISO 8601 date
  dayOfMonth: number; // Day number (1-31)
  temperatureMax: number; // Max temperature in Fahrenheit
  temperatureMin: number; // Min temperature in Fahrenheit
  temperatureAvg: number; // Average of max and min
  weatherCode: number; // WMO code
  condition: string; // Human-readable condition
}

/**
 * WMO Weather interpretation codes to condition descriptions
 * https://open-meteo.com/en/docs
 */
const WMO_WEATHER_CODES: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly Clear',
  2: 'Partly Cloudy',
  3: 'Cloudy',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  56: 'Light Freezing Drizzle',
  57: 'Freezing Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Freezing Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  85: 'Light Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Hail',
  99: 'Thunderstorm with Hail',
};

/**
 * Get human-readable weather condition from WMO code
 */
function getConditionFromCode(code: number): string {
  return WMO_WEATHER_CODES[code] || 'Unknown';
}

/**
 * Fetch historical weather data from Open-Meteo API
 * @param coordinates - Latitude and longitude
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Historical weather data for the date range
 */
export async function getHistoricalWeather(
  coordinates: Coordinates,
  startDate: string,
  endDate: string,
): Promise<HistoricalDay[]> {
  const { latitude, longitude } = coordinates;

  // Create cache key
  const cacheKey = `${latitude},${longitude}:${startDate}:${endDate}`;

  // Check cache first
  const cached = historicalCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached historical weather data');
    return transformHistoricalData(cached.data);
  }

  // Build API URL
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    start_date: startDate,
    end_date: endDate,
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    temperature_unit: 'fahrenheit',
    timezone: 'auto', // Use local timezone for the location
  });

  const url = `${BASE_URL}/forecast?${params.toString()}`;

  try {
    console.log(`Fetching historical weather from Open-Meteo: ${startDate} to ${endDate}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Open-Meteo API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: HistoricalWeatherResponse = await response.json();

    // Cache the response
    historicalCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return transformHistoricalData(data);
  } catch (error) {
    console.error('Failed to fetch historical weather:', error);
    throw new Error(
      `Unable to fetch historical weather data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Transform Open-Meteo API response into our HistoricalDay format
 */
function transformHistoricalData(
  data: HistoricalWeatherResponse,
): HistoricalDay[] {
  const { daily } = data;
  const days: HistoricalDay[] = [];

  for (let i = 0; i < daily.time.length; i++) {
    const dateStr = daily.time[i];
    const date = new Date(dateStr);
    const dayOfMonth = date.getDate();

    const tempMax = daily.temperature_2m_max[i];
    const tempMin = daily.temperature_2m_min[i];
    const temperatureAvg = Math.round((tempMax + tempMin) / 2);

    const weatherCode = daily.weather_code[i];
    const condition = getConditionFromCode(weatherCode);

    days.push({
      date: dateStr,
      dayOfMonth,
      temperatureMax: Math.round(tempMax),
      temperatureMin: Math.round(tempMin),
      temperatureAvg,
      weatherCode,
      condition,
    });
  }

  return days;
}

/**
 * Get historical weather for the current month up to today
 * @param coordinates - Latitude and longitude
 * @returns Historical weather data for the current month
 */
export async function getHistoricalWeatherForCurrentMonth(
  coordinates: Coordinates,
): Promise<HistoricalDay[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Get first day of current month
  const startDate = new Date(year, month, 1);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Get yesterday (we don't want today since it's not complete yet)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const endDateStr = yesterday.toISOString().split('T')[0];

  // If we're on the 1st of the month, no historical data for this month yet
  if (now.getDate() === 1) {
    return [];
  }

  return getHistoricalWeather(coordinates, startDateStr, endDateStr);
}

/**
 * Get historical averages for prediction (same dates from previous years)
 * @param coordinates - Latitude and longitude
 * @param targetDate - Target date to get historical averages for
 * @param yearsBack - Number of years to look back (default: 3)
 * @returns Average temperature and most common condition
 */
export async function getHistoricalAverageForDate(
  coordinates: Coordinates,
  targetDate: Date,
  yearsBack: number = 3,
): Promise<{ temperature: number; condition: string }> {
  const month = targetDate.getMonth();
  const day = targetDate.getDate();
  const currentYear = new Date().getFullYear();

  const allData: HistoricalDay[] = [];

  // Fetch data for the same date from previous years
  for (let i = 1; i <= yearsBack; i++) {
    const year = currentYear - i;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    try {
      const data = await getHistoricalWeather(coordinates, dateStr, dateStr);
      if (data.length > 0) {
        allData.push(data[0]);
      }
    } catch (error) {
      console.warn(`Could not fetch historical data for ${dateStr}:`, error);
      // Continue with other years
    }
  }

  if (allData.length === 0) {
    // Fallback if no data available
    return { temperature: 65, condition: 'Partly Cloudy' };
  }

  // Calculate average temperature
  const avgTemp = Math.round(
    allData.reduce((sum, day) => sum + day.temperatureAvg, 0) / allData.length,
  );

  // Find most common condition
  const conditionCounts: Record<string, number> = {};
  allData.forEach((day) => {
    conditionCounts[day.condition] = (conditionCounts[day.condition] || 0) + 1;
  });

  const mostCommonCondition = Object.keys(conditionCounts).reduce((a, b) =>
    conditionCounts[a] > conditionCounts[b] ? a : b,
  );

  return {
    temperature: avgTemp,
    condition: mostCommonCondition,
  };
}
