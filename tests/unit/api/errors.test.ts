import { describe, it, expect } from "vitest";
import { mapApiError, networkError } from "../../../src/api/errors.js";

describe("mapApiError", () => {
  it("400/422 -> handlungsleitende Validierungsmeldung inkl. gekuerztem Body", () => {
    expect(mapApiError(400, "Bad Request", '{"error":"x"}').message).toMatch(/rejected the request \(400\)/i);
    expect(mapApiError(422, "Unprocessable", "line_items missing").message).toMatch(/\(422\).*line_items missing/is);
  });

  it("401 -> API-Key-Hinweis", () => {
    expect(mapApiError(401, "Unauthorized", "").message).toMatch(/authentication failed \(401\)/i);
  });

  it("403 -> Zugriff verweigert", () => {
    expect(mapApiError(403, "Forbidden", "").message).toMatch(/denied access \(403\)/i);
  });

  it("404 -> ID pruefen", () => {
    expect(mapApiError(404, "Not Found", "").message).toMatch(/not found \(404\)/i);
  });

  it("429 -> Rate Limit mit Retry-After", () => {
    const msg = mapApiError(429, "Too Many Requests", "", "30").message;
    expect(msg).toMatch(/rate limit exceeded \(429\)/i);
    expect(msg).toMatch(/30s/);
  });

  it("5xx -> temporaerer Serverfehler", () => {
    expect(mapApiError(500, "Internal Server Error", "boom").message).toMatch(/server error \(500\)/i);
    expect(mapApiError(503, "Service Unavailable", "").message).toMatch(/server error \(503\)/i);
  });

  it("strippt HTML-Markup und kuerzt sehr lange Bodies", () => {
    const html = "<html><body>" + "a".repeat(2000) + "</body></html>";
    const msg = mapApiError(400, "Bad Request", html).message;
    expect(msg).not.toContain("<html>");
    expect(msg).toContain("…");
    expect(msg.length).toBeLessThan(800);
  });

  it("unbekannter 4xx-Code faellt in den generischen Zweig", () => {
    expect(mapApiError(418, "I'm a teapot", "nope").message).toMatch(/API error 418/i);
  });
});

describe("networkError", () => {
  it("Timeout/Abort -> Timeout-Meldung", () => {
    const timeout = new Error("aborted");
    timeout.name = "TimeoutError";
    expect(networkError(timeout).message).toMatch(/timed out/i);
    const abort = new Error("aborted");
    abort.name = "AbortError";
    expect(networkError(abort).message).toMatch(/timed out/i);
  });

  it("sonstige Netzwerkfehler -> 'Could not reach'", () => {
    expect(networkError(new Error("ECONNREFUSED")).message).toMatch(/could not reach papierkram.*ECONNREFUSED/i);
  });
});
