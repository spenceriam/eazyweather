import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface RadarFrame {
  /** Leaflet TileLayer URL template — keeps the literal {z}/{x}/{y} tokens for react-leaflet to substitute. */
  url: string;
  /** Unix seconds. */
  time: number;
  isForecast: boolean;
}

interface RainViewerFrame {
  path?: string;
  time?: number;
}

export interface RainViewerResponse {
  host?: string;
  radar?: {
    past?: RainViewerFrame[];
    nowcast?: RainViewerFrame[];
  };
}

const RAINVIEWER_URL = "https://api.rainviewer.com/public/weather-maps.json";
const PAST_FRAME_COUNT = 7;
const LOOP_INTERVAL_MS = 900;

export function buildFrames(data: RainViewerResponse): RadarFrame[] {
  const host = data.host || "https://tilecache.rainviewer.com";
  const past = Array.isArray(data.radar?.past) ? data.radar!.past! : [];
  const nowcast = Array.isArray(data.radar?.nowcast) ? data.radar!.nowcast! : [];

  const build = (frame: RainViewerFrame, isForecast: boolean): RadarFrame | null => {
    if (!frame.path || typeof frame.time !== "number") return null;
    return {
      url: `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
      time: frame.time,
      isForecast,
    };
  };

  const pastFrames = past
    .slice(-PAST_FRAME_COUNT)
    .map((f) => build(f, false))
    .filter((f): f is RadarFrame => f !== null);

  const nowcastFrames = nowcast
    .map((f) => build(f, true))
    .filter((f): f is RadarFrame => f !== null);

  return [...pastFrames, ...nowcastFrames];
}

export interface UseRadarFramesResult {
  frames: RadarFrame[];
  activeIndex: number;
  activeFrame: RadarFrame | null;
  /** Index of the first forecast frame, or frames.length when there is no nowcast. */
  nowIndex: number;
  hasForecast: boolean;
  ageMinutes: number;
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  scrubTo: (index: number) => void;
  refresh: () => void;
}

/**
 * RainViewer past+nowcast frame list (last 7 observed + all forecast frames)
 * with autoplay/scrub controls. Autoplay is gated on both `autoplay` (the
 * user's radarLoop preference) and the OS prefers-reduced-motion setting.
 *
 * Tile prefetching for the current map viewport is the caller's
 * responsibility (this hook has no knowledge of the Leaflet viewport).
 */
export function useRadarFrames(autoplay: boolean): UseRadarFramesResult {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(RAINVIEWER_URL);
      if (!response.ok) {
        throw new Error(`RainViewer request failed: ${response.status}`);
      }
      const data: RainViewerResponse = await response.json();
      const nextFrames = buildFrames(data);
      if (nextFrames.length === 0) {
        setError("Radar unavailable");
        setFrames([]);
        return;
      }
      setFrames(nextFrames);
      const firstForecastIndex = nextFrames.findIndex((f) => f.isForecast);
      const boundaryIndex = firstForecastIndex === -1 ? nextFrames.length - 1 : firstForecastIndex - 1;
      setActiveIndex(Math.max(0, boundaryIndex));
      setIsPlaying(true);
    } catch (err) {
      console.warn("Radar frame fetch failed:", err);
      setError("Radar unavailable");
      setFrames([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const shouldAutoplay = autoplay && !reducedMotion && frames.length > 1;

  useEffect(() => {
    if (!shouldAutoplay || !isPlaying) return;
    intervalRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % frames.length);
    }, LOOP_INTERVAL_MS);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldAutoplay, isPlaying, frames.length]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const scrubTo = useCallback(
    (index: number) => {
      setIsPlaying(false);
      setActiveIndex(Math.max(0, Math.min(frames.length - 1, index)));
    },
    [frames.length],
  );

  const nowIndex = useMemo(() => {
    const firstForecast = frames.findIndex((f) => f.isForecast);
    return firstForecast === -1 ? frames.length : firstForecast;
  }, [frames]);

  const hasForecast = nowIndex < frames.length;
  const activeFrame = frames[activeIndex] ?? null;

  const ageMinutes = useMemo(() => {
    if (!activeFrame) return 0;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return Math.round((nowSeconds - activeFrame.time) / 60);
  }, [activeFrame]);

  return {
    frames,
    activeIndex,
    activeFrame,
    nowIndex,
    hasForecast,
    ageMinutes,
    isLoading,
    isPlaying: shouldAutoplay && isPlaying,
    error,
    play,
    pause,
    scrubTo,
    refresh: () => void load(),
  };
}
