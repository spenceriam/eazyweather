const TIMEZONE_STORAGE_KEY = "eazyweather_timezone";
const CENTRAL_TIME_FALLBACK = "America/Chicago";

const COMMON_TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Bogota",
  "America/Santiago",
  "America/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
];

export function getTimezoneStorageKey(): string {
  return TIMEZONE_STORAGE_KEY;
}

export function getCentralFallbackTimezone(): string {
  return CENTRAL_TIME_FALLBACK;
}

export function isValidTimezone(timezone: string): boolean {
  if (!timezone) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function detectDeviceTimezone(): string | null {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimezone(detected) ? detected : null;
  } catch {
    return null;
  }
}

export function getInitialTimezone(): string {
  try {
    const saved = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (saved && isValidTimezone(saved)) {
      return saved;
    }
  } catch {
    // Ignore localStorage errors and continue.
  }

  const detected = detectDeviceTimezone();
  return detected || CENTRAL_TIME_FALLBACK;
}

export function persistTimezone(timezone: string): void {
  try {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  } catch {
    // Ignore localStorage errors.
  }
}

export function getTimezoneOptions(): string[] {
  const fromRuntime =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl.supportedValuesOf("timeZone") as string[])
      : [];

  const merged = new Set<string>([...COMMON_TIMEZONES, ...fromRuntime]);
  return Array.from(merged).sort((a, b) => a.localeCompare(b));
}
