import type { CardDataBag } from "../../types/cardData";
import type { CardId, CardLayout } from "../../types/prefs";
import { CARD_REGISTRY } from "./registry";

interface CardCatalogProps {
  data: CardDataBag;
  layout: CardLayout;
  onAdd: (id: CardId) => void;
}

/** Dashed tray of hidden cards, each a real scaled-down live preview (not a schematic). */
export function CardCatalog({ data, layout, onAdd }: CardCatalogProps) {
  const hiddenIds = layout.order.filter((id) => {
    const entry = CARD_REGISTRY[id];
    if (!entry) return false;
    if (entry.isAvailable && !entry.isAvailable(data)) return false;
    return !layout.visible[id];
  });

  if (hiddenIds.length === 0) {
    return (
      <div className="mt-6 border border-dashed border-line rounded-card p-4 text-center text-sm text-mut">
        All available cards are on your dashboard.
      </div>
    );
  }

  return (
    <div className="mt-6 border border-dashed border-line rounded-card p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-mut mb-3">
        Card catalog
      </div>
      <div className="flex flex-wrap gap-4">
        {hiddenIds.map((id) => {
          const entry = CARD_REGISTRY[id];
          const Component = entry.Component;
          return (
            <div key={id} className="w-[220px]">
              <div className="relative h-[96px] overflow-hidden rounded-card border border-line bg-panel">
                <div
                  className="absolute top-0 left-0 origin-top-left pointer-events-none"
                  style={{ width: "182%", height: "182%", transform: "scale(0.55)" }}
                >
                  <Component data={data} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-medium text-ink">{entry.label}</span>
                <button
                  type="button"
                  onClick={() => onAdd(id)}
                  className="text-xs font-semibold text-link hover:underline"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
