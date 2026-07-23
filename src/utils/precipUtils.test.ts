import { describe, expect, it } from "vitest";
import { getPrecipGlyph } from "./precipUtils";

describe("getPrecipGlyph", () => {
  it("returns snowflake for chance snow showers", () => {
    expect(getPrecipGlyph("Chance Snow Showers")).toBe("snowflake");
  });

  it("returns raindrop for scattered thunderstorms", () => {
    expect(getPrecipGlyph("Scattered Thunderstorms")).toBe("raindrop");
  });

  it("returns snowflake for wintry mix", () => {
    expect(getPrecipGlyph("Wintry Mix")).toBe("snowflake");
  });

  it("returns snowflake for sleet and freezing rain", () => {
    expect(getPrecipGlyph("Sleet")).toBe("snowflake");
    expect(getPrecipGlyph("Freezing Rain")).toBe("snowflake");
  });

  it("returns snowflake for flurries", () => {
    expect(getPrecipGlyph("Slight Chance Flurries")).toBe("snowflake");
  });

  it("returns raindrop for plain rain/showers", () => {
    expect(getPrecipGlyph("Chance Rain Showers")).toBe("raindrop");
  });

  it("is case-insensitive", () => {
    expect(getPrecipGlyph("SNOW")).toBe("snowflake");
  });
});
