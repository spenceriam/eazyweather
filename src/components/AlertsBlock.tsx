import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { usePrefs } from "../hooks/usePrefs";
import type { WeatherAlert } from "../types/alerts";

interface AlertsBlockProps {
  alerts: WeatherAlert[];
}

function formatTimeRange(effective: string, expires: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const start = new Date(effective).toLocaleTimeString([], opts);
  const end = new Date(expires).toLocaleTimeString([], opts);
  return `${start} – ${end}`;
}

export function AlertsBlock({ alerts }: AlertsBlockProps) {
  const { prefs, hideAlert } = usePrefs();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter(
    (alert) => !prefs.hiddenAlertIds.includes(alert.id),
  );

  if (visibleAlerts.length === 0) {
    return null;
  }

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
    <div className="border border-line rounded-card bg-surface overflow-hidden">
      {visibleAlerts.map((alert, index) => {
        const isWarning = alert.severityClass === "warning";
        const isExpanded = expandedIds.has(alert.id);
        const title = alert.event || alert.headline;

        const rowBg = isWarning ? "bg-warnbg" : "bg-advbg";
        const bodyBg = isWarning ? "bg-warnbg2" : "bg-advbg";
        const bodyBorder = isWarning ? "border-warnbrd" : "border-advbrd";
        const inkText = isWarning ? "text-warnink" : "text-advink";
        const mutText = isWarning ? "text-warnmut" : "text-advmut";
        const badgeBg = isWarning ? "bg-warnbadge" : "bg-advbdg";
        const badgeText = isWarning ? "text-white" : "text-advink";

        return (
          <div
            key={alert.id}
            className={`${rowBg} ${index > 0 ? "border-t border-hair" : ""}`}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span
                className={`shrink-0 px-2 py-0.5 rounded-control text-[10px] font-bold uppercase tracking-[0.08em] ${badgeBg} ${badgeText}`}
              >
                {isWarning ? "Warning" : "Advisory"}
              </span>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${inkText}`}>
                  {title}
                </div>
                <div className={`text-xs ${mutText}`}>
                  {formatTimeRange(alert.effective, alert.expires)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleExpanded(alert.id)}
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded
                    ? `Collapse details for ${title}`
                    : `Expand details for ${title}`
                }
                className={`shrink-0 p-1 rounded-control hover:bg-black/5 transition-colors ${inkText}`}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => hideAlert(alert.id)}
                aria-label={`Hide alert: ${title}`}
                className={`shrink-0 p-1 rounded-control hover:bg-black/5 transition-colors ${mutText}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isExpanded && (
              <div className={`${bodyBg} border-t ${bodyBorder} px-4 py-3`}>
                <p className={`text-sm whitespace-pre-line ${inkText}`}>
                  {alert.description}
                </p>

                {alert.counties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {alert.counties.map((county) => (
                      <span
                        key={county}
                        className={`px-2 py-0.5 rounded-control border text-[11px] ${bodyBorder} ${mutText}`}
                      >
                        {county}
                      </span>
                    ))}
                  </div>
                )}

                <div className={`text-xs mt-3 ${mutText}`}>
                  {alert.senderName}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
