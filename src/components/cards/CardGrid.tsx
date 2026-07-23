import { useState } from "react";
import { usePrefs } from "../../hooks/usePrefs";
import type { CardDataBag } from "../../types/cardData";
import type { CardId, CardLayout } from "../../types/prefs";
import { CARD_REGISTRY } from "./registry";
import { CardChrome } from "./CardChrome";
import { CardCatalog } from "./CardCatalog";
import {
  reorderCards,
  setCardVisibility,
  setColumnCount,
  setHourlyVariant,
  setSevenDayVariant,
  toggleCardSpan,
} from "./cardLayoutReducer";

interface CardGridProps {
  data: CardDataBag;
  editing: boolean;
  onDoneEditing: () => void;
}

export function CardGrid({ data, editing, onDoneEditing }: CardGridProps) {
  const { prefs, setLayout } = usePrefs();
  const { layout } = prefs;
  const [dragId, setDragId] = useState<CardId | null>(null);
  const [overId, setOverId] = useState<CardId | null>(null);

  const visibleIds = layout.order.filter((id) => {
    const entry = CARD_REGISTRY[id];
    if (!entry) return false;
    if (entry.isAvailable && !entry.isAvailable(data)) return false;
    return layout.visible[id];
  });

  function moveCard(sourceId: CardId, targetId: CardId) {
    setLayout((prev) => reorderCards(prev, sourceId, targetId));
  }

  function toggleSpan(id: CardId) {
    setLayout((prev) => toggleCardSpan(prev, id));
  }

  function removeCard(id: CardId) {
    setLayout((prev) => setCardVisibility(prev, id, false));
  }

  function addCard(id: CardId) {
    setLayout((prev) => setCardVisibility(prev, id, true));
  }

  function setColumns(columns: 1 | 2 | 3) {
    setLayout((prev) => setColumnCount(prev, columns));
  }

  function setVariant(variantKey: "hourlyVariant" | "sevenDayVariant", value: string) {
    setLayout((prev) =>
      variantKey === "hourlyVariant"
        ? setHourlyVariant(prev, value as CardLayout["hourlyVariant"])
        : setSevenDayVariant(prev, value as CardLayout["sevenDayVariant"]),
    );
  }

  return (
    <div>
      {editing && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2 text-sm text-ui-body">
            <span>Columns:</span>
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setColumns(n)}
                className={`w-7 h-7 rounded-control border text-xs font-semibold transition-colors ${
                  layout.columns === n
                    ? "bg-brand text-brandink border-brand"
                    : "bg-surface border-line text-ink hover:bg-chip"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onDoneEditing}
            className="text-sm font-semibold px-3 py-1.5 rounded-control bg-brand text-brandink hover:bg-brand2 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      <div
        className="grid gap-4 max-md:!grid-cols-1"
        style={{ gridTemplateColumns: `repeat(${layout.columns}, 1fr)` }}
      >
        {visibleIds.map((id) => {
          const entry = CARD_REGISTRY[id];
          const span = layout.spans[id];
          const Component = entry.Component;
          const variantValue = entry.variantKey ? layout[entry.variantKey] : undefined;

          return (
            <div
              key={id}
              style={{ gridColumn: span === "full" ? "1 / -1" : undefined }}
              draggable={editing}
              onDragStart={(e) => {
                setDragId(id);
                e.dataTransfer.setData("text/plain", id);
              }}
              onDragOver={(e) => {
                if (!editing) return;
                e.preventDefault();
                setOverId(id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveCard(dragId, id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={
                editing && overId === id && dragId && dragId !== id
                  ? "ring-2 ring-link rounded-card"
                  : undefined
              }
            >
              <CardChrome
                label={entry.label}
                editing={editing}
                span={span}
                onSpanToggle={editing ? () => toggleSpan(id) : undefined}
                variantOptions={editing ? entry.variantOptions : undefined}
                variantValue={variantValue}
                onVariantChange={
                  editing && entry.variantKey
                    ? (value) => setVariant(entry.variantKey!, value)
                    : undefined
                }
                onRemove={editing ? () => removeCard(id) : undefined}
              >
                <Component data={data} variant={variantValue} />
              </CardChrome>
            </div>
          );
        })}
      </div>

      {editing && <CardCatalog data={data} layout={layout} onAdd={addCard} />}
    </div>
  );
}
