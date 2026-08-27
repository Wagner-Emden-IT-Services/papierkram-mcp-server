import { describe, it, expect } from "vitest";
import { toToolJson, CHARACTER_LIMIT } from "../../../src/api/format.js";

describe("toToolJson", () => {
  it("gibt normal grosse Objekte unveraendert (parsebar) zurueck", () => {
    const value = { entries: [{ id: 1 }, { id: 2 }], has_more: false };
    const out = toToolJson(value);
    expect(JSON.parse(out)).toEqual(value);
  });

  it("kuerzt zu grosse Listen-Antworten und ergaenzt Truncation-Metadaten", () => {
    const entries = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      blob: "x".repeat(400),
    }));
    const out = toToolJson({ entries, has_more: true });
    expect(out.length).toBeLessThanOrEqual(CHARACTER_LIMIT);
    const parsed = JSON.parse(out);
    expect(parsed.truncated).toBe(true);
    expect(parsed.truncation_message).toMatch(/truncated/i);
    expect(parsed.entries.length).toBeLessThan(500);
  });

  it("liefert eine begrenzte Notiz fuer zu grosse Nicht-Listen-Payloads", () => {
    const out = toToolJson({ blob: "y".repeat(CHARACTER_LIMIT * 2) });
    expect(out.length).toBeLessThanOrEqual(CHARACTER_LIMIT + 500);
    const parsed = JSON.parse(out);
    expect(parsed.truncated).toBe(true);
    expect(parsed).toHaveProperty("preview");
  });
});

describe("toToolJson bei leerem Response-Body", () => {
  it("wirft nicht bei undefined (204 No Content), sondern meldet Erfolg", () => {
    // Regression Issue #5: JSON.stringify(undefined) ist undefined, nicht "undefined"
    // -> der fruehere .length-Zugriff warf einen TypeError.
    const out = toToolJson(undefined);
    const parsed = JSON.parse(out);
    expect(parsed.success).toBe(true);
    expect(parsed.message).toMatch(/empty response body/i);
  });

  it("behandelt null wie einen leeren Body", () => {
    const parsed = JSON.parse(toToolJson(null));
    expect(parsed.success).toBe(true);
  });
});
