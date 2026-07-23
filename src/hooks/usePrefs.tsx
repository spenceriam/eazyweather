import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCookieConsent,
  readPrefsBlob,
  setCookieConsent,
  writePrefsBlob,
} from "../utils/cookieUtils";
import {
  getInitialTimezone,
  persistTimezone as persistTimezoneLegacy,
} from "../utils/timezoneUtils";
import {
  getInitialThemeMode,
  persistThemeMode as persistThemeModeLegacy,
  resolveThemeMode,
} from "../utils/themeUtils";
import {
  DEFAULT_CARD_LAYOUT,
  type CardLayout,
  type Prefs,
  type ThemeMode,
} from "../types/prefs";

const PREFS_KEY = "ezw-prefs";
const PREFS_VERSION = 1;

interface StoredPrefs {
  v: number;
  theme: ThemeMode;
  timezone: string;
  layout: CardLayout;
  radarLoop: boolean;
  hiddenAlertIds: string[];
}

function readStoredPrefs(): StoredPrefs | null {
  try {
    const raw = readPrefsBlob(PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    if (!parsed || parsed.v !== PREFS_VERSION) return null;
    return {
      v: PREFS_VERSION,
      theme: parsed.theme ?? "system",
      timezone: parsed.timezone ?? getInitialTimezone(),
      layout: parsed.layout ?? DEFAULT_CARD_LAYOUT,
      radarLoop: parsed.radarLoop ?? true,
      hiddenAlertIds: parsed.hiddenAlertIds ?? [],
    };
  } catch {
    return null;
  }
}

/** One-time seed from the pre-refresh legacy storage keys so returning users keep their settings. */
function seedFromLegacy(): StoredPrefs {
  return {
    v: PREFS_VERSION,
    theme: getInitialThemeMode(),
    timezone: getInitialTimezone(),
    layout: DEFAULT_CARD_LAYOUT,
    radarLoop: true,
    hiddenAlertIds: [],
  };
}

function writeStoredPrefs(data: StoredPrefs, consentGranted: boolean): void {
  writePrefsBlob(PREFS_KEY, JSON.stringify(data), consentGranted);
}

function applyThemeToDocument(resolved: "light" | "dark"): void {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;
  document.body.dataset.theme = resolved;
}

interface PrefsContextValue {
  prefs: Prefs;
  resolvedTheme: "light" | "dark";
  setTheme: (mode: ThemeMode) => void;
  setTimezone: (tz: string) => void;
  setConsent: (granted: boolean) => void;
  setLayout: (updater: CardLayout | ((prev: CardLayout) => CardLayout)) => void;
  setRadarLoop: (enabled: boolean) => void;
  hideAlert: (id: string) => void;
  pruneAlerts: (activeIds: string[]) => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredPrefs>(
    () => readStoredPrefs() ?? seedFromLegacy(),
  );
  const [consent, setConsentState] = useState<"granted" | "denied" | "unset">(
    () => getCookieConsent() ?? "unset",
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    resolveThemeMode(stored.theme),
  );

  useEffect(() => {
    const apply = () => {
      const resolved = resolveThemeMode(stored.theme);
      applyThemeToDocument(resolved);
      setResolvedTheme(resolved);
    };
    apply();

    if (stored.theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, [stored.theme]);

  const persist = useCallback(
    (next: StoredPrefs) => {
      setStored(next);
      writeStoredPrefs(next, consent === "granted");
      // Keep legacy keys in sync in case any not-yet-migrated code path reads them.
      persistThemeModeLegacy(next.theme);
      persistTimezoneLegacy(next.timezone);
    },
    [consent],
  );

  const setTheme = useCallback(
    (mode: ThemeMode) => persist({ ...stored, theme: mode }),
    [stored, persist],
  );

  const setTimezone = useCallback(
    (tz: string) => persist({ ...stored, timezone: tz }),
    [stored, persist],
  );

  const setLayout = useCallback(
    (updater: CardLayout | ((prev: CardLayout) => CardLayout)) => {
      const nextLayout =
        typeof updater === "function" ? updater(stored.layout) : updater;
      persist({ ...stored, layout: nextLayout });
    },
    [stored, persist],
  );

  const setRadarLoop = useCallback(
    (enabled: boolean) => persist({ ...stored, radarLoop: enabled }),
    [stored, persist],
  );

  const hideAlert = useCallback(
    (id: string) => {
      if (stored.hiddenAlertIds.includes(id)) return;
      persist({ ...stored, hiddenAlertIds: [...stored.hiddenAlertIds, id] });
    },
    [stored, persist],
  );

  const pruneAlerts = useCallback(
    (activeIds: string[]) => {
      const activeSet = new Set(activeIds);
      const pruned = stored.hiddenAlertIds.filter((id) => activeSet.has(id));
      if (pruned.length !== stored.hiddenAlertIds.length) {
        persist({ ...stored, hiddenAlertIds: pruned });
      }
    },
    [stored, persist],
  );

  const setConsent = useCallback(
    (granted: boolean) => {
      setCookieConsent(granted);
      const next: "granted" | "denied" = granted ? "granted" : "denied";
      setConsentState(next);
      writeStoredPrefs(stored, granted);
    },
    [stored],
  );

  const prefs: Prefs = useMemo(
    () => ({
      theme: stored.theme,
      timezone: stored.timezone,
      consent,
      layout: stored.layout,
      radarLoop: stored.radarLoop,
      hiddenAlertIds: stored.hiddenAlertIds,
    }),
    [stored, consent],
  );

  const value = useMemo<PrefsContextValue>(
    () => ({
      prefs,
      resolvedTheme,
      setTheme,
      setTimezone,
      setConsent,
      setLayout,
      setRadarLoop,
      hideAlert,
      pruneAlerts,
    }),
    [
      prefs,
      resolvedTheme,
      setTheme,
      setTimezone,
      setConsent,
      setLayout,
      setRadarLoop,
      hideAlert,
      pruneAlerts,
    ],
  );

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) {
    throw new Error("usePrefs must be used within a PrefsProvider");
  }
  return ctx;
}
