import { describe, it, expect, afterEach } from "vitest";
import { loadConfig } from "../../../src/config/index.js";

describe("Config", () => {
  const savedEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it("Gibt korrekte Config zurueck wenn alle Env Vars gesetzt", () => {
    process.env.PAPIERKRAM_API_KEY = "my-key";
    process.env.PAPIERKRAM_SUBDOMAIN = "my-firm";
    process.env.PORT = "4000";

    const config = loadConfig();

    expect(config).toEqual({
      apiKey: "my-key",
      subdomain: "my-firm",
      port: 4000,
    });
  });

  it("Wirft Fehler wenn PAPIERKRAM_API_KEY fehlt", () => {
    delete process.env.PAPIERKRAM_API_KEY;
    process.env.PAPIERKRAM_SUBDOMAIN = "my-firm";

    expect(() => loadConfig()).toThrowError(
      "PAPIERKRAM_API_KEY environment variable is required"
    );
  });

  it("Wirft Fehler wenn PAPIERKRAM_SUBDOMAIN fehlt", () => {
    process.env.PAPIERKRAM_API_KEY = "my-key";
    delete process.env.PAPIERKRAM_SUBDOMAIN;

    expect(() => loadConfig()).toThrowError(
      "PAPIERKRAM_SUBDOMAIN environment variable is required"
    );
  });

  it("Verwendet Default-Port 3001 wenn PORT nicht gesetzt", () => {
    process.env.PAPIERKRAM_API_KEY = "my-key";
    process.env.PAPIERKRAM_SUBDOMAIN = "my-firm";
    delete process.env.PORT;

    const config = loadConfig();

    expect(config.port).toBe(3001);
  });

  it("Parst PORT aus Umgebungsvariable", () => {
    process.env.PAPIERKRAM_API_KEY = "my-key";
    process.env.PAPIERKRAM_SUBDOMAIN = "my-firm";
    process.env.PORT = "8080";

    const config = loadConfig();

    expect(config.port).toBe(8080);
  });
});
