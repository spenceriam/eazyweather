/**
 * EazyWeather - Simple, ad-free weather
 * Copyright (c) 2025 Spencer Francisco
 * Licensed under MIT License
 * Contact: https://x.com/spencer_i_am
 */

import { useCallback, useEffect, useState } from "react";
import { PrefsProvider, usePrefs } from "./hooks/usePrefs";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { AlertsBlock } from "./components/AlertsBlock";
import { Footer } from "./components/Footer";
import { WelcomeCard } from "./components/WelcomeCard";
import { ConsentBanner } from "./components/ConsentBanner";
import { CoverageNotice } from "./components/CoverageNotice";
import { LocationPermissionOverlay } from "./components/LocationPermissionOverlay";
import { PinRefine } from "./components/PinRefine";
import { RadarFullscreen } from "./components/RadarFullscreen";
import { CardGrid } from "./components/cards/CardGrid";
import { CardChrome } from "./components/cards/CardChrome";
import { RadarCard } from "./components/cards/RadarCard";
import { PrivacyModal } from "./components/modals/PrivacyModal";
import { calculateIsDaytime } from "./utils/weatherHelpers";

import { getAllWeatherData, getMonthlyForecast, getActiveAlerts } from "./services/weatherApi";
import {
  reverseGeocode,
  geocodeLocation,
  getBrowserLocation,
  saveLocation,
  getSavedLocation,
  getManualPin,
  saveManualPin,
  getChicagoFallback,
  type LocationResult,
} from "./services/locationService";
import { getCookieConsent } from "./utils/cookieUtils";
import { getPotentialLocationFromUrl } from "./utils/urlUtils";
import { refreshService } from "./services/refreshService";
import type {
  Coordinates,
  CurrentConditions as CurrentConditionsType,
  ForecastPeriod,
  HourlyForecast as HourlyForecastType,
  MonthlyForecast as MonthlyForecastType,
} from "./types/weather";
import type { WeatherAlert } from "./types/alerts";
import type { CardDataBag } from "./types/cardData";

const CHICAGO_COORDS: Coordinates = { latitude: 41.8781, longitude: -87.6298 };
const CHICAGO_NAME = "Chicago, Illinois";

function normalizeTitleLocation(location: string) {
  const normalized = location.trim();
  if (!normalized) return "";
  const lower = normalized.toLowerCase();
  if (lower === "loading..." || lower === "enter your location" || lower === "your location") {
    return "";
  }
  return normalized;
}

function updatePageTitle(location: string) {
  const baseTitle = "EazyWeather";
  const titleLocation = normalizeTitleLocation(location);
  document.title = titleLocation ? `${titleLocation} Weather Forecast | ${baseTitle}` : baseTitle;
}

function updateStructuredData(location: LocationResult, conditions: CurrentConditionsType | null) {
  try {
    const script = document.getElementById("weather-structured-data");
    if (!script) return;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WeatherForecast",
      name: `${location.displayName} Weather Forecast`,
      description: `Current weather conditions and forecast for ${location.displayName}`,
      location: {
        "@type": "Place",
        name: location.displayName,
        address: {
          "@type": "PostalAddress",
          addressLocality: location.city || location.displayName.split(",")[0],
          addressRegion: location.state || location.displayName.split(",")[1]?.trim(),
          addressCountry: location.country || "US",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude,
        },
      },
      forecast: conditions
        ? {
            "@type": "WeatherConditions",
            temperature: {
              "@type": "QuantitativeValue",
              value: conditions.temperature,
              unitCode: conditions.temperatureUnit === "C" ? "C" : "F",
            },
            humidity: {
              "@type": "QuantitativeValue",
              value: conditions.relativeHumidity,
              unitCode: "P1",
            },
            windSpeed: {
              "@type": "QuantitativeValue",
              value: conditions.windSpeedValue || 0,
              unitText: "mph",
            },
            weatherCondition: conditions.textDescription,
          }
        : {},
      dateModified: new Date().toISOString(),
      provider: {
        "@type": "Organization",
        name: "National Weather Service",
        url: "https://weather.gov",
      },
    };

    script.textContent = JSON.stringify(structuredData);
  } catch {
    // Silently handle structured data errors
  }
}

/** True when a geocode result's country is known and isn't the US (NWS coverage). */
function isNonUsLocation(location: LocationResult): boolean {
  return Boolean(location.country) && location.country !== "United States";
}

function AppShell() {
  const { prefs, resolvedTheme, setConsent } = usePrefs();

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState(CHICAGO_NAME);
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWeatherLoaded, setHasWeatherLoaded] = useState(false);
  const [isInitialChicagoLoad, setIsInitialChicagoLoad] = useState(true);

  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [pendingGPSCoordinates, setPendingGPSCoordinates] = useState<Coordinates | null>(null);
  const [showPinRefine, setShowPinRefine] = useState(false);
  const [isRequestingLocationPermission, setIsRequestingLocationPermission] = useState(false);
  const [showRadarFullscreen, setShowRadarFullscreen] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [openLocationPanelSignal, setOpenLocationPanelSignal] = useState<number | undefined>(undefined);

  const [previousUsLocation, setPreviousUsLocation] = useState<LocationResult | null>(null);
  const [coverageNotice, setCoverageNotice] = useState<{ placeName: string } | null>(null);

  const [currentConditions, setCurrentConditions] = useState<CurrentConditionsType | null>(null);
  const [forecast, setForecast] = useState<ForecastPeriod[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastType[]>([]);
  const [monthlyForecast, setMonthlyForecast] = useState<MonthlyForecastType | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  // refreshService's own lastRefreshTime/isRefreshing bookkeeping is only
  // populated by requestManualRefresh(), which this app never calls (it
  // drives loadWeatherData directly) — lastLoadedAt below is the real
  // "when did we last successfully fetch" signal used by the Hero band.
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const loadWeatherData = useCallback(
    async (skipRateLimit = false, coordsOverride?: Coordinates) => {
      const activeCoords = coordsOverride || coordinates;
      if (!activeCoords) return;

      setError(null);

      try {
        const shouldIncludeMonthly = isInitialChicagoLoad && locationName === CHICAGO_NAME;

        const { current, forecast: sevenDay, hourly, monthly } = await getAllWeatherData(activeCoords, {
          skipRateLimit,
          includeMonthly: shouldIncludeMonthly,
        });

        setCurrentConditions(current);
        setForecast(sevenDay);
        setHourlyForecast(hourly);
        if (monthly) setMonthlyForecast(monthly);

        void getActiveAlerts(activeCoords).then(setAlerts);

        const hasData = current || sevenDay.length > 0 || hourly.length > 0;
        if (!hasData) {
          setError("Weather data unavailable for this location. Try searching for a nearby city.");
        } else {
          setError(null);
          setLastLoadedAt(Date.now());
          if (current) {
            const parts = locationName.split(",");
            updateStructuredData(
              {
                coordinates: activeCoords,
                displayName: locationName,
                city: parts[0]?.trim() || "",
                state: parts[1]?.trim() || "",
                country: parts.length > 2 ? parts[2]?.trim() : "US",
              },
              current,
            );
          }
          setHasWeatherLoaded(true);
        }
      } catch {
        setError("Weather data unavailable for this location. Try searching for a nearby city.");
      }
    },
    [coordinates, locationName, isInitialChicagoLoad],
  );

  // Track when the user changes location from the initial Chicago default.
  useEffect(() => {
    if (locationName !== CHICAGO_NAME && isInitialChicagoLoad) {
      setIsInitialChicagoLoad(false);
    }
  }, [locationName, isInitialChicagoLoad]);

  // Async monthly load for every location change after the initial Chicago load.
  useEffect(() => {
    if (!coordinates || !hasWeatherLoaded) return;
    if (isInitialChicagoLoad && locationName === CHICAGO_NAME) return;

    let cancelled = false;
    (async () => {
      try {
        const monthly = await getMonthlyForecast(coordinates);
        if (!cancelled) setMonthlyForecast(monthly);
      } catch {
        // MonthlyCard already renders its own "unavailable" state when
        // monthlyForecast is null — nothing else to surface here.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coordinates, hasWeatherLoaded, isInitialChicagoLoad, locationName]);

  // Auto-refresh plumbing (unchanged from the pre-refresh app).
  useEffect(() => {
    const unsubscribe = refreshService.addListener(() => {
      const state = refreshService.getState();
      if (
        document.visibilityState === "visible" &&
        refreshService.isDataStale() &&
        !state.isRefreshing &&
        coordinates
      ) {
        loadWeatherData(true);
      }
    });

    if (coordinates && locationName !== CHICAGO_NAME) {
      refreshService.startAutoRefresh();
    }

    const intervalId = setInterval(() => {
      if (
        refreshService.getState().nextAutoRefreshTime &&
        Date.now() >= refreshService.getState().nextAutoRefreshTime! &&
        refreshService.shouldAutoRefresh()
      ) {
        if (coordinates) loadWeatherData(true);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
      refreshService.destroy();
    };
  }, [coordinates, locationName, loadWeatherData]);

  /** Central entry point for every "the user/app picked a location" path. Gates on NWS (US) coverage. */
  const applyLocation = useCallback(
    (location: LocationResult, options: { persist?: boolean } = {}) => {
      const { persist = true } = options;

      setCoordinates(location.coordinates);
      setLocationName(location.displayName);
      setIsPinned(false);
      updatePageTitle(location.displayName);
      if (persist) saveLocation(location);

      if (isNonUsLocation(location)) {
        setCoverageNotice({ placeName: location.displayName });
        setCurrentConditions(null);
        setForecast([]);
        setHourlyForecast([]);
        setAlerts([]);
        return;
      }

      setCoverageNotice(null);
      setPreviousUsLocation(location);
      void loadWeatherData(true, location.coordinates);
    },
    [loadWeatherData],
  );

  const initializeLocation = useCallback(async () => {
    setError(null);

    const potentialLocationCode = getPotentialLocationFromUrl();
    if (potentialLocationCode) {
      try {
        const locationResult = await geocodeLocation(potentialLocationCode);
        let finalDisplayName = locationResult.displayName;
        if (finalDisplayName === potentialLocationCode) {
          if (locationResult.city && locationResult.state) {
            finalDisplayName = `${locationResult.city}, ${locationResult.state}`;
          } else if (locationResult.city && locationResult.country) {
            finalDisplayName = `${locationResult.city}, ${locationResult.country}`;
          }
        }
        // Deliberately not persisted: a URL location is temporary for this view only.
        applyLocation({ ...locationResult, displayName: finalDisplayName }, { persist: false });
        return;
      } catch {
        // Fall through to normal initialization.
      }
    }

    const manualPin = getManualPin();
    if (manualPin) {
      setIsPinned(true);
      applyLocation(manualPin, { persist: false });
      return;
    }

    const saved = getSavedLocation();
    if (saved) {
      if (saved.displayName === "Your Location" || saved.displayName.includes(",")) {
        try {
          const locationResult = await reverseGeocode(saved.coordinates);
          applyLocation(locationResult);
          return;
        } catch {
          applyLocation(saved, { persist: false });
          return;
        }
      }
      applyLocation(saved, { persist: false });
      return;
    }

    // No saved/pinned/URL location: default to Chicago, load silently, and
    // surface the welcome card — never a blank screen.
    setCoordinates(CHICAGO_COORDS);
    setLocationName(CHICAGO_NAME);
    updatePageTitle(CHICAGO_NAME);
    setPreviousUsLocation(getChicagoFallback());
    setShowWelcomeCard(true);
  }, [applyLocation]);

  // First-run: consent banner shows independently of the welcome card, and
  // neither blocks initializeLocation — Chicago (or a saved/pinned/URL
  // location) loads immediately regardless of consent state.
  useEffect(() => {
    const potentialLocationUrl = getPotentialLocationFromUrl();
    if (!potentialLocationUrl && getCookieConsent() === null) {
      setShowConsentBanner(true);
    }
    initializeLocation();
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (coordinates && !coverageNotice) {
      loadWeatherData();
    }
    // Only (re)fetch when coordinates or coverage-gating actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates, coverageNotice]);

  function handleAcceptConsent() {
    setConsent(true);
    setShowConsentBanner(false);
  }

  function handleDeclineConsent() {
    setConsent(false);
    setShowConsentBanner(false);
  }

  async function handleLocationSelect(location: LocationResult) {
    applyLocation(location);
    setShowWelcomeCard(false);
  }

  async function handleRequestGps() {
    setShowWelcomeCard(false);
    setIsRequestingLocationPermission(true);
    try {
      const coords = await getBrowserLocation();
      setPendingGPSCoordinates(coords);
      setShowPinRefine(true);
    } catch {
      const chicago = getChicagoFallback();
      applyLocation(chicago, { persist: false });
    } finally {
      setIsRequestingLocationPermission(false);
    }
  }

  async function handlePinConfirm(coords: Coordinates, displayName: string) {
    let locationResult: LocationResult;
    try {
      locationResult = await reverseGeocode(coords);
    } catch {
      locationResult = { coordinates: coords, displayName, city: "", state: "", country: "" };
    }

    saveManualPin(locationResult);
    setIsPinned(true);
    applyLocation(locationResult);
    setShowPinRefine(false);
    setPendingGPSCoordinates(null);
  }

  function handleCoverageBack() {
    setCoverageNotice(null);
    if (previousUsLocation) {
      applyLocation(previousUsLocation, { persist: false });
    }
  }

  function handleCoverageChooseUs() {
    setOpenLocationPanelSignal((prev) => (prev ?? 0) + 1);
  }

  const isDaytime = currentConditions
    ? calculateIsDaytime(currentConditions, prefs.timezone)
    : true;

  const cardData: CardDataBag = {
    currentConditions,
    forecast,
    hourlyForecast,
    monthlyForecast,
    timezone: prefs.timezone,
    coordinates,
    alerts,
    onExpandRadar: () => setShowRadarFullscreen(true),
  };

  const lastUpdatedMinutesAgo = lastLoadedAt
    ? Math.max(0, Math.round((Date.now() - lastLoadedAt) / 60000))
    : null;

  return (
    <div className="min-h-screen bg-bg">
      <Header
        locationName={locationName}
        isPinned={isPinned}
        onLocationSelect={handleLocationSelect}
        onRequestGps={handleRequestGps}
        onEnterEditMode={() => setIsEditingLayout(true)}
        openLocationPanelSignal={openLocationPanelSignal}
      />

      <main>
        <h1 className="sr-only">
          {locationName} weather forecast, radar, and severe weather alerts
        </h1>

        <div id="current">
          <Hero
            currentConditions={currentConditions}
            isDaytime={isDaytime}
            locationName={locationName}
            onRefresh={() => loadWeatherData(true)}
            lastUpdatedMinutesAgo={lastUpdatedMinutesAgo}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {error && !coverageNotice && (
            <div className="flex items-center justify-between gap-3 border border-warnbrd bg-warnbg rounded-card px-4 py-3">
              <span className="text-sm text-warnink">{error}</span>
              <button
                type="button"
                onClick={() => loadWeatherData(true)}
                className="text-sm font-semibold text-warnink hover:underline shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {alerts.length > 0 && <AlertsBlock alerts={alerts} />}

          {coverageNotice ? (
            <>
              <CoverageNotice
                placeName={coverageNotice.placeName}
                previousLocationName={previousUsLocation?.displayName ?? null}
                onBack={handleCoverageBack}
                onChooseUs={handleCoverageChooseUs}
              />
              {/* Forecast cards pause (no NWS calls for non-US points), but radar has
                  no US-only dependency — it stays live per F13. */}
              <CardChrome label="Radar" span={1}>
                <RadarCard data={cardData} />
              </CardChrome>
            </>
          ) : (
            <CardGrid data={cardData} editing={isEditingLayout} onDoneEditing={() => setIsEditingLayout(false)} />
          )}
        </div>
      </main>

      <Footer />

      {showWelcomeCard && (
        <WelcomeCard
          onLocationSelect={handleLocationSelect}
          onRequestGps={handleRequestGps}
          onSkip={() => setShowWelcomeCard(false)}
        />
      )}

      {showConsentBanner && (
        <ConsentBanner
          onAccept={handleAcceptConsent}
          onDecline={handleDeclineConsent}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
        />
      )}

      {isRequestingLocationPermission && <LocationPermissionOverlay />}

      {showPinRefine && pendingGPSCoordinates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-surface border border-line rounded-card shadow-card p-4 space-y-4">
            <PinRefine
              initialCoordinates={pendingGPSCoordinates}
              onConfirm={handlePinConfirm}
              onCancel={() => {
                setShowPinRefine(false);
                setPendingGPSCoordinates(null);
              }}
            />
          </div>
        </div>
      )}

      {showRadarFullscreen && (
        <RadarFullscreen
          isOpen={showRadarFullscreen}
          onClose={() => setShowRadarFullscreen(false)}
          coordinates={coordinates}
          timezone={prefs.timezone}
        />
      )}

      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      {/* Keeps html.dark in sync for any remaining Tailwind dark: utilities during the transition. */}
      <span className="hidden" data-resolved-theme={resolvedTheme} />
    </div>
  );
}

function App() {
  return (
    <PrefsProvider>
      <AppShell />
    </PrefsProvider>
  );
}

export default App;
