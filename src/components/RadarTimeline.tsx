import { Pause, Play } from "lucide-react";
import { useIsDarkTheme } from "../hooks/useIsDarkTheme";
import type { RadarFrame } from "../hooks/useRadarFrames";

interface RadarTimelineProps {
  frames: RadarFrame[];
  activeIndex: number;
  nowIndex: number;
  hasForecast: boolean;
  ageMinutes: number;
  isPlaying: boolean;
  onScrub: (index: number) => void;
  onTogglePlay: () => void;
  /** IANA timezone used to format frame timestamps; defaults to the browser's local zone. */
  timezone?: string;
}

type FrameBadge = "PAST" | "NOW" | "FORECAST";

function formatFrameTime(unixSeconds: number, timezone?: string): string {
  const date = new Date(unixSeconds * 1000);
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  if (timezone) options.timeZone = timezone;
  return date.toLocaleTimeString([], options);
}

/**
 * Shared scrub timeline used by both RadarCard (inline dashboard card) and
 * RadarFullscreen (expanded view). Purely presentational/controlled — all
 * state (active frame, play/pause) lives in useRadarFrames upstream.
 */
export function RadarTimeline({
  frames,
  activeIndex,
  nowIndex,
  hasForecast,
  ageMinutes,
  isPlaying,
  onScrub,
  onTogglePlay,
  timezone,
}: RadarTimelineProps) {
  const isDark = useIsDarkTheme();

  if (frames.length === 0) {
    return <div className="py-6 text-center text-sm text-mut">Radar unavailable</div>;
  }

  const observedTint = isDark ? "rgba(127,178,217,.3)" : "rgba(62,113,143,.24)";
  const forecastHatch = isDark
    ? "repeating-linear-gradient(135deg, rgba(127,178,217,.35) 0 4px, transparent 4px 8px)"
    : "repeating-linear-gradient(135deg, rgba(74,123,166,.28) 0 4px, transparent 4px 8px)";

  // Frame index -> horizontal position uses the same 0..1 fraction the native
  // range input's thumb travels across (index / (frameCount - 1)), so the
  // segment boundary, progress fill, and thumb all line up on one scale.
  const denom = Math.max(1, frames.length - 1);
  const nowPct = hasForecast ? Math.min(100, (nowIndex / denom) * 100) : 100;
  const progressPct = Math.min(100, Math.max(0, (activeIndex / denom) * 100));

  const activeFrame = frames[activeIndex] ?? frames[frames.length - 1];

  let badge: FrameBadge;
  if (activeIndex < nowIndex - 1) {
    badge = "PAST";
  } else if (hasForecast && activeIndex >= nowIndex) {
    badge = "FORECAST";
  } else {
    // Covers activeIndex === nowIndex - 1, and (when !hasForecast) the final
    // observed frame, i.e. frames[frames.length - 1].
    badge = "NOW";
  }
  const badgeColor = badge === "PAST" ? "var(--mut)" : badge === "FORECAST" ? "var(--link)" : "#2E8547";

  const startLabel = formatFrameTime(frames[0].time, timezone);
  const endLabel = hasForecast ? formatFrameTime(frames[frames.length - 1].time, timezone) : "NOW";
  const activeLabel = formatFrameTime(activeFrame.time, timezone);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="relative pt-3">
            {hasForecast && (
              <span
                className="absolute top-0 text-[8px] font-extrabold uppercase tracking-wide select-none"
                style={{ left: `${nowPct}%`, transform: "translateX(-50%)", color: "var(--ink2)" }}
              >
                NOW
              </span>
            )}

            <div className="relative h-2">
              <div className="absolute inset-0 rounded-full overflow-hidden flex">
                <div className="h-full" style={{ width: `${nowPct}%`, backgroundColor: observedTint }} />
                {hasForecast && (
                  <div
                    className="h-full"
                    style={{ width: `${100 - nowPct}%`, backgroundImage: forecastHatch }}
                  />
                )}
              </div>

              <div
                className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
                style={{ width: `${progressPct}%`, backgroundColor: "var(--link)", opacity: 0.85 }}
              />

              {hasForecast && (
                <div
                  className="absolute -top-1.5 -bottom-1.5 w-[2px]"
                  style={{ left: `${nowPct}%`, transform: "translateX(-50%)", backgroundColor: "var(--ink2)" }}
                />
              )}

              <input
                type="range"
                min={0}
                max={frames.length - 1}
                value={activeIndex}
                disabled={frames.length <= 1}
                onChange={(event) => onScrub(Number(event.target.value))}
                aria-label="Radar timeline"
                className="absolute inset-0 w-full h-full m-0 appearance-none bg-transparent cursor-pointer disabled:cursor-default
                  [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-2
                  [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:h-2
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[17px] [&::-webkit-slider-thumb]:h-[17px]
                  [&::-webkit-slider-thumb]:mt-[-4.5px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--link)] [&::-webkit-slider-thumb]:bg-[var(--surface)]
                  [&::-webkit-slider-thumb]:shadow-sm
                  [&::-moz-range-thumb]:w-[17px] [&::-moz-range-thumb]:h-[17px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[var(--link)] [&::-moz-range-thumb]:bg-[var(--surface)]
                  [&::-moz-range-thumb]:shadow-sm"
              />
            </div>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[10px] text-mut tabular-nums">
            <span>{startLabel}</span>
            <span>{endLabel}</span>
          </div>
        </div>

        <div
          className="w-16 shrink-0 flex flex-col items-center justify-center text-center"
          title={`${ageMinutes} min old`}
          aria-label={`Radar frame ${activeLabel}, ${badge.toLowerCase()}, ${ageMinutes} minutes old`}
        >
          <span className="text-[12px] font-bold tabular-nums text-ink">{activeLabel}</span>
          <span
            className="text-[8px] font-extrabold uppercase tracking-wide mt-0.5"
            style={{ color: badgeColor }}
          >
            {badge}
          </span>
        </div>

        <button
          type="button"
          onClick={onTogglePlay}
          disabled={frames.length <= 1}
          aria-label={isPlaying ? "Pause radar animation" : "Play radar animation"}
          title={isPlaying ? "Pause" : "Play"}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-control border border-line text-ink hover:bg-chip transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
