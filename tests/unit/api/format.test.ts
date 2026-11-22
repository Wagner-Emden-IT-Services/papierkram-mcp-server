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

describe("toToolJson ohne Einrueckung (indent 0)", () => {
  it("bleibt standardmaessig bei zwei Leerzeichen Einrueckung", () => {
    const value = { entries: [{ id: 1 }], has_more: false };
    expect(toToolJson(value)).toBe(JSON.stringify(value, null, 2));
  });

  it("gibt kompaktes, parsebares und inhaltsgleiches JSON aus", () => {
    const value = { entries: [{ id: 1, name: "A" }, { id: 2, name: "B" }], has_more: false };
    const out = toToolJson(value, 0);
    expect(out).toBe(JSON.stringify(value));
    expect(JSON.parse(out)).toEqual(JSON.parse(toToolJson(value)));
  });

  it("misst die Kuerzung am ausgegebenen String: kompakt passt, eingerueckt nicht", () => {
    // 100 Eintraege mit je 20 kurzen Feldern: kompakt rund 17.000, eingerueckt rund 33.000 Zeichen.
    const entries = Array.from({ length: 100 }, (_, i) =>
      Object.fromEntries(Array.from({ length: 20 }, (_, k) => [`k${k}`, i])),
    );
    const value = { entries, has_more: false };
    expect(JSON.stringify(value).length).toBeLessThanOrEqual(CHARACTER_LIMIT);
    expect(JSON.stringify(value, null, 2).length).toBeGreaterThan(CHARACTER_LIMIT);

    expect(JSON.parse(toToolJson(value)).truncated).toBe(true);

    const compact = JSON.parse(toToolJson(value, 0));
    expect(compact).not.toHaveProperty("truncated");
    expect(compact.entries).toHaveLength(100);
  });

  it("kuerzt auch kompakt, wenn der kompakte String zu gross ist", () => {
    const entries = Array.from({ length: 500 }, (_, i) => ({ id: i, blob: "x".repeat(400) }));
    const out = toToolJson({ entries, has_more: true }, 0);
    expect(out.length).toBeLessThanOrEqual(CHARACTER_LIMIT);
    expect(out).not.toMatch(/\n/);
    const parsed = JSON.parse(out);
    expect(parsed.truncated).toBe(true);
    expect(parsed.entries.length).toBeLessThan(500);
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
