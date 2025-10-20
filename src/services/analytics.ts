import { track } from "@vercel/analytics";

/**
 * Analytics tracking utilities for EazyWeather
 * Implements privacy-compliant, anonymous event tracking
 */

// Event types for weather-specific interactions
export const AnalyticsEvents = {
  // Location events
  LOCATION_SEARCH: "location_search",
  LOCATION_DETECTED: "location_detected",
  LOCATION_CHANGED: "location_changed",
  LOCATION_ERROR: "location_error",

  // Weather view events
  WEATHER_VIEW: "weather_view",
  FORECAST_VIEW: "forecast_view",
  HOURLY_VIEW: "hourly_view",
  MONTHLY_VIEW: "monthly_view",

  // User interaction events
  REFRESH_WEATHER: "refresh_weather",
  SCROLL_TO_SECTION: "scroll_to_section",

  // Error events
  API_ERROR: "api_error",
  LOAD_ERROR: "load_error",
} as const;

/**
 * Track location search events
 */
export function trackLocationSearch(searchType: "manual" | "browser" | "saved") {
  track(AnalyticsEvents.LOCATION_SEARCH, {
    search_type: searchType,
  });
}

/**
 * Track successful location detection
 */
export function trackLocationDetected(locationType: "browser" | "saved" | "manual") {
  track(AnalyticsEvents.LOCATION_DETECTED, {
    location_type: locationType,
  });
}

/**
 * Track location changes
 */
export function trackLocationChanged(method: "search" | "geolocation" | "saved") {
  track(AnalyticsEvents.LOCATION_CHANGED, {
    change_method: method,
  });
}

/**
 * Track location errors (without exposing user data)
 */
export function trackLocationError(errorType: string) {
  track(AnalyticsEvents.LOCATION_ERROR, {
    error_type: errorType,
  });
}

/**
 * Track weather data views
 */
export function trackWeatherView(viewType: "current" | "hourly" | "daily" | "monthly") {
  track(AnalyticsEvents.WEATHER_VIEW, {
    view_type: viewType,
  });
}

/**
 * Track weather refresh actions
 */
export function trackWeatherRefresh() {
  track(AnalyticsEvents.REFRESH_WEATHER);
}

/**
 * Track API errors (without exposing sensitive data)
 */
export function trackApiError(apiType: "weather" | "location", errorCode?: string) {
  track(AnalyticsEvents.API_ERROR, {
    api_type: apiType,
    error_code: errorCode || "unknown",
  });
}

/**
 * Track general load errors
 */
export function trackLoadError(component: string) {
  track(AnalyticsEvents.LOAD_ERROR, {
    component,
  });
}

/**
 * Track page section views
 */
export function trackSectionView(section: "current" | "hourly" | "forecast" | "monthly") {
  track(AnalyticsEvents.SCROLL_TO_SECTION, {
    section,
  });
}
