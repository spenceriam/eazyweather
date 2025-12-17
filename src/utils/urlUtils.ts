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
 *
 * @param pathOverride - Optional string to simulate window.location.pathname (for testing)
 */
export function getPotentialLocationFromUrl(pathOverride?: string): string | null {
  // Use override if provided, otherwise get from window (safe for SSR/Node if window undefined check is added, but this is a client app)
  const pathname = pathOverride !== undefined
    ? pathOverride
    : (typeof window !== 'undefined' ? window.location.pathname : '');

  if (!pathname) return null;

  const decodedPath = decodeURIComponent(pathname);

  // Split path into segments and find the first one that looks like a location code
  const segments = decodedPath.split('/').filter(segment => segment.trim().length > 0);

  for (const segment of segments) {
    const cleanSegment = segment.trim();

    // Heuristics check
    const isPotentialCode =
      cleanSegment.length >= 3 &&
      cleanSegment.length <= 12 &&
      /\d/.test(cleanSegment) &&
      !cleanSegment.includes(".");

    if (isPotentialCode) {
      return cleanSegment;
    }
  }

  return null;
}
