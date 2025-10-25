import type {
  Coordinates,
  WeatherPoint,
  CurrentConditions,
  ForecastPeriod,
  HourlyForecast,
  MonthlyForecast,
  MonthlyDay,
} from "../types/weather";
import { BASE_URL } from "./config";

const BASE_URL = "https://api.weather.gov";
const USER_AGENT = "(EazyWeather, eazyweather@example.com)";

// Rate limiting configuration
const MIN_REQUEST_INTERVAL = 30000; // 30 seconds minimum between requests
const RATE_LIMIT_RETRY_DELAY = 5000; // 5 seconds retry delay
const MAX_RETRY_ATTEMPTS = 3;

// Request cache to prevent duplicate API calls
const requestCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    promise?: Promise<any>;
  }
>();

// Rate limiting queue for requests that hit rate limits
const requestQueue: Array<{
  url: string;
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  retryCount: number;
}> = [];

let isProcessingQueue = false;

async function fetchWithUserAgent(
  url: string,
  options: {
    skipCache?: boolean;
    skipRateLimit?: boolean;
  } = {},
): Promise<any> {
  const cacheKey = url;
  const now = Date.now();

  // Check cache first (unless explicitly skipped)
  if (!options.skipCache) {
    const cached = requestCache.get(cacheKey);
    if (cached && now - cached.timestamp < MIN_REQUEST_INTERVAL) {
      console.log(`Returning cached data for ${url}`);
      return cached.data;
    }
  }

  // Check if there's already a pending request for this URL (unless skipping cache)
  const cachedRequest = requestCache.get(cacheKey);
  if (!options.skipCache && cachedRequest?.promise) {
    console.log(`Returning pending request for ${url}`);
    return cachedRequest.promise;
  }

  // Create and cache the promise
  const promise = (async () => {
    // Rate limiting check (unless explicitly skipped)
    if (!options.skipRateLimit) {
      const lastRequest = Array.from(requestCache.values())
        .filter((c) => c.timestamp > now - MIN_REQUEST_INTERVAL)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (lastRequest && now - lastRequest.timestamp < MIN_REQUEST_INTERVAL) {
        console.log(
          `Rate limiting request for ${url}, adding to queue (${MIN_REQUEST_INTERVAL - (now - lastRequest.timestamp)}ms remaining)`,
        );
        return new Promise((resolve, reject) => {
          requestQueue.push({
            url,
            resolve,
            reject,
            retryCount: 0,
          });
          processQueue();
        });
      }
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/geo+json",
        },
      });

      if (!response.ok) {
        // Handle rate limit errors (429)
        if (response.status === 429) {
          console.warn(`Rate limit hit for ${url}, queuing retry`);
          return new Promise((resolve, reject) => {
            requestQueue.push({
              url,
              resolve,
              reject,
              retryCount: 0,
            });
            processQueue();
          });
        }
        throw new Error(
          `Weather API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Cache the successful response (unless skipping cache)
      if (!options.skipCache) {
        requestCache.set(cacheKey, {
          data,
          timestamp: now,
        });
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  })();

  // Cache the promise (even if it will be queued) unless skipping cache
  if (!options.skipCache) {
    requestCache.set(cacheKey, {
      data: null,
      timestamp: now,
      promise,
    });
  }

  return promise;
}

// Process request queue with rate limit delays
async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift()!;
    console.log(`Processing queued request for ${request.url}`);

    try {
      // Always wait minimum interval between queued requests
      const lastRequest = Array.from(requestCache.values()).sort(
        (a, b) => b.timestamp - a.timestamp,
      )[0];

      if (lastRequest) {
        const timeSinceLastRequest = Date.now() - lastRequest.timestamp;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          console.log(
            `Waiting ${MIN_REQUEST_INTERVAL - timeSinceLastRequest}ms before next request`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest),
          );
        }
      }

      // Wait for rate limit delay if this is a retry
      if (request.retryCount > 0) {
        console.log(`Retry attempt ${request.retryCount} for ${request.url}`);
        await new Promise((resolve) =>
          setTimeout(resolve, RATE_LIMIT_RETRY_DELAY),
        );
      }

      console.log(`Making API call for ${request.url}`);
      const apiResponse = await fetch(request.url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/geo+json",
        },
      });

      const data = await apiResponse.json();
      console.log(`API response for ${request.url}: ${apiResponse.status}`);

      // Update cache with successful response
      if (apiResponse.ok) {
        requestCache.set(request.url, {
          data,
          timestamp: Date.now(),
        });
        request.resolve(data);
      } else if (
        apiResponse.status === 429 &&
        request.retryCount < MAX_RETRY_ATTEMPTS
      ) {
        // Retry rate limited requests
        console.log(`Rate limited, retrying ${request.url}`);
        request.retryCount++;
        requestQueue.unshift(request); // Put back at front of queue
      } else {
        request.reject(
          new Error(
            `Weather API error: ${apiResponse.status} ${apiResponse.statusText}`,
          ),
        );
      }
    } catch (error) {
      console.error(`Queue request failed for ${request.url}:`, error);
      if (request.retryCount < MAX_RETRY_ATTEMPTS) {
        request.retryCount++;
        requestQueue.unshift(request); // Put back at front of queue
      } else {
        request.reject(error as Error);
      }
    }
  }

  isProcessingQueue = false;
}

export async function getWeatherPoint(
  coords: Coordinates,
  options: { skipRateLimit?: boolean } = {},
): Promise<WeatherPoint> {
  const url = `${BASE_URL}/points/${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
  return fetchWithUserAgent(url, options);
}

export async function getCurrentConditions(
  coords: Coordinates,
  options: { skipRateLimit?: boolean } = {},
): Promise<CurrentConditions | null> {
  try {
    const point = await getWeatherPoint(coords, options);
    const stationsUrl = point.properties.observationStations;
    const stationsData = await fetchWithUserAgent(stationsUrl, {
      ...options,
      skipRateLimit: true, // Skip rate limiting since we already got the point
    });

    if (!stationsData.features || stationsData.features.length === 0) {
      return null;
    }

    const stationId = stationsData.features[0].properties.stationIdentifier;
    const observationUrl = `${BASE_URL}/stations/${stationId}/observations/latest`;
    const observation = await fetchWithUserAgent(observationUrl, {
      ...options,
      skipRateLimit: true, // Skip rate limiting for observations
    });

    const props = observation.properties;

    return {
      temperature: props.temperature.value,
      temperatureUnit:
        props.temperature.unitCode === "wmoUnit:degC" ? "C" : "F",
      relativeHumidity: props.relativeHumidity.value,
      windSpeed: props.windSpeed.value
        ? `${Math.round(props.windSpeed.value * 0.621371)} mph`
        : "Calm",
      windDirection: props.windDirection.value || 0,
      textDescription: props.textDescription || "Unknown",
      icon: props.icon || "",
      timestamp: props.timestamp,
    };
  } catch (error) {
    console.error("Error fetching current conditions:", error);
    return null;
  }
}

export async function get7DayForecast(
  coords: Coordinates,
  options: { skipRateLimit?: boolean } = {},
): Promise<ForecastPeriod[]> {
  try {
    const point = await getWeatherPoint(coords, options);
    const forecastUrl = point.properties.forecast;
    const forecastData = await fetchWithUserAgent(forecastUrl, {
      ...options,
      skipCache: true, // Don't use cache for forecast data
      skipRateLimit: true, // Skip rate limiting since we already got the point
    });

    return forecastData.properties.periods.slice(0, 14);
  } catch (error) {
    console.error("Error fetching 7-day forecast:", error);
    throw error;
  }
}

export async function getHourlyForecast(
  coords: Coordinates,
  options: { skipRateLimit?: boolean } = {},
): Promise<HourlyForecast[]> {
  try {
    const point = await getWeatherPoint(coords, options);
    const hourlyUrl = point.properties.forecastHourly;
    const hourlyData = await fetchWithUserAgent(hourlyUrl, {
      ...options,
      skipCache: true, // Don't use cache for forecast data
      skipRateLimit: true, // Skip rate limiting since we already got the point
    });

    return hourlyData.properties.periods.slice(0, 48);
  } catch (error) {
    console.error("Error fetching hourly forecast:", error);
    throw error;
  }
}

export async function getMonthlyForecast(
  coords: Coordinates,
  options: { skipRateLimit?: boolean } = {},
): Promise<MonthlyForecast> {
  try {
    const sevenDayForecast = await get7DayForecast(coords, {
      ...options,
      skipCache: true, // Don't use cache for forecast data
    });
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: MonthlyDay[] = [];

    // Calculate average temperature from available forecast data
    const availableTemps = sevenDayForecast.map((period) => period.temperature);
    const avgTemp =
      availableTemps.length > 0
        ? Math.round(
            availableTemps.reduce((sum, temp) => sum + temp, 0) /
              availableTemps.length,
          )
        : 65; // fallback average

    // Get most common condition from available forecast
    const conditionCounts = sevenDayForecast.reduce(
      (acc, period) => {
        acc[period.shortForecast] = (acc[period.shortForecast] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostCommonCondition =
      Object.keys(conditionCounts).length > 0
        ? Object.keys(conditionCounts).reduce((a, b) =>
            conditionCounts[a] > conditionCounts[b] ? a : b,
          )
        : "Partly Cloudy";

    const mostCommonIcon =
      sevenDayForecast.length > 0 ? sevenDayForecast[0].icon : "";

    for (let day = 1; day <= daysInMonth; day++) {
      const forecastDay = sevenDayForecast.find((period) => {
        const periodDate = new Date(period.startTime);
        return periodDate.getDate() === day;
      });

      if (forecastDay) {
        days.push({
          date: day,
          temperature: forecastDay.temperature,
          condition: forecastDay.shortForecast,
          icon: forecastDay.icon,
          isAvailable: true,
        });
      } else {
        // Use calculated averages for days beyond 7-day forecast
        days.push({
          date: day,
          temperature: avgTemp,
          condition: mostCommonCondition,
          icon: mostCommonIcon,
          isAvailable: false,
        });
      }
    }

    return {
      month: currentMonth,
      year: currentYear,
      days,
    };
  } catch (error) {
    console.error("Error calculating monthly forecast:", error);
    throw error;
  }
}

// Comprehensive function to get all weather data with a single point API call
export async function getAllWeatherData(
  coords: Coordinates,
  options: { skipRateLimit?: boolean } = {},
): Promise<{
  current: CurrentConditions | null;
  forecast: ForecastPeriod[];
  hourly: HourlyForecastType[];
  monthly: MonthlyForecast;
}> {
  try {
    // Get the weather point once
    const point = await getWeatherPoint(coords, options);

    // Make all API calls in parallel with the point data
    const [stationsData, forecastData, hourlyData] = await Promise.all([
      fetchWithUserAgent(point.properties.observationStations, {
        ...options,
        skipRateLimit: true, // Skip rate limiting since we already got the point
      }),
      fetchWithUserAgent(point.properties.forecast, {
        ...options,
        skipCache: true, // Don't use cache for forecast data
        skipRateLimit: true, // Skip rate limiting since we already got the point
      }),
      fetchWithUserAgent(point.properties.forecastHourly, {
        ...options,
        skipCache: true, // Don't use cache for forecast data
        skipRateLimit: true, // Skip rate limiting since we already got the point
      }),
    ]);

    // Process current conditions
    let current: CurrentConditions | null = null;
    if (stationsData.features && stationsData.features.length > 0) {
      const stationId = stationsData.features[0].properties.stationIdentifier;
      const observationUrl = `${BASE_URL}/stations/${stationId}/observations/latest`;
      const observation = await fetchWithUserAgent(observationUrl, {
        ...options,
        skipRateLimit: true, // Skip rate limiting for observations
      });

      const props = observation.properties;

      current = {
        temperature: props.temperature.value,
        temperatureUnit:
          props.temperature.unitCode === "wmoUnit:degC" ? "C" : "F",
        relativeHumidity: props.relativeHumidity.value,
        windSpeed: props.windSpeed.value
          ? `${Math.round(props.windSpeed.value * 0.621371)} mph`
          : "Calm",
        windSpeedValue: props.windSpeed.value
          ? props.windSpeed.value * 0.621371
          : 0,
        windDirection: props.windDirection.value || 0,
        textDescription: props.textDescription || "Unknown",
        icon: props.icon || "",
        timestamp: props.timestamp,
        heatIndex: props.heatIndex?.value,
        windChill: props.windChill?.value,
        dewpoint: props.dewpoint?.value,
        windGust: props.windGust?.value
          ? props.windGust.value * 0.621371
          : undefined, // Convert m/s to mph
        precipitationLastHour: props.precipitationLastHour?.value,
        snowDepth: props.snowDepth?.value, // Already in inches
        sunriseTime: props.sunriseTime,
        sunsetTime: props.sunsetTime,
      };
    }

    // Process forecast data
    const forecast = forecastData.properties.periods.slice(0, 14);
    const hourly = hourlyData.properties.periods.slice(0, 48);

    // Add sunrise/sunset to current conditions using API
    if (current && coords) {
      const { sunrise, sunset } = await getSunriseSunsetFromAPI(coords);
      current.sunriseTime = sunrise;
      current.sunsetTime = sunset;
    }

    // Calculate monthly forecast
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: MonthlyDay[] = [];

    // Calculate average temperature from available forecast data
    const availableTemps = forecast.map((period) => period.temperature);
    const avgTemp =
      availableTemps.length > 0
        ? Math.round(
            availableTemps.reduce((sum, temp) => sum + temp, 0) /
              availableTemps.length,
          )
        : 65; // fallback average

    // Get most common condition from available forecast
    const conditionCounts = forecast.reduce(
      (acc, period) => {
        acc[period.shortForecast] = (acc[period.shortForecast] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostCommonCondition =
      Object.keys(conditionCounts).length > 0
        ? Object.keys(conditionCounts).reduce((a, b) =>
            conditionCounts[a] > conditionCounts[b] ? a : b,
          )
        : "Partly Cloudy";

    const mostCommonIcon = forecast.length > 0 ? forecast[0].icon : "";

    for (let day = 1; day <= daysInMonth; day++) {
      const forecastDay = forecast.find((period) => {
        const periodDate = new Date(period.startTime);
        return periodDate.getDate() === day;
      });

      if (forecastDay) {
        days.push({
          date: day,
          temperature: forecastDay.temperature,
          condition: forecastDay.shortForecast,
          icon: forecastDay.icon,
          isAvailable: true,
        });
      } else {
        // Use calculated averages for days beyond 7-day forecast
        days.push({
          date: day,
          temperature: avgTemp,
          condition: mostCommonCondition,
          icon: mostCommonIcon,
          isAvailable: false,
        });
      }
    }

    // Get sunrise and sunset from sunrise-sunset.org API
    async function getSunriseSunsetFromAPI(coords: Coordinates): Promise<{
      sunrise: string;
      sunset: string;
    }> {
      try {
        // Try using timezone ID for more accurate local times
        const today = new Date().toISOString().split("T")[0];
        const url = `https://api.sunrise-sunset.org/json?lat=${coords.latitude}&lng=${coords.longitude}&date=${today}&formatted=0&tzid=America/Chicago`;
        const response = await fetchWithUserAgent(url, { skipRateLimit: true });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === "OK") {
          // Parse the API response correctly
          const sunriseTime = data.results.sunrise;
          const sunsetTime = data.results.sunset;

          return {
            sunrise: sunriseTime,
            sunset: sunsetTime,
          };
        } else {
          throw new Error(data.status || "Unknown API error");
        }
      } catch (error) {
        console.error("Error fetching sunrise/sunset:", error);
        // Fallback to calculation
        return calculateSunriseSunset(coords);
      }
    }

    // Calculate sunrise and sunset times from coordinates (fallback)
    function calculateSunriseSunset(coords: Coordinates): {
      sunrise: string;
      sunset: string;
    } {
      const now = new Date();
      const dayOfYear = Math.floor(
        (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Approximate sunrise/sunset calculation
      const latRad = (coords.latitude * Math.PI) / 180;
      const declination =
        23.45 *
        Math.sin(((dayOfYear + 284) * 2 * Math.PI) / 365) *
        (Math.PI / 180);

      // Sunrise time (in hours from midnight)
      const sunriseHour =
        12 -
        (1 / 15) *
          Math.acos(
            (-Math.tan(latRad) * Math.tan(declination)) /
              Math.sqrt(
                1 - Math.pow(Math.tan(latRad) * Math.tan(declination), 2),
              ),
          );

      // Sunset time (in hours from midnight)
      const sunsetHour =
        12 +
        (1 / 15) *
          Math.acos(
            (-Math.tan(latRad) * Math.tan(declination)) /
              Math.sqrt(
                1 - Math.pow(Math.tan(latRad) * Math.tan(declination), 2),
              ),
          );

      // Convert to Date objects
      const sunrise = new Date(now);
      sunrise.setHours(
        Math.floor(sunriseHour),
        Math.floor((sunriseHour % 1) * 60),
        0,
      );

      const sunset = new Date(now);
      sunset.setHours(
        Math.floor(sunsetHour),
        Math.floor((sunsetHour % 1) * 60),
        0,
      );

      return {
        sunrise: sunrise.toISOString(),
        sunset: sunset.toISOString(),
      };
    }

    const monthly: MonthlyForecast = {
      month: currentMonth,
      year: currentYear,
      days,
    };

    return {
      current,
      forecast,
      hourly,
      monthly,
    };
  } catch (error) {
    console.error("Error fetching all weather data:", error);
    throw error;
  }
}

// Export rate limiting utilities for testing and debugging
export const rateLimitConfig = {
  MIN_REQUEST_INTERVAL,
  RATE_LIMIT_RETRY_DELAY,
  MAX_RETRY_ATTEMPTS,
};

export function clearRequestCache(): void {
  requestCache.clear();
}

export function getCacheSize(): number {
  return requestCache.size;
}
