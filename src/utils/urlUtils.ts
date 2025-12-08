/**
 * URL utilities for EazyWeather
 */

/**
 * Extracts a potential location code (ZIP or postal code) from the URL path.
 * Returns the cleaned path if it matches the heuristics, or null if not.
 *
 * Heuristics:
 * - Length between 3 and 12 characters
 * - Contains at least one digit (to avoid generic pages like /about)
 * - Contains no dots (to avoid file extensions like .html, .js)
 */
export function getPotentialLocationFromUrl(): string | null {
  const rawPath = window.location.pathname.substring(1);
  // Remove trailing slash if present
  const cleanPath = rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;
  const path = decodeURIComponent(cleanPath).trim();

  const isPotentialCode =
    path.length >= 3 &&
    path.length <= 12 &&
    /\d/.test(path) &&
    !path.includes(".");

  return isPotentialCode ? path : null;
}
