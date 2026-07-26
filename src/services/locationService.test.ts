import { describe, expect, it } from "vitest";
import { isValidZipCode, isZipCode, getZipFormatError } from "./locationService";

describe("isValidZipCode", () => {
  it("accepts a 5-digit ZIP", () => {
    expect(isValidZipCode("90210")).toBe(true);
  });

  it("accepts a ZIP+4", () => {
    expect(isValidZipCode("90210-1234")).toBe(true);
  });

  it("rejects a 6-digit number", () => {
    expect(isValidZipCode("123456")).toBe(false);
  });

  it("rejects a short number", () => {
    expect(isValidZipCode("123")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(isValidZipCode("Austin")).toBe(false);
  });
});

describe("isZipCode", () => {
  it("trims whitespace before validating", () => {
    expect(isZipCode("  90210  ")).toBe(true);
  });
});

describe("getZipFormatError", () => {
  it("returns null for a valid 5-digit ZIP", () => {
    expect(getZipFormatError("90210")).toBeNull();
  });

  it("returns null for a valid ZIP+4", () => {
    expect(getZipFormatError("90210-1234")).toBeNull();
  });

  it("returns an error for a 6-digit number (looks like an attempted ZIP)", () => {
    expect(getZipFormatError("123456")).toMatch(/Invalid ZIP code format/);
  });

  it("returns null for a non-numeric query (not an attempted ZIP)", () => {
    expect(getZipFormatError("Austin, TX")).toBeNull();
  });

  it("returns null for an empty query", () => {
    expect(getZipFormatError("")).toBeNull();
    expect(getZipFormatError("   ")).toBeNull();
  });
});
