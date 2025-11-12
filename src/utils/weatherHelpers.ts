import type { ForecastPeriod, DailyForecast } from '../types/weather';

/**
 * Abbreviates wind direction from full name to 1-3 letter code
 * Examples: "North" → "N", "Northwest" → "NW", "North by Northwest" → "NNW"
 */
export function abbreviateWindDirection(direction: string): string {
  const abbreviations: Record<string, string> = {
    'North': 'N',
    'North by Northeast': 'NNE',
    'Northeast': 'NE',
    'East by Northeast': 'ENE',
    'East': 'E',
    'East by Southeast': 'ESE',
    'Southeast': 'SE',
    'South by Southeast': 'SSE',
    'South': 'S',
    'South by Southwest': 'SSW',
    'Southwest': 'SW',
    'West by Southwest': 'WSW',
    'West': 'W',
    'West by Northwest': 'WNW',
    'Northwest': 'NW',
    'North by Northwest': 'NNW',
  };

  // Direct match
  if (abbreviations[direction]) {
    return abbreviations[direction];
  }

  // Try case-insensitive match
  const lowerDirection = direction.toLowerCase();
  for (const [full, abbr] of Object.entries(abbreviations)) {
    if (full.toLowerCase() === lowerDirection) {
      return abbr;
    }
  }

  // If already abbreviated or unknown, return as-is
  return direction;
}

/**
 * Converts wind direction from degrees to abbreviated cardinal direction
 */
export function degreesToAbbreviatedDirection(degrees: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];

  const index = Math.round(((degrees + 11.25) % 360) / 22.5);
  return directions[index % 16];
}

/**
 * Transforms forecast periods into daily forecasts for carousel
 * Groups day/night periods into single day cards
 */
export function transformToDailyForecasts(
  forecastPeriods: ForecastPeriod[]
): DailyForecast[] {
  const dailyForecasts: DailyForecast[] = [];
  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Group periods by day
  for (let i = 0; i < forecastPeriods.length - 1; i++) {
    const currentPeriod = forecastPeriods[i];
    const nextPeriod = forecastPeriods[i + 1];

    // Skip if this period is nighttime (we want to start with daytime)
    if (!currentPeriod.isDaytime) {
      continue;
    }

    // Get the date string for this period
    const periodDate = new Date(currentPeriod.startTime);
    const periodDateString = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}-${String(periodDate.getDate()).padStart(2, '0')}`;

    // Skip today - we already have Current Conditions for today
    if (periodDateString === todayDateString) {
      continue;
    }

    // Get day name from date (always use day of week, no "Today" or "Tomorrow")
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[periodDate.getDay()];

    // Determine high/low temperatures
    const high = currentPeriod.temperature; // Daytime temp is the high
    const low = nextPeriod && !nextPeriod.isDaytime ? nextPeriod.temperature : currentPeriod.temperature;

    dailyForecasts.push({
      date: periodDateString,
      dayName,
      high,
      low,
      icon: currentPeriod.icon,
      shortForecast: currentPeriod.shortForecast,
      detailedForecast: currentPeriod.detailedForecast,
      windSpeed: currentPeriod.windSpeed,
      windDirection: abbreviateWindDirection(currentPeriod.windDirection),
      isDaytime: true,
      temperatureUnit: currentPeriod.temperatureUnit,
    });

    // Only get 3 days for the carousel (Tomorrow + 2 more days after)
    if (dailyForecasts.length >= 3) {
      break;
    }
  }

  return dailyForecasts;
}

/**
 * Gets a friendly day name for display
 * "Today", "Tomorrow", or day of week
 */
export function getDayName(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reset hours for comparison
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }
}

/**
 * Extracts numeric wind speed from string like "10 mph" or "5 to 10 mph"
 */
export function extractWindSpeed(windSpeedString: string): number {
  const match = windSpeedString.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Formats wind display with abbreviated direction
 * Example: "10 mph NW" or "Calm"
 */
export function formatWindDisplay(speed: number, direction: string): string {
  if (speed === 0) {
    return 'Calm';
  }

  const abbr = abbreviateWindDirection(direction);
  return `${speed} mph ${abbr}`;
}
