import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrefsProvider, usePrefs } from "./usePrefs";

function stubMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function clearAllCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
}

function renderPrefs() {
  return renderHook(() => usePrefs(), { wrapper: PrefsProvider });
}

beforeEach(() => {
  stubMatchMedia();
  localStorage.clear();
  clearAllCookies();
});

describe("usePrefs persistence matrix", () => {
  it("defaults to system theme and unset consent with no prior storage", () => {
    const { result } = renderPrefs();
    expect(result.current.prefs.theme).toBe("system");
    expect(result.current.prefs.consent).toBe("unset");
  });

  it("consent denied: writes to localStorage only, never a cookie", () => {
    const { result } = renderPrefs();

    act(() => {
      result.current.setConsent(false);
      result.current.setTheme("dark");
    });

    expect(result.current.prefs.consent).toBe("denied");
    expect(result.current.prefs.theme).toBe("dark");
    expect(localStorage.getItem("ezw-prefs")).toContain('"theme":"dark"');
    expect(document.cookie).not.toContain("ezw-prefs=");
  });

  it("consent granted: mirrors the prefs blob into a cookie in addition to localStorage", () => {
    const { result } = renderPrefs();

    act(() => {
      result.current.setConsent(true);
      result.current.setTheme("light");
    });

    expect(result.current.prefs.consent).toBe("granted");
    expect(localStorage.getItem("ezw-prefs")).toContain('"theme":"light"');
    expect(document.cookie).toContain("ezw-prefs=");
  });

  it("declining consent after granting erases the cookie but keeps localStorage", () => {
    const { result } = renderPrefs();

    act(() => {
      result.current.setConsent(true);
      result.current.setTimezone("America/New_York");
    });
    expect(document.cookie).toContain("ezw-prefs=");

    act(() => {
      result.current.setConsent(false);
    });

    expect(document.cookie).not.toContain("ezw-prefs=");
    expect(localStorage.getItem("ezw-prefs")).toContain("America/New_York");
  });

  it("a fresh provider instance restores persisted prefs from localStorage", () => {
    const first = renderPrefs();
    act(() => {
      first.result.current.setTheme("dark");
      first.result.current.setTimezone("America/Denver");
    });

    const second = renderPrefs();
    expect(second.result.current.prefs.theme).toBe("dark");
    expect(second.result.current.prefs.timezone).toBe("America/Denver");
  });
});

describe("alert hide/prune", () => {
  it("hideAlert adds an id and is idempotent", () => {
    const { result } = renderPrefs();

    act(() => result.current.hideAlert("alert-1"));
    expect(result.current.prefs.hiddenAlertIds).toEqual(["alert-1"]);

    act(() => result.current.hideAlert("alert-1"));
    expect(result.current.prefs.hiddenAlertIds).toEqual(["alert-1"]);
  });

  it("pruneAlerts drops hidden ids that are no longer active", () => {
    const { result } = renderPrefs();

    act(() => {
      result.current.hideAlert("alert-1");
      result.current.hideAlert("alert-2");
    });
    expect(result.current.prefs.hiddenAlertIds).toEqual(["alert-1", "alert-2"]);

    act(() => result.current.pruneAlerts(["alert-2"]));
    expect(result.current.prefs.hiddenAlertIds).toEqual(["alert-2"]);
  });

  it("pruneAlerts is a no-op when every hidden id is still active", () => {
    const { result } = renderPrefs();

    act(() => result.current.hideAlert("alert-1"));
    act(() => result.current.pruneAlerts(["alert-1", "alert-2"]));

    expect(result.current.prefs.hiddenAlertIds).toEqual(["alert-1"]);
  });
});
