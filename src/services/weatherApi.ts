import type {
  Coordinates,
  WeatherPoint,
  CurrentConditions,
  ForecastPeriod,
  HourlyForecast,
  MonthlyForecast,
  MonthlyDay,
} from "../types/weather";
import {
  getHistoricalWeatherForCurrentMonth,
  getHistoricalAveragesForRange,
} from "./historicalWeatherApi";

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

// Cache for timezone data to avoid repeated API calls
const timezoneCache = new Map<string, string>();

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
      return cached.data;
    }
  }

  // Check if there's already a pending request for this URL (unless skipping cache)
  const cachedRequest = requestCache.get(cacheKey);
  if (!options.skipCache && cachedRequest?.promise) {
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
      // Use appropriate Accept header based on API
      const acceptHeader =
        url.includes("sunrise-sunset.org") ||
        url.includes("nominatim.openstreetmap.org")
          ? "application/json"
          : "application/geo+json";

      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: acceptHeader,
        },
      });

      if (!response.ok) {
        // Handle rate limit errors (429)
        if (response.status === 429) {
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

    try {
      // Always wait minimum interval between queued requests
      const lastRequest = Array.from(requestCache.values()).sort(
        (a, b) => b.timestamp - a.timestamp,
      )[0];

      if (lastRequest) {
        const timeSinceLastRequest = Date.now() - lastRequest.timestamp;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest),
          );
        }
      }

      // Wait for rate limit delay if this is a retry
      if (request.retryCount > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, RATE_LIMIT_RETRY_DELAY),
        );
      }

      const apiResponse = await fetch(request.url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/geo+json",
        },
      });

      const data = await apiResponse.json();

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
  options: { skipRateLimit?: boolean; skipCache?: boolean } = {},
): Promise<WeatherPoint> {
  const url = `${BASE_URL}/points/${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
  return fetchWithUserAgent(url, options);
}

export async function getCurrentConditions(
  coords: Coordinates,
  options: { skipRateLimit?: boolean; skipCache?: boolean } = {},
): Promise<CurrentConditions | null> {
  try {
    // Don't skip cache for point data as it rarely changes
    const point = await getWeatherPoint(coords, { ...options, skipCache: false });
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

    // Get hourly forecast as fallback for text description if needed
    let textDescription = props.textDescription;
    if (!textDescription) {
      try {
        const hourlyForecast = await getHourlyForecast(coords, options);
        if (hourlyForecast && hourlyForecast.length > 0) {
          textDescription = hourlyForecast[0].shortForecast;
        }
      } catch {
        // Silently handle hourly forecast fallback errors
      }
    }

    return {
      temperature: props.temperature.value,
      temperatureUnit:
        props.temperature.unitCode === "wmoUnit:degC" ? "C" : "F",
      relativeHumidity: props.relativeHumidity.value,
      windSpeedValue: (props.windSpeed.value ?? 0) * 0.621371,
      windDirection: props.windDirection.value || 0,
      textDescription: textDescription || "Unknown",
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
  options: { skipRateLimit?: boolean; skipCache?: boolean } = {},
): Promise<ForecastPeriod[]> {
  try {
    // Don't skip cache for point data as it rarely changes
    const point = await getWeatherPoint(coords, { ...options, skipCache: false });
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
  options: { skipRateLimit?: boolean; skipCache?: boolean } = {},
): Promise<HourlyForecast[]> {
  try {
    // Don't skip cache for point data as it rarely changes
    const point = await getWeatherPoint(coords, { ...options, skipCache: false });
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
    // Get current date information
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: MonthlyDay[] = [];

    // Get 7-day forecast first (required, fast)
    const sevenDayForecast = await get7DayForecast(coords, {
      ...options,
      skipCache: true, // Don't use cache for forecast data
    });

    // Create a map of forecast data by day number
    const forecastByDay = new Map<number, ForecastPeriod>();
    sevenDayForecast.forEach((period) => {
      const periodDate = new Date(period.startTime);
      const dayNum = periodDate.getDate();
      // Only add if we don't already have this day (keep first occurrence)
      if (!forecastByDay.has(dayNum)) {
        forecastByDay.set(dayNum, period);
      }
    });

    // Find default icon from forecast for predictions
    const defaultIcon =
      sevenDayForecast.length > 0 ? sevenDayForecast[0].icon : "";

    // Find the range of days that need predictions
    const forecastDays = Array.from(forecastByDay.keys());
    const maxForecastDay = forecastDays.length > 0 ? Math.max(...forecastDays) : currentDay;
    const firstPredictionDay = maxForecastDay + 1;

    // Fetch historical data and prediction data IN PARALLEL (non-blocking)
    const [historicalResult, predictionResult] = await Promise.allSettled([
      // Historical data for past days
      getHistoricalWeatherForCurrentMonth(coords).catch(() => []),

      // Prediction data for future days
      (firstPredictionDay <= daysInMonth
        ? (async () => {
            const predictionStartDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(firstPredictionDay).padStart(2, '0')}`;
            const predictionEndDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
            return await getHistoricalAveragesForRange(
              coords,
              predictionStartDate,
              predictionEndDate,
              1, // 1 year back for faster loading
            );
          })()
        : Promise.resolve(new Map())),
    ]);

    // Extract historical data
    const historicalData: Map<number, { temp: number; condition: string }> = new Map();
    if (historicalResult.status === 'fulfilled') {
      historicalResult.value.forEach((day) => {
        historicalData.set(day.dayOfMonth, {
          temp: day.temperatureAvg,
          condition: day.condition,
        });
      });
      console.log(
        `✅ Fetched historical data for ${historicalResult.value.length} days of current month`,
      );
    } else {
      console.warn("Could not fetch historical data:", historicalResult.reason);
    }

    // Extract prediction data
    const predictionData: Map<number, { temperature: number; condition: string }> =
      predictionResult.status === 'fulfilled'
        ? predictionResult.value
        : new Map();

    if (predictionResult.status === 'fulfilled') {
      console.log(
        `✅ Fetched historical averages for ${predictionData.size} prediction days`,
      );
    } else {
      console.warn("Could not fetch prediction data:", predictionResult.reason);
    }

    // Build the monthly calendar
    for (let day = 1; day <= daysInMonth; day++) {
      const isPast = day < currentDay;
      const hasForecast = forecastByDay.has(day);
      const hasHistorical = historicalData.has(day);
      const hasPrediction = predictionData.has(day);

      if (isPast) {
        // All past days are marked as "historical" regardless of data source
        if (hasHistorical) {
          // Use actual historical data
          const hist = historicalData.get(day)!;
          days.push({
            date: day,
            temperature: hist.temp,
            condition: hist.condition,
            icon: defaultIcon, // Open-Meteo doesn't provide icons, use NWS icon
            dataType: "historical",
          });
        } else if (hasForecast) {
          // Use forecast data as fallback, but still mark as historical
          const forecast = forecastByDay.get(day)!;
          days.push({
            date: day,
            temperature: forecast.temperature,
            condition: forecast.shortForecast,
            icon: forecast.icon,
            dataType: "historical",
          });
        } else {
          // Use prediction data as fallback, but still mark as historical
          const prediction = hasPrediction
            ? predictionData.get(day)!
            : { temperature: 65, condition: "Partly Cloudy" }; // fallback
          days.push({
            date: day,
            temperature: prediction.temperature,
            condition: prediction.condition,
            icon: defaultIcon,
            dataType: "historical",
          });
        }
      } else if (hasForecast) {
        // Use NWS forecast data (today + next 7 days)
        const forecast = forecastByDay.get(day)!;
        days.push({
          date: day,
          temperature: forecast.temperature,
          condition: forecast.shortForecast,
          icon: forecast.icon,
          dataType: "forecast",
        });
      } else {
        // Use historical averages for prediction (days beyond forecast)
        const prediction = hasPrediction
          ? predictionData.get(day)!
          : { temperature: 65, condition: "Partly Cloudy" }; // fallback

        days.push({
          date: day,
          temperature: prediction.temperature,
          condition: prediction.condition,
          icon: defaultIcon,
          dataType: "prediction",
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
  options: { skipRateLimit?: boolean; includeMonthly?: boolean } = {},
): Promise<{
  current: CurrentConditions | null;
  forecast: ForecastPeriod[];
  hourly: HourlyForecast[];
  monthly: MonthlyForecast | null;
}> {
  try {
    // Get weather point once with longer timeout for ZIP code searches
    const point = await getWeatherPoint(coords, options);

    if (!point || !point.properties) {
      console.error("❌ Invalid weather point response:", point);
      throw new Error("Weather service not available for this location");
    }

    // Get timezone for location
    const timezone = await getTimezoneFromCoords(coords);

    // Make all API calls in parallel with point data, with individual error handling

    const [stationsData, forecastData, hourlyData] = await Promise.allSettled([
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

    // Extract results with error handling
    const stationsResult =
      stationsData.status === "fulfilled" ? stationsData.value : null;
    const forecastResult =
      forecastData.status === "fulfilled" ? forecastData.value : null;
    const hourlyResult =
      hourlyData.status === "fulfilled" ? hourlyData.value : null;

    // Log any failures but continue processing
    if (stationsData.status === "rejected") {
      console.warn("⚠️ Stations API failed:", stationsData.reason);
    }
    if (forecastData.status === "rejected") {
      console.warn("⚠️ Forecast API failed:", forecastData.reason);
    }
    if (hourlyData.status === "rejected") {
      console.warn("⚠️ Hourly API failed:", hourlyData.reason);
    }

    // If all APIs failed, return empty data instead of throwing
    if (!stationsResult && !forecastResult && !hourlyResult) {
      console.warn("⚠️ All weather APIs failed, returning empty data");
      return {
        current: null,
        forecast: [],
        hourly: [],
        monthly: {
          month: new Date().getMonth(),
          year: new Date().getFullYear(),
          days: [],
        },
      };
    }

    // Process current conditions
    let current: CurrentConditions | null = null;
    if (
      stationsResult &&
      stationsResult.features &&
      stationsResult.features.length > 0
    ) {
      try {
        const stationId =
          stationsResult.features[0].properties.stationIdentifier;
        const observationUrl = `${BASE_URL}/stations/${stationId}/observations/latest`;
        const observation = await fetchWithUserAgent(observationUrl, {
          ...options,
          skipRateLimit: true, // Skip rate limiting for observations
        });

        const props = observation.properties;

        // Get hourly forecast as fallback for text description if needed
        let textDescription = props.textDescription;
        if (
          !textDescription &&
          hourlyResult &&
          hourlyResult.properties &&
          hourlyResult.properties.periods &&
          hourlyResult.properties.periods.length > 0
        ) {
          textDescription = hourlyResult.properties.periods[0].shortForecast;
        }

        current = {
          temperature: props.temperature.value,
          temperatureUnit:
            props.temperature.unitCode === "wmoUnit:degC" ? "C" : "F",
          relativeHumidity: props.relativeHumidity.value,
          windSpeedValue: (props.windSpeed.value ?? 0) * 0.621371,
          windDirection: props.windDirection.value ?? 0,
          textDescription: textDescription || "Unknown",
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
          timezone: timezone, // Include timezone for time formatting
        };
      } catch (obsError) {
        console.warn("⚠️ Current conditions observation failed:", obsError);
        // Continue without current conditions - we'll still show forecast data
      }
    }

    // Process forecast data with fallbacks
    const forecast =
      forecastResult &&
      forecastResult.properties &&
      forecastResult.properties.periods
        ? forecastResult.properties.periods.slice(0, 14)
        : [];

    const hourly =
      hourlyResult && hourlyResult.properties && hourlyResult.properties.periods
        ? hourlyResult.properties.periods.slice(0, 48)
        : [];

    // Get today's high and low from forecast
    let todayHigh: number | undefined;
    let todayLow: number | undefined;

    if (forecast.length > 0 && current) {
      const now = new Date();
      const currentHour = now.getHours();

      // Find first period (could be Today, This Afternoon, Tonight, etc.)
      const firstPeriod = forecast[0];
      const firstPeriodDate = new Date(firstPeriod.startTime);
      const isToday = firstPeriodDate.getDate() === now.getDate();

      if (isToday && firstPeriod.isDaytime) {
        // It's still daytime today - use forecast high
        todayHigh = firstPeriod.temperature;
      } else if (currentHour >= 6 && currentHour < 20) {
        // It's daytime but forecast starts with tonight - use current temp as high
        // Convert to Fahrenheit if needed
        const currentTempF =
          current.temperatureUnit === "C"
            ? Math.round((current.temperature * 9) / 5 + 32)
            : Math.round(current.temperature);
        todayHigh = currentTempF;
      }

      // For low: if first period is tonight, use that; otherwise look for next nighttime period
      if (isToday && !firstPeriod.isDaytime) {
        todayLow = firstPeriod.temperature;
      } else if (forecast.length > 1 && !forecast[1].isDaytime) {
        todayLow = forecast[1].temperature;
      }
    }

    // Add high/low to current conditions
    if (current) {
      current.todayHigh = todayHigh;
      current.todayLow = todayLow;
    }

    // Add sunrise/sunset to current conditions using API (with error handling)
    if (current && coords) {
      try {
        const { sunrise, sunset } = await getSunriseSunsetFromAPI(coords);
        current.sunriseTime = sunrise;
        current.sunsetTime = sunset;
      } catch (sunError) {
        console.warn("⚠️ Sunrise/sunset calculation failed:", sunError);
        // Continue without sunrise/sunset data
      }
    }

    // Monthly forecast - only load if explicitly requested (for initial Chicago load)
    // Otherwise loaded asynchronously to avoid blocking page load
    const monthly = options.includeMonthly
      ? await getMonthlyForecast(coords, options)
      : null;

    // Get sunrise and sunset from sunrise-sunset.org API
    // Get timezone from coordinates using OpenStreetMap Nominatim
    async function getTimezoneFromCoords(coords: Coordinates): Promise<string> {
      const cacheKey = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;

      if (timezoneCache.has(cacheKey)) {
        return timezoneCache.get(cacheKey)!;
      }

      try {
        const data = await fetchWithUserAgent(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1&zoom=10`,
          { skipRateLimit: true },
        );

        if (data && data.address) {
          // Try to get timezone from address components
          const timezone = data.address.timezone;
          if (timezone) {
            timezoneCache.set(cacheKey, timezone);
            return timezone;
          }
        }
      } catch {
        // Silently handle timezone API errors and fall back to longitude-based detection
      }

      // Fallback to common US timezones based on longitude
      // Note: Longitude is negative in Western hemisphere, so more negative = further west
      // Pacific: < -120°, Mountain: -120° to -105°, Central: -105° to -85°, Eastern: > -85°
      const lng = coords.longitude;
      let fallbackTimezone = "America/New_York";

      if (lng <= -120)
        fallbackTimezone = "America/Los_Angeles"; // Pacific (e.g., LA: -118°, Seattle: -122°)
      else if (lng <= -105 && lng > -120)
        fallbackTimezone = "America/Denver"; // Mountain (e.g., Denver: -105°)
      else if (lng <= -85 && lng > -105)
        fallbackTimezone = "America/Chicago"; // Central (e.g., Chicago: -87.6°)
      else if (lng > -85) fallbackTimezone = "America/New_York"; // Eastern (e.g., NYC: -74°)

      timezoneCache.set(cacheKey, fallbackTimezone);
      return fallbackTimezone;
    }

    async function getSunriseSunsetFromAPI(coords: Coordinates): Promise<{
      sunrise: string;
      sunset: string;
    }> {
      try {
        // Get timezone for accurate local times
        const timezone = await getTimezoneFromCoords(coords);

        // Use the location's local calendar date (not UTC date) to avoid
        // requesting sunrise/sunset for the wrong day near timezone boundaries.
        const dateParts = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(new Date());

        const year = dateParts.find((part) => part.type === "year")?.value;
        const month = dateParts.find((part) => part.type === "month")?.value;
        const day = dateParts.find((part) => part.type === "day")?.value;
        const today =
          year && month && day
            ? `${year}-${month}-${day}`
            : new Date().toISOString().split("T")[0];
        const url = `https://api.sunrise-sunset.org/json?lat=${coords.latitude}&lng=${coords.longitude}&date=${today}&formatted=0&tzid=${timezone}`;

        // fetchWithUserAgent returns parsed JSON data, not a Response object
        const data = await fetchWithUserAgent(url, { skipRateLimit: true });

        if (!data || !data.results) {
          throw new Error(
            `Invalid response format from sunrise-sunset.org API`,
          );
        }

        if (data.status === "OK") {
          // Parse the API response correctly
          const sunriseTime = data.results.sunrise;
          const sunsetTime = data.results.sunset;

          return {
            sunrise: sunriseTime,
            sunset: sunsetTime,
          };
        } else {
          throw new Error(
            `API returned status: ${data.status || "Unknown error"}`,
          );
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

export function clearRequestCache() {
  requestCache.clear();
}

// Check for cache-clearing URL parameter for testing
if (
  typeof window !== "undefined" &&
  window.location.search.includes("clear=cache")
) {
  clearRequestCache();
  // Clean up the URL without page reload
  const url = new URL(window.location.href);
  url.searchParams.delete("clear");
  window.history.replaceState({}, "", url);
}

export function getCacheSize(): number {
  return requestCache.size;
}
