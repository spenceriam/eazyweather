export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "eazyweather_theme_mode";

export function getThemeStorageKey(): string {
  return THEME_STORAGE_KEY;
}

export function isThemeMode(value: string): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function getInitialThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && isThemeMode(saved)) {
      return saved;
    }
  } catch {
    // Ignore localStorage errors.
  }
  return "system";
}

export function persistThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignore localStorage errors.
  }
}

export function resolveThemeMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getNextThemeMode(currentMode: ThemeMode): ThemeMode {
  if (currentMode === "system") return "light";
  if (currentMode === "light") return "dark";
  return "system";
}
