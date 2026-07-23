import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { Icon, type Map as LeafletMap } from "leaflet";
import { useIsDarkTheme } from "../../hooks/useIsDarkTheme";
import { useRadarFrames } from "../../hooks/useRadarFrames";
import { usePrefs } from "../../hooks/usePrefs";
import type { CardBodyProps } from "./registry";

const DEFAULT_COORDS = { latitude: 41.8781, longitude: -87.6298 };

const CARTO_ATTRIBUTION = "&copy; OpenStreetMap &copy; CARTO &middot; Radar &copy; RainViewer";

export function RadarCard({ data }: CardBodyProps) {
  const { prefs } = usePrefs();
  const radar = useRadarFrames(prefs.radarLoop);
  const isDark = useIsDarkTheme();

  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const isScrubbingRef = useRef(false);

  const coords = data.coordinates ?? DEFAULT_COORDS;
  const timezone = data.timezone;

  const basemapUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
  const radarOpacity = isDark ? 0.66 : 0.58;

  const markerColor = isDark ? "#7fb2d9" : "#3e718f";
  const locationIcon = useMemo(
    () =>
      new Icon({
        iconUrl:
          "data:image/svg+xml;base64," +
          btoa(
            `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="${markerColor}" opacity="0.18"/>
              <circle cx="12" cy="12" r="5" fill="${markerColor}"/>
              <circle cx="12" cy="12" r="2" fill="#ffffff"/>
            </svg>`,
          ),
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [markerColor],
  );

  // Re-measure the map after mount and whenever the dashboard's column/span
  // controls resize this card — Leaflet caches its container size and won't
  // notice a layout-only resize on its own.
  useEffect(() => {
    if (!mapRef) return;
    mapRef.invalidateSize();
  }, [mapRef]);

  useEffect(() => {
    const el = mapWrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      mapRef?.invalidateSize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [mapRef]);

  const formatTime = useCallback(
    (unixSeconds: number) => {
      const date = new Date(unixSeconds * 1000);
      try {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: timezone,
        });
      } catch {
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      }
    },
    [timezone],
  );

  // Timeline geometry (design: rdTimeline).
  const frames = radar.frames;
  const frameCount = frames.length;
  const maxIndex = Math.max(1, frameCount - 1);
  const pastCount = useMemo(() => frames.filter((f) => !f.isForecast).length, [frames]);
  const hasForecast = radar.hasForecast;
  const nowPercent = ((Math.max(1, pastCount) - 1) / maxIndex) * 100;
  const thumbPercent = (radar.activeIndex / maxIndex) * 100;

  const observedTint = isDark ? "rgba(127,178,217,.3)" : "rgba(62,113,143,.24)";
  const forecastHatchColor = isDark ? "rgba(127,178,217,.35)" : "rgba(74,123,166,.28)";

  // Frame chip (design: rdFrameChip). "NOW" is the newest observed frame.
  const currentFrame = radar.activeFrame;
  const isNowFrame = radar.activeIndex === pastCount - 1;
  const chipKind = isNowFrame ? "NOW" : currentFrame?.isForecast ? "FORECAST" : "PAST";
  const chipColor = isNowFrame ? "#2E8547" : currentFrame?.isForecast ? "var(--link)" : "var(--mut)";

  // Scrubbing: pointer position -> frame index; scrubTo also stops the loop.
  const scrubToPointer = useCallback(
    (clientX: number) => {
      const el = timelineRef.current;
      if (!el || frames.length === 0) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      radar.scrubTo(Math.round(fraction * (frames.length - 1)));
    },
    [frames.length, radar],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      isScrubbingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      scrubToPointer(event.clientX);
      event.preventDefault();
    },
    [scrubToPointer],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbingRef.current) return;
      scrubToPointer(event.clientX);
    },
    [scrubToPointer],
  );

  const handlePointerEnd = useCallback(() => {
    isScrubbingRef.current = false;
  }, []);

  const handleTimelineKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        radar.scrubTo(radar.activeIndex - 1);
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        radar.scrubTo(radar.activeIndex + 1);
        event.preventDefault();
      }
    },
    [radar],
  );

  return (
    <>
      {/* Header: serif title + age / LIVE note (design lines 357-360). */}
      <div className="flex items-center justify-between px-0.5">
        <span className="font-serif text-base font-semibold text-ink2">Radar</span>
        <span className="flex items-center gap-2">
          <span className="text-[11px] text-mut">
            {frameCount > 0 ? `Updated ${radar.ageMinutes} min ago` : "Radar frames load here"}
          </span>
          {frameCount > 0 && <span className="text-[11px] font-bold text-link">LIVE</span>}
        </span>
      </div>

      {/* Map: 2:1 aspect ratio, radius 2px (design: radarMap 800x400). `isolate`
          keeps Leaflet's internal z-indexes from escaping over the app chrome. */}
      <div
        ref={mapWrapperRef}
        className="relative w-full overflow-hidden rounded-[2px] isolate"
        style={{ aspectRatio: "2 / 1" }}
      >
        <MapContainer
          ref={setMapRef}
          center={[coords.latitude, coords.longitude]}
          zoom={7}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          scrollWheelZoom={false}
          zoomControl={false}
        >
          <TileLayer attribution={CARTO_ATTRIBUTION} url={basemapUrl} />
          {radar.activeFrame && (
            <TileLayer
              key={radar.activeFrame.url}
              url={radar.activeFrame.url}
              opacity={radarOpacity}
            />
          )}
          <Marker position={[coords.latitude, coords.longitude]} icon={locationIcon} />
        </MapContainer>
      </div>

      {radar.error && (
        <div className="flex items-center justify-between gap-2 text-xs text-mut bg-chip border border-line rounded-control px-2.5 py-1.5">
          <span>Radar unavailable</span>
          <button
            type="button"
            onClick={radar.refresh}
            className="font-semibold text-link hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls: play/pause + timeline + frame chip (design lines 364-368). */}
      <div className="flex items-center gap-2.5 px-0.5">
        <button
          type="button"
          onClick={() => (radar.isPlaying ? radar.pause() : radar.play())}
          aria-label="Play or pause radar"
          className="flex h-[30px] w-[30px] flex-none cursor-pointer items-center justify-center border-0 rounded-[2px] bg-brand text-brandink"
        >
          {radar.isPlaying ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4.5" width="4.2" height="15" rx="1.5" />
              <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.5" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7 4.5 19 12 7 19.5Z" />
            </svg>
          )}
        </button>

        <div
          ref={timelineRef}
          role="slider"
          tabIndex={0}
          aria-label="Radar timeline"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, frameCount - 1)}
          aria-valuenow={radar.activeIndex}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={handleTimelineKeyDown}
          className="relative mx-1 h-[38px] flex-1 cursor-pointer select-none"
          style={{ touchAction: "none" }}
        >
          {/* Track: observed tint up to NOW, hatched forecast after, progress fill to thumb. */}
          <div
            className="absolute left-0 right-0 overflow-hidden"
            style={{ top: 11, height: 8, borderRadius: 2, background: "var(--barbg)" }}
          >
            <div
              className="absolute top-0 bottom-0 left-0"
              style={{ width: `${nowPercent}%`, background: observedTint }}
            />
            {hasForecast && (
              <div
                className="absolute top-0 bottom-0 right-0"
                style={{
                  left: `${nowPercent}%`,
                  background: `repeating-linear-gradient(135deg,${forecastHatchColor} 0 4px,transparent 4px 8px)`,
                }}
              />
            )}
            <div
              className="absolute top-0 bottom-0 left-0"
              style={{ width: `${thumbPercent}%`, background: "var(--link)", opacity: 0.85 }}
            />
          </div>

          {/* NOW divider + label (always shown). */}
          <div
            className="absolute"
            style={{
              left: `${nowPercent}%`,
              top: 7,
              width: 2,
              height: 16,
              background: "var(--ink2)",
              transform: "translateX(-50%)",
              borderRadius: 1,
            }}
          />
          <div
            className="absolute"
            style={{
              left: `${nowPercent}%`,
              top: 25,
              transform: "translateX(-50%)",
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: ".08em",
              color: "var(--ink2)",
            }}
          >
            NOW
          </div>

          {/* Start / end time labels. */}
          {frameCount > 0 && (
            <div
              className="absolute left-0"
              style={{
                top: 25,
                fontSize: 8,
                fontWeight: 650,
                letterSpacing: ".06em",
                color: "var(--mut)",
              }}
            >
              {formatTime(frames[0].time)}
            </div>
          )}
          {hasForecast && (
            <div
              className="absolute right-0"
              style={{
                top: 25,
                fontSize: 8,
                fontWeight: 650,
                letterSpacing: ".06em",
                color: "var(--mut)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(frames[frameCount - 1].time)}
            </div>
          )}

          {/* Thumb. */}
          <div
            className="absolute"
            style={{
              left: `${thumbPercent}%`,
              top: 15,
              width: 17,
              height: 17,
              borderRadius: 99,
              background: "var(--surface)",
              border: "3px solid var(--link)",
              transform: "translate(-50%,-50%)",
              boxShadow: "0 1px 4px rgba(0,0,0,.3)",
              pointerEvents: "none",
            }}
          />
        </div>

        {currentFrame && (
          <span className="inline-flex w-16 flex-none flex-col items-end gap-[2px]">
            <span
              className="text-xs font-bold text-ink2 leading-none"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatTime(currentFrame.time)}
            </span>
            <span
              className="leading-none"
              style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".08em", color: chipColor }}
            >
              {chipKind}
            </span>
          </span>
        )}
      </div>
    </>
  );
}
