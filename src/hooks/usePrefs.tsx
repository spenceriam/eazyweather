import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  eraseCookie,
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

/**
 * Merges a stored layout with the defaults key-by-key so a future release
 * that adds a new CardId doesn't strand returning users: without this, a
 * stored `order` array from an older version would never include the new
 * card (it could neither render nor be added) and its span/visibility
 * lookups would be undefined.
 */
function normalizeLayout(stored: Partial<CardLayout> | undefined): CardLayout {
  if (!stored) return DEFAULT_CARD_LAYOUT;
  const knownOrder = (stored.order ?? []).filter((id) => DEFAULT_CARD_LAYOUT.order.includes(id));
  const missing = DEFAULT_CARD_LAYOUT.order.filter((id) => !knownOrder.includes(id));
  return {
    order: [...knownOrder, ...missing],
    visible: { ...DEFAULT_CARD_LAYOUT.visible, ...(stored.visible ?? {}) },
    spans: { ...DEFAULT_CARD_LAYOUT.spans, ...(stored.spans ?? {}) },
    columns: stored.columns ?? DEFAULT_CARD_LAYOUT.columns,
    hourlyVariant: stored.hourlyVariant ?? DEFAULT_CARD_LAYOUT.hourlyVariant,
    sevenDayVariant: stored.sevenDayVariant ?? DEFAULT_CARD_LAYOUT.sevenDayVariant,
  };
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
      layout: normalizeLayout(parsed.layout),
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
  // Mirrors `consent` synchronously so a setter that fires in the same tick
  // as setConsent() (before React re-renders) reads the up-to-date value
  // instead of the stale one captured in its closure.
  const consentRef = useRef(consent);
  consentRef.current = consent;

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

  // Every setter goes through this so concurrent calls in the same tick
  // (before React re-renders) always compute from the latest state instead
  // of a stale closure — React's functional setState guarantees `prev` is
  // current even across a batch of several setState calls.
  const persistWith = useCallback((updater: (prev: StoredPrefs) => StoredPrefs) => {
    setStored((prev) => {
      const next = updater(prev);
      if (next === prev) return prev; // updater declined to change anything
      writeStoredPrefs(next, consentRef.current === "granted");
      persistThemeModeLegacy(next.theme);
      persistTimezoneLegacy(next.timezone);
      return next;
    });
  }, []);

  const setTheme = useCallback(
    (mode: ThemeMode) => persistWith((prev) => ({ ...prev, theme: mode })),
    [persistWith],
  );

  const setTimezone = useCallback(
    (tz: string) => persistWith((prev) => ({ ...prev, timezone: tz })),
    [persistWith],
  );

  const setLayout = useCallback(
    (updater: CardLayout | ((prev: CardLayout) => CardLayout)) => {
      persistWith((prev) => ({
        ...prev,
        layout: typeof updater === "function" ? updater(prev.layout) : updater,
      }));
    },
    [persistWith],
  );

  const setRadarLoop = useCallback(
    (enabled: boolean) => persistWith((prev) => ({ ...prev, radarLoop: enabled })),
    [persistWith],
  );

  const hideAlert = useCallback(
    (id: string) => {
      persistWith((prev) =>
        prev.hiddenAlertIds.includes(id)
          ? prev
          : { ...prev, hiddenAlertIds: [...prev.hiddenAlertIds, id] },
      );
    },
    [persistWith],
  );

  const pruneAlerts = useCallback(
    (activeIds: string[]) => {
      persistWith((prev) => {
        const activeSet = new Set(activeIds);
        const pruned = prev.hiddenAlertIds.filter((id) => activeSet.has(id));
        return pruned.length !== prev.hiddenAlertIds.length
          ? { ...prev, hiddenAlertIds: pruned }
          : prev;
      });
    },
    [persistWith],
  );

  const setConsent = useCallback((granted: boolean) => {
    setCookieConsent(granted);
    if (!granted) {
      // Revoking (or declining after a granted period) must clear every
      // cookie previously written under consent, not just the prefs blob —
      // the location cookies otherwise linger for up to 180 days.
      eraseCookie("eazyweather_location");
      eraseCookie("eazyweather_location_history");
      eraseCookie("eazyweather_manual_pin");
    }
    const next: "granted" | "denied" = granted ? "granted" : "denied";
    consentRef.current = next;
    setConsentState(next);
    setStored((prev) => {
      writeStoredPrefs(prev, granted);
      return prev;
    });
  }, []);

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
