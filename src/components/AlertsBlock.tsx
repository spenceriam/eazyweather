import { useState } from "react";
import { usePrefs } from "../hooks/usePrefs";
import type { WeatherAlert } from "../types/alerts";

interface AlertsBlockProps {
  alerts: WeatherAlert[];
}

function formatAlertTime(iso: string, timezone: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone || undefined,
  });
}

function AlertTriangle({ size, stroke }: { size: number; stroke: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none"
      aria-hidden="true"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r=".5" fill={stroke} />
    </svg>
  );
}

function HideIcon() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

/**
 * All active alerts in one bordered container per the design: warning rows
 * first (solid badge, warn tokens), advisory rows after (outlined badge,
 * adv tokens). Every row expands to its full description/affected-counties
 * body and carries its own hide control; when every alert has been hidden
 * a dashed "N alerts hidden · Show" pill replaces the container.
 */
export function AlertsBlock({ alerts }: AlertsBlockProps) {
  const { prefs, hideAlert, pruneAlerts } = usePrefs();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter(
    (alert) => !prefs.hiddenAlertIds.includes(alert.id),
  );

  if (alerts.length === 0) {
    return null;
  }

  if (visibleAlerts.length === 0) {
    const count = alerts.length;
    return (
      <div className="flex justify-center mb-5">
        <button
          type="button"
          onClick={() => pruneAlerts([])}
          className="flex items-center gap-2 h-8 px-3.5 border border-dashed border-panelbrd rounded-control bg-transparent text-xs text-mut cursor-pointer"
        >
          <span>
            {count} {count === 1 ? "alert" : "alerts"} hidden ·
          </span>
          <span className="text-link font-[650]">Show</span>
        </button>
      </div>
    );
  }

  // Warnings render before advisories regardless of feed order.
  const sortedAlerts = [...visibleAlerts].sort(
    (a, b) =>
      (a.severityClass === "warning" ? 0 : 1) - (b.severityClass === "warning" ? 0 : 1),
  );
  const hasVisibleWarning = sortedAlerts.some(
    (alert) => alert.severityClass === "warning",
  );

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div
      className={
        hasVisibleWarning
          ? "border border-warnbrd rounded-card overflow-hidden mb-5"
          : "border border-advbrd rounded-card overflow-hidden mb-5"
      }
    >
      {sortedAlerts.map((alert, index) => {
        const isWarning = alert.severityClass === "warning";
        const isExpanded = expandedIds.has(alert.id);
        const title = alert.event || alert.headline;
        const accent = isWarning ? "var(--warnbadge)" : "var(--advink)";

        const expiresTime = formatAlertTime(alert.expires, prefs.timezone);
        const effectiveTime = formatAlertTime(alert.effective, prefs.timezone);
        const metaParts: string[] = [];
        if (effectiveTime) metaParts.push(`Issued ${effectiveTime}`);
        if (expiresTime) metaParts.push(`expires ${expiresTime}`);
        if (alert.senderName) metaParts.push(alert.senderName);

        return (
          <div
            key={alert.id}
            className={
              index === 0
                ? ""
                : isWarning
                  ? "border-t border-warnbrd"
                  : "border-t border-advbrd"
            }
          >
            <div
              onClick={() => toggleExpanded(alert.id)}
              className={
                isWarning
                  ? "flex items-center gap-[9px] bg-warnbg flex-wrap cursor-pointer"
                  : "flex items-center gap-[9px] bg-advbg flex-wrap cursor-pointer"
              }
              style={
                isWarning
                  ? { minHeight: "46px", padding: "6px 14px" }
                  : { minHeight: "40px", padding: "4px 14px" }
              }
            >
              <AlertTriangle size={isWarning ? 15 : 14} stroke={accent} />
              {isWarning ? (
                <span
                  className="text-[9.5px] font-extrabold tracking-[0.08em] text-white bg-warnbadge rounded-control"
                  style={{ padding: "2px 7px" }}
                >
                  WARNING
                </span>
              ) : (
                <span
                  className="text-[9.5px] font-extrabold tracking-[0.08em] text-advink border border-advbdg rounded-control"
                  style={{ padding: "2px 7px" }}
                >
                  ADVISORY
                </span>
              )}
              <span
                className={
                  isWarning
                    ? "text-[12.5px] font-bold text-warnink"
                    : "text-[12.5px] font-bold text-advink"
                }
              >
                {title}
              </span>
              {expiresTime && (
                <span className={isWarning ? "text-xs text-warnmut" : "text-xs text-advmut"}>
                  Until {expiresTime}
                </span>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleExpanded(alert.id);
                }}
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded ? `Collapse details for ${title}` : `Expand details for ${title}`
                }
                className={
                  isWarning
                    ? "flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer text-xs font-[650] text-warnbadge"
                    : "flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer text-xs font-[650] text-advink"
                }
              >
                {isExpanded ? "Less" : "Details"}
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isExpanded ? "rotate(180deg)" : "none",
                    transition: "transform .18s",
                  }}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  hideAlert(alert.id);
                }}
                aria-label={`Hide alert: ${title}`}
                className={
                  isWarning
                    ? "w-[26px] h-[26px] flex items-center justify-center rounded-control bg-transparent border-0 cursor-pointer text-warnmut hover:text-warnbadge"
                    : "w-[26px] h-[26px] flex items-center justify-center rounded-control bg-transparent border-0 cursor-pointer text-advmut hover:text-advink"
                }
              >
                <HideIcon />
              </button>
            </div>

            {isExpanded && (
              <div
                className={
                  isWarning
                    ? "bg-warnbg2 border-t border-warnbrd"
                    : "bg-advbg border-t border-advbrd"
                }
                style={{ padding: "13px 16px 15px" }}
              >
                <div
                  className={
                    isWarning
                      ? "text-[12.5px] text-warnmut whitespace-pre-line"
                      : "text-[12.5px] text-advmut whitespace-pre-line"
                  }
                  style={{ lineHeight: 1.6, maxWidth: "880px" }}
                >
                  {alert.description}
                </div>

                {(alert.counties.length > 0 || metaParts.length > 0) && (
                  <div className="flex gap-2 mt-[10px] flex-wrap items-center">
                    {alert.counties.length > 0 && (
                      <span
                        className={
                          isWarning
                            ? "text-[10.5px] font-bold tracking-[0.05em] text-warnmut"
                            : "text-[10.5px] font-bold tracking-[0.05em] text-advmut"
                        }
                      >
                        AFFECTED
                      </span>
                    )}
                    {alert.counties.map((county) => (
                      <span
                        key={county}
                        className={
                          isWarning
                            ? "text-[11px] font-semibold text-warnink border border-warnbrd rounded-control"
                            : "text-[11px] font-semibold text-advink border border-advbrd rounded-control"
                        }
                        style={{ padding: "2.5px 8px" }}
                      >
                        {county}
                      </span>
                    ))}
                    {metaParts.length > 0 && (
                      <span
                        className={
                          isWarning ? "text-[11px] text-warnmut" : "text-[11px] text-advmut"
                        }
                      >
                        {metaParts.join(" · ")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
