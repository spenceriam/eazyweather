/**
 * Cookie utilities for EazyWeather
 * Handles setting, getting, and erasing cookies, as well as managing consent state.
 */

const CONSENT_COOKIE_NAME = "eazyweather_consent";
const CONSENT_DENIED_LS_KEY = "eazyweather_consent_denied";

/**
 * Sets a cookie with the given name, value, and expiration in days.
 */
export function setCookie(name: string, value: string, days: number): void {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
}

/**
 * Gets a cookie value by name. Returns null if not found.
 */
export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Erases a cookie by name.
 */
export function eraseCookie(name: string): void {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

/**
 * Checks the current cookie consent status.
 * @returns 'granted' if consent cookie exists, 'denied' if denial is stored in LS, or null if unknown.
 */
export function getCookieConsent(): "granted" | "denied" | null {
  // Check for consent cookie first (primary source of truth for 'granted')
  if (getCookie(CONSENT_COOKIE_NAME) === "true") {
    return "granted";
  }

  // Check for local storage denial
  try {
    if (localStorage.getItem(CONSENT_DENIED_LS_KEY) === "true") {
      return "denied";
    }
  } catch {
    // Ignore LS access errors
  }

  return null;
}

/**
 * Sets the cookie consent status.
 * @param granted - Whether the user granted consent.
 */
export function setCookieConsent(granted: boolean): void {
  if (granted) {
    // Set consent cookie for 180 days (6 months)
    setCookie(CONSENT_COOKIE_NAME, "true", 180);
    // Clear any denial flag in LS
    try {
      localStorage.removeItem(CONSENT_DENIED_LS_KEY);
    } catch {
      // Ignore LS errors
    }
  } else {
    // Remove consent cookie if it exists
    eraseCookie(CONSENT_COOKIE_NAME);
    // Set denial flag in LS
    try {
      localStorage.setItem(CONSENT_DENIED_LS_KEY, "true");
    } catch {
      // Ignore LS errors
    }
  }
}
