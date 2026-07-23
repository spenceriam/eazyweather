import { useEffect, useState } from "react";

/**
 * Tracks the app's live theme via the `dark` class on <html> so
 * theme-aware presentational pieces (icons, precip glyphs) stay in sync
 * without requiring PrefsProvider as an ancestor — both the pre-paint
 * script and PrefsProvider keep that class current.
 */
export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(target.classList.contains("dark"));
    });
    observer.observe(target, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
