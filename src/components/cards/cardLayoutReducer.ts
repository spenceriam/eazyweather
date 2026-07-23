import type { CardId, CardLayout, CardSpan } from "../../types/prefs";

/** Moves sourceId to targetId's position in the order array. No-op if either id is missing or they're equal. */
export function reorderCards(layout: CardLayout, sourceId: CardId, targetId: CardId): CardLayout {
  if (sourceId === targetId) return layout;
  const order = [...layout.order];
  const from = order.indexOf(sourceId);
  const to = order.indexOf(targetId);
  if (from === -1 || to === -1) return layout;
  order.splice(from, 1);
  order.splice(to, 0, sourceId);
  return { ...layout, order };
}

/** Toggles a card between full-width and its default single-column span. */
export function toggleCardSpan(layout: CardLayout, id: CardId): CardLayout {
  const nextSpan: CardSpan = layout.spans[id] === "full" ? 1 : "full";
  return { ...layout, spans: { ...layout.spans, [id]: nextSpan } };
}

export function setCardVisibility(layout: CardLayout, id: CardId, visible: boolean): CardLayout {
  return { ...layout, visible: { ...layout.visible, [id]: visible } };
}

export function setColumnCount(layout: CardLayout, columns: 1 | 2 | 3): CardLayout {
  return { ...layout, columns };
}

export function setHourlyVariant(layout: CardLayout, variant: CardLayout["hourlyVariant"]): CardLayout {
  return { ...layout, hourlyVariant: variant };
}

export function setSevenDayVariant(layout: CardLayout, variant: CardLayout["sevenDayVariant"]): CardLayout {
  return { ...layout, sevenDayVariant: variant };
}
