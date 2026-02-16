import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockClient, type MockClient } from "../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../helpers/mock-server.js";
import { fixtures } from "../helpers/fixtures.js";

let mockClient: MockClient;

vi.mock("../../src/api/client.js", () => ({
  getClient: () => mockClient,
}));

// MUST import AFTER vi.mock
import { registerResources } from "../../src/core/resources.js";

describe("Resource Templates", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerResources(server as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Registriert genau 3 Resource Templates", () => {
    expect(server.resourceTemplates).toHaveLength(3);
  });

  // ---- Papierkram Company ----

  describe("Papierkram Company", () => {
    it("Ruft client.get mit /contact/companies/{id} auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.company);

      const resource = server.getResourceTemplate("Papierkram Company")!;
      expect(resource).toBeDefined();

      await resource.load({ id: "100" });

      expect(mockClient.get).toHaveBeenCalledWith("/contact/companies/100");
    });

    it("Gibt JSON-formatiertes Ergebnis als text zurueck", async () => {
      mockClient.get.mockResolvedValue(fixtures.company);

      const resource = server.getResourceTemplate("Papierkram Company")!;
      const result = await resource.load({ id: "100" });

      expect(result).toHaveProperty("text");
      const parsed = JSON.parse(result.text);
      expect(parsed.id).toBe(100);
      expect(parsed.name).toBe("Testfirma GmbH");
      expect(parsed.contact_type).toBe("customer");
    });
  });

  // ---- Papierkram Invoice ----

  describe("Papierkram Invoice", () => {
    it("Ruft client.get mit /income/invoices/{id} auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.invoice);

      const resource = server.getResourceTemplate("Papierkram Invoice")!;
      expect(resource).toBeDefined();

      await resource.load({ id: "300" });

      expect(mockClient.get).toHaveBeenCalledWith("/income/invoices/300");
    });

    it("Gibt JSON-formatiertes Rechnungsobjekt zurueck", async () => {
      mockClient.get.mockResolvedValue(fixtures.invoice);

      const resource = server.getResourceTemplate("Papierkram Invoice")!;
      const result = await resource.load({ id: "300" });

      const parsed = JSON.parse(result.text);
      expect(parsed.id).toBe(300);
      expect(parsed.invoice_no).toBe("RE-2025-001");
      expect(parsed.state).toBe("paid");
    });
  });

  // ---- Papierkram Project ----

  describe("Papierkram Project", () => {
    it("Ruft client.get mit /projects/{id} auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.project);

      const resource = server.getResourceTemplate("Papierkram Project")!;
      expect(resource).toBeDefined();

      await resource.load({ id: "600" });

      expect(mockClient.get).toHaveBeenCalledWith("/projects/600");
    });

    it("Gibt JSON-formatiertes Projektobjekt zurueck", async () => {
      mockClient.get.mockResolvedValue(fixtures.project);

      const resource = server.getResourceTemplate("Papierkram Project")!;
      const result = await resource.load({ id: "600" });

      const parsed = JSON.parse(result.text);
      expect(parsed.id).toBe(600);
      expect(parsed.name).toBe("Webseite Redesign");
      expect(parsed.record_state).toBe("active");
    });
  });
});
