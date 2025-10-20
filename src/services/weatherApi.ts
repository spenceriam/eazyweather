import type {
  Coordinates,
  WeatherPoint,
  CurrentConditions,
  ForecastPeriod,
  HourlyForecast,
  MonthlyForecast,
  MonthlyDay,
} from "../types/weather";

const BASE_URL = "https://api.weather.gov";
const USER_AGENT = "(EazyWeather, eazyweather@example.com)";

async function fetchWithUserAgent(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Weather API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function getWeatherPoint(
  coords: Coordinates,
): Promise<WeatherPoint> {
  const url = `${BASE_URL}/points/${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
  return fetchWithUserAgent(url);
}

export async function getCurrentConditions(
  coords: Coordinates,
): Promise<CurrentConditions | null> {
  try {
    const point = await getWeatherPoint(coords);
    const stationsUrl = point.properties.observationStations;
    const stationsData = await fetchWithUserAgent(stationsUrl);

    if (!stationsData.features || stationsData.features.length === 0) {
      return null;
    }

    const stationId = stationsData.features[0].properties.stationIdentifier;
    const observationUrl = `${BASE_URL}/stations/${stationId}/observations/latest`;
    const observation = await fetchWithUserAgent(observationUrl);

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
): Promise<ForecastPeriod[]> {
  try {
    const point = await getWeatherPoint(coords);
    const forecastUrl = point.properties.forecast;
    const forecastData = await fetchWithUserAgent(forecastUrl);

    return forecastData.properties.periods.slice(0, 14);
  } catch (error) {
    console.error("Error fetching 7-day forecast:", error);
    throw error;
  }
}

export async function getHourlyForecast(
  coords: Coordinates,
): Promise<HourlyForecast[]> {
  try {
    const point = await getWeatherPoint(coords);
    const hourlyUrl = point.properties.forecastHourly;
    const hourlyData = await fetchWithUserAgent(hourlyUrl);

    return hourlyData.properties.periods.slice(0, 48);
  } catch (error) {
    console.error("Error fetching hourly forecast:", error);
    throw error;
  }
}

export async function getMonthlyForecast(
  coords: Coordinates,
): Promise<MonthlyForecast> {
  try {
    const sevenDayForecast = await get7DayForecast(coords);
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
