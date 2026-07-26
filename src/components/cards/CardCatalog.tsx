import { useCallback } from "react";
import type { CardDataBag } from "../../types/cardData";
import type { CardId, CardLayout } from "../../types/prefs";
import { CARD_REGISTRY } from "./registry";

interface CardCatalogProps {
  data: CardDataBag;
  layout: CardLayout;
  onAdd: (id: CardId) => void;
}

/** Static stand-in for the radar preview — mounting a live Leaflet map (plus its
 * RainViewer fetch and playback interval) inside a 196px tray tile is wasteful. */
function RadarPreviewPlaceholder() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-1.5 text-mut">
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 6a6 6 0 1 0 6 6" />
        <circle cx={12} cy={12} r={1.6} fill="currentColor" stroke="none" />
        <path d="M12 12 20 4" />
      </svg>
      <span className="text-[10px] font-semibold">Live radar map</span>
    </div>
  );
}

/**
 * Dashed catalog tray at the bottom of the grid in edit mode (design: 196px
 * preview tiles with a "+ name" row). Previews are the real card components
 * scaled down; the preview subtree is made `inert` so its internal buttons
 * (variant toggles, row expanders) are removed from tab order and the
 * accessibility tree — otherwise this would nest interactive elements
 * inside the Add button.
 */
export function CardCatalog({ data, layout, onAdd }: CardCatalogProps) {
  const hiddenIds = layout.order.filter((id) => {
    const entry = CARD_REGISTRY[id];
    if (!entry) return false;
    if (entry.isAvailable && !entry.isAvailable(data)) return false;
    return !layout.visible[id];
  });

  // React 18's typings don't know the `inert` attribute yet — set it via ref.
  const makeInert = useCallback((el: HTMLDivElement | null) => {
    if (el) el.setAttribute("inert", "");
  }, []);

  if (hiddenIds.length === 0) return null;

  return (
    <div
      className="border-[1.5px] border-dashed border-panelbrd rounded-card px-[18px] pt-3.5 pb-4"
      style={{ gridColumn: "1 / -1", order: 99 }}
    >
      <div className="text-xs font-[650] text-mut2">Card catalog</div>
      <div className="flex flex-wrap gap-3 mt-2.5">
        {hiddenIds.map((id) => {
          const entry = CARD_REGISTRY[id];
          const Component = entry.Component;
          return (
            <div
              key={id}
              role="button"
              tabIndex={0}
              onClick={() => onAdd(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onAdd(id);
                }
              }}
              aria-label={`Add ${entry.label} card`}
              className="w-[196px] text-left cursor-pointer border border-panelbrd rounded-control bg-surface overflow-hidden hover:border-[#8FA9B8] hover:shadow-[0_2px_8px_rgba(0,0,0,.08)] transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-link"
            >
              <div
                ref={makeInert}
                aria-hidden="true"
                className="relative h-24 bg-panel overflow-hidden pointer-events-none"
              >
                {id === "radar" ? (
                  <RadarPreviewPlaceholder />
                ) : (
                  <div
                    className="absolute top-0 left-0 origin-top-left"
                    style={{ width: "200%", height: "200%", transform: "scale(0.5)" }}
                  >
                    <Component data={data} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-hair">
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--link)" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
                  <line x1={12} y1={5} x2={12} y2={19} />
                  <line x1={5} y1={12} x2={19} y2={12} />
                </svg>
                <span className="text-xs font-semibold text-ink2">{entry.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
