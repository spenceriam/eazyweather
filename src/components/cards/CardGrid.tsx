import { useRef } from "react";
import { usePrefs } from "../../hooks/usePrefs";
import type { CardDataBag } from "../../types/cardData";
import type { CardId, CardLayout } from "../../types/prefs";
import { CARD_REGISTRY } from "./registry";
import { CardCatalog } from "./CardCatalog";
import {
  cycleCardSpan,
  reorderCards,
  setCardVisibility,
  setColumnCount,
  setHourlyVariant,
  setSevenDayVariant,
} from "./cardLayoutReducer";

interface CardGridProps {
  data: CardDataBag;
  editing: boolean;
  onDoneEditing: () => void;
}

function DragDots() {
  return (
    <svg width={9} height={12} viewBox="0 0 10 14" fill="#9FB4C2" aria-hidden="true">
      <circle cx={2.5} cy={2} r={1.4} />
      <circle cx={7.5} cy={2} r={1.4} />
      <circle cx={2.5} cy={7} r={1.4} />
      <circle cx={7.5} cy={7} r={1.4} />
      <circle cx={2.5} cy={12} r={1.4} />
      <circle cx={7.5} cy={12} r={1.4} />
    </svg>
  );
}

function HideIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6c1.4 0 2.7.2 3.9.7M22 12s-3.5 6-10 6c-1.4 0-2.7-.2-3.9-.7" />
      <line x1={4} y1={4} x2={20} y2={20} />
    </svg>
  );
}

const COL_ICONS: Record<1 | 2 | 3, JSX.Element> = {
  1: (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x={4} y={4} width={16} height={16} rx={1} />
    </svg>
  ),
  2: (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x={4} y={4} width={7} height={16} rx={1} />
      <rect x={13} y={4} width={7} height={16} rx={1} />
    </svg>
  ),
  3: (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x={3} y={4} width={5} height={16} rx={1} />
      <rect x={9.5} y={4} width={5} height={16} rx={1} />
      <rect x={16} y={4} width={5} height={16} rx={1} />
    </svg>
  ),
};

const COL_LABELS: Record<1 | 2 | 3, string> = { 1: "One", 2: "Two", 3: "Three" };

function spanLabel(span: CardLayout["spans"][CardId]): string {
  return span === "full" ? "Full width" : `${span} col`;
}

/**
 * The modular card dashboard, matching the design's card system: cards are
 * plain surface panels (their titles live inside the card bodies); edit mode
 * adds a dashed outline plus a floating dark bar above each card with drag
 * dots, name, width cycle (1 col -> 2 col -> full), and Hide. A toolbar row
 * carries the LAYOUT column picker and Done; hidden cards return via the
 * catalog tray.
 */
export function CardGrid({ data, editing, onDoneEditing }: CardGridProps) {
  const { prefs, setLayout } = usePrefs();
  const { layout } = prefs;
  const dragIdRef = useRef<CardId | null>(null);

  const visibleIds = layout.order.filter((id) => {
    const entry = CARD_REGISTRY[id];
    if (!entry) return false;
    if (entry.isAvailable && !entry.isAvailable(data)) return false;
    return layout.visible[id];
  });

  function setVariant(variantKey: "hourlyVariant" | "sevenDayVariant", value: string) {
    setLayout((prev) =>
      variantKey === "hourlyVariant"
        ? setHourlyVariant(prev, value as CardLayout["hourlyVariant"])
        : setSevenDayVariant(prev, value as CardLayout["sevenDayVariant"]),
    );
  }

  return (
    <div
      className="grid items-stretch gap-y-[22px] gap-x-[14px] md:gap-5 max-md:!grid-cols-[minmax(0,1fr)]"
      style={{
        gridTemplateColumns:
          layout.columns === 1
            ? "minmax(0,1fr)"
            : layout.columns === 2
              ? "minmax(0,1fr) minmax(0,1fr)"
              : "repeat(3,minmax(0,1fr))",
      }}
    >
      {editing && (
        <div
          className="flex flex-wrap items-center gap-2.5 md:gap-4 bg-surface border border-line rounded-card px-4 py-2.5"
          style={{ gridColumn: "1 / -1", order: -1 }}
        >
          <span className="hidden md:inline text-[11px] font-bold tracking-[0.08em] text-mut">LAYOUT</span>
          <div className="hidden md:flex border border-panelbrd rounded-control overflow-hidden">
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLayout((prev) => setColumnCount(prev, n))}
                className={`flex items-center gap-1.5 h-[30px] px-[13px] text-xs font-[650] ${
                  n > 1 ? "border-l border-panelbrd" : ""
                } ${layout.columns === n ? "bg-brand text-brandink" : "bg-surface text-soft"}`}
              >
                {COL_ICONS[n]}
                {COL_LABELS[n]}
              </button>
            ))}
          </div>
          <span className="hidden md:inline text-xs text-mut">
            Drag any card to reorder · set width from its bar
          </span>
          <span className="md:hidden text-xs text-mut">Drag cards to reorder · Hide / add back below</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onDoneEditing}
            className="h-8 px-4 rounded-control bg-brand text-brandink text-[12.5px] font-[650]"
          >
            Done
          </button>
        </div>
      )}

      {visibleIds.map((id) => {
        const entry = CARD_REGISTRY[id];
        const span = layout.spans[id];
        const Component = entry.Component;
        const variantValue = entry.variantKey ? layout[entry.variantKey] : undefined;
        const spanCols = span === "full" ? null : Math.min(span, layout.columns);

        return (
          <div
            key={id}
            className={`relative bg-surface border border-line rounded-card shadow-card ${
              entry.flexColumn ? "flex flex-col gap-2.5" : ""
            } ${editing ? "cursor-grab active:cursor-grabbing mt-4" : ""} max-md:!col-span-full`}
            style={{
              padding: entry.padding,
              order: layout.order.indexOf(id),
              gridColumn: spanCols === null ? "1 / -1" : `span ${spanCols} / span ${spanCols}`,
            }}
            draggable={editing}
            onDragStart={() => {
              dragIdRef.current = id;
            }}
            onDragEnd={() => {
              // Clears cancelled drags (Esc / dropped outside the grid) so a
              // later foreign drop can't replay a stale reorder.
              dragIdRef.current = null;
            }}
            onDragOver={(e) => {
              if (editing) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const from = dragIdRef.current;
              dragIdRef.current = null;
              if (from && from !== id) {
                setLayout((prev) => reorderCards(prev, from, id));
              }
            }}
          >
            <Component
              data={data}
              variant={variantValue}
              onVariantChange={
                entry.variantKey ? (value) => setVariant(entry.variantKey!, value) : undefined
              }
            />

            {editing && (
              <>
                <div className="absolute inset-0 rounded-card border-[1.5px] border-dashed border-[#8FA9B8] pointer-events-none" />
                <div
                  className="absolute -top-3.5 left-3 right-3 h-[30px] rounded-control flex items-center gap-2 pl-[11px] pr-1 z-[5]"
                  style={{ background: "#364247", boxShadow: "0 3px 8px rgba(0,0,0,.3)" }}
                >
                  <DragDots />
                  <span className="text-[11.5px] font-[650] text-[#F9F6EE]">{entry.label}</span>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setLayout((prev) => cycleCardSpan(prev, id))}
                    className="hidden md:flex items-center h-6 px-2 rounded-control text-[11.5px] font-semibold text-[#C9D4DB]"
                  >
                    {spanLabel(span)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayout((prev) => setCardVisibility(prev, id, false))}
                    className="flex items-center gap-1 h-6 px-2 rounded-control text-[11.5px] font-semibold text-[#C9D4DB]"
                    aria-label={`Hide ${entry.label} card`}
                  >
                    <HideIcon />
                    Hide
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}

      {editing && (
        <CardCatalog
          data={data}
          layout={layout}
          onAdd={(id) => setLayout((prev) => setCardVisibility(prev, id, true))}
        />
      )}
    </div>
  );
}
