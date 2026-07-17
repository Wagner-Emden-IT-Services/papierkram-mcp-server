import { describe, it, expect } from "vitest";
import { normalizeVatRate, buildCustomer } from "../../../src/core/tools/_shared.js";

describe("normalizeVatRate", () => {
  it("laesst Dezimalbrueche unveraendert", () => {
    expect(normalizeVatRate(0.19)).toBe(0.19);
    expect(normalizeVatRate(0.07)).toBe(0.07);
    expect(normalizeVatRate(0)).toBe(0);
  });

  it("konvertiert Prozent-Strings in Dezimalbrueche", () => {
    expect(normalizeVatRate("19%")).toBeCloseTo(0.19, 10);
    expect(normalizeVatRate("7%")).toBeCloseTo(0.07, 10);
    expect(normalizeVatRate("0%")).toBe(0);
  });

  it("interpretiert Zahl-Strings > 1 als Prozent", () => {
    expect(normalizeVatRate("19")).toBeCloseTo(0.19, 10);
    expect(normalizeVatRate("0.19")).toBeCloseTo(0.19, 10);
    expect(normalizeVatRate("0,19")).toBeCloseTo(0.19, 10);
  });

  it("wirft bei nicht parsbarem Wert", () => {
    expect(() => normalizeVatRate("abc")).toThrow(/vat_rate/i);
  });
});

describe("buildCustomer", () => {
  it("gibt undefined zurueck wenn keine ID gesetzt", () => {
    expect(buildCustomer(undefined, undefined, undefined)).toBeUndefined();
  });

  it("baut das verschachtelte customer-Objekt", () => {
    expect(buildCustomer(100, 200, 300)).toEqual({
      id: 100,
      contact_person: { id: 200 },
      project: { id: 300 },
    });
  });

  it("verwendet !== undefined (id 0 wird nicht verworfen)", () => {
    expect(buildCustomer(0, undefined, undefined)).toEqual({ id: 0 });
  });
});
