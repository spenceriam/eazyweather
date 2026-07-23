import type { CardDataBag } from "../../types/cardData";
import type { CardId, CardLayout } from "../../types/prefs";
import { CARD_REGISTRY } from "./registry";

interface CardCatalogProps {
  data: CardDataBag;
  layout: CardLayout;
  onAdd: (id: CardId) => void;
}

/**
 * Dashed catalog tray at the bottom of the grid in edit mode (design: 196px
 * preview tiles with a "+ name" row). Previews are the real card components
 * scaled down, so they show live data rather than schematics.
 */
export function CardCatalog({ data, layout, onAdd }: CardCatalogProps) {
  const hiddenIds = layout.order.filter((id) => {
    const entry = CARD_REGISTRY[id];
    if (!entry) return false;
    if (entry.isAvailable && !entry.isAvailable(data)) return false;
    return !layout.visible[id];
  });

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
            <button
              key={id}
              type="button"
              onClick={() => onAdd(id)}
              aria-label={`Add ${entry.label} card`}
              className="w-[196px] text-left cursor-pointer border border-panelbrd rounded-control bg-surface overflow-hidden hover:border-[#8FA9B8] hover:shadow-[0_2px_8px_rgba(0,0,0,.08)] transition-shadow"
            >
              <div className="relative h-24 bg-panel overflow-hidden pointer-events-none">
                <div
                  className="absolute top-0 left-0 origin-top-left"
                  style={{ width: "200%", height: "200%", transform: "scale(0.5)" }}
                >
                  <Component data={data} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-2 border-t border-hair">
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--link)" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
                  <line x1={12} y1={5} x2={12} y2={19} />
                  <line x1={5} y1={12} x2={19} y2={12} />
                </svg>
                <span className="text-xs font-semibold text-ink2">{entry.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
