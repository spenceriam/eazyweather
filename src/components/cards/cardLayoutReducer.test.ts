import { describe, expect, it } from "vitest";
import { DEFAULT_CARD_LAYOUT } from "../../types/prefs";
import {
  reorderCards,
  setCardVisibility,
  setColumnCount,
  setHourlyVariant,
  setSevenDayVariant,
  toggleCardSpan,
} from "./cardLayoutReducer";

describe("reorderCards", () => {
  it("moves a card to another card's position", () => {
    const next = reorderCards(DEFAULT_CARD_LAYOUT, "monthly", "hourly");
    // "monthly" should now sit where "hourly" was (at the front).
    expect(next.order[0]).toBe("monthly");
    expect(next.order).not.toBe(DEFAULT_CARD_LAYOUT.order);
    expect(next.order).toHaveLength(DEFAULT_CARD_LAYOUT.order.length);
  });

  it("is a no-op when source and target are the same", () => {
    const next = reorderCards(DEFAULT_CARD_LAYOUT, "hourly", "hourly");
    expect(next).toBe(DEFAULT_CARD_LAYOUT);
  });

  it("is a no-op when either id is unknown", () => {
    // @ts-expect-error deliberately invalid id to exercise the guard
    const next = reorderCards(DEFAULT_CARD_LAYOUT, "hourly", "not-a-card");
    expect(next).toBe(DEFAULT_CARD_LAYOUT);
  });

  it("does not mutate the original layout", () => {
    const orderBefore = [...DEFAULT_CARD_LAYOUT.order];
    reorderCards(DEFAULT_CARD_LAYOUT, "monthly", "hourly");
    expect(DEFAULT_CARD_LAYOUT.order).toEqual(orderBefore);
  });
});

describe("toggleCardSpan", () => {
  it("flips a 1-column card to full width", () => {
    const next = toggleCardSpan(DEFAULT_CARD_LAYOUT, "details");
    expect(next.spans.details).toBe("full");
  });

  it("flips a full-width card back to 1 column", () => {
    const next = toggleCardSpan(DEFAULT_CARD_LAYOUT, "hourly");
    expect(next.spans.hourly).toBe(1);
  });
});

describe("setCardVisibility", () => {
  it("hides a visible card", () => {
    const next = setCardVisibility(DEFAULT_CARD_LAYOUT, "hourly", false);
    expect(next.visible.hourly).toBe(false);
  });

  it("shows a hidden card (adding from the catalog)", () => {
    const next = setCardVisibility(DEFAULT_CARD_LAYOUT, "wind", true);
    expect(next.visible.wind).toBe(true);
    // Unrelated cards are untouched.
    expect(next.visible.hourly).toBe(true);
  });
});

describe("setColumnCount", () => {
  it("updates the column count", () => {
    expect(setColumnCount(DEFAULT_CARD_LAYOUT, 3).columns).toBe(3);
  });
});

describe("variant setters", () => {
  it("updates the hourly variant", () => {
    expect(setHourlyVariant(DEFAULT_CARD_LAYOUT, "trend").hourlyVariant).toBe("trend");
  });

  it("updates the seven-day variant", () => {
    expect(setSevenDayVariant(DEFAULT_CARD_LAYOUT, "columns").sevenDayVariant).toBe("columns");
  });
});
