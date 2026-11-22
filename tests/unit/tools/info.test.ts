import { describe, it, expect, vi, beforeEach } from "vitest";
import type { z } from "zod";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerInfoTools } from "../../../src/core/tools/info.js";

const COMPACT_PROPOSITION_FIELDS = [
  "id",
  "name",
  "article_no",
  "proposition_type",
  "price",
  "time_unit",
  "unit_name_1",
  "unit_name_n",
  "record_state",
];

describe("Info Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerInfoTools(server as unknown as import("fastmcp").FastMCP);
  });

  // ---- get_account_info ----
  describe("get_account_info", () => {
    it("ruft /info auf ohne Parameter", async () => {
      mockClient.get.mockResolvedValue(fixtures.accountInfo);

      const tool = server.getTool("get_account_info")!;
      const result = JSON.parse(await tool.execute({}));

      expect(mockClient.get).toHaveBeenCalledWith("/info");
      expect(result).toHaveProperty("company", "Wagner-Emden IT Services");
      expect(result).toHaveProperty("plan", "professional");
    });
  });

  // ---- list_payment_terms ----
  describe("list_payment_terms", () => {
    it("ruft /income/payment_terms mit Paginierung auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.paymentTermList);

      const tool = server.getTool("list_payment_terms")!;
      const result = JSON.parse(await tool.execute({ page: 1, page_size: 25 }));

      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/payment_terms",
        expect.objectContaining({ page: 1, page_size: 25 }),
      );
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0]).toHaveProperty("name", "Sofort faellig");
    });

    it("bleibt eingerueckt (JSON-Konvention der uebrigen Tools)", async () => {
      mockClient.list.mockResolvedValue(fixtures.paymentTermList);

      const tool = server.getTool("list_payment_terms")!;
      const out = await tool.execute({ page: 1, page_size: 25 });

      expect(out).toBe(JSON.stringify(fixtures.paymentTermList, null, 2));
    });
  });

  // ---- list_propositions ----
  describe("list_propositions", () => {
    it("ruft /income/propositions mit Paginierung auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.propositionList);

      const tool = server.getTool("list_propositions")!;
      const result = JSON.parse(await tool.execute({ page: 1, page_size: 25 }));

      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/propositions",
        expect.objectContaining({ page: 1, page_size: 25 }),
      );
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toHaveProperty("name", "Webentwicklung");
    });

    it("uebergibt Sortierungsparameter korrekt", async () => {
      mockClient.list.mockResolvedValue(fixtures.propositionList);

      const tool = server.getTool("list_propositions")!;
      await tool.execute({
        page: 1,
        page_size: 10,
        order_by: "name",
        order_direction: "asc",
      });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/propositions",
        expect.objectContaining({
          page: 1,
          page_size: 10,
          order_by: "name",
          order_direction: "asc",
        }),
      );
    });

    it("hat compact als Parameter mit Standard false", () => {
      const tool = server.getTool("list_propositions")!;
      const parsed = (tool.parameters as z.ZodTypeAny).parse({});

      expect(parsed).toEqual({ page_size: 25, compact: false });
    });

    it("liefert bei compact=true genau die compact-Felder", async () => {
      mockClient.list.mockResolvedValue(fixtures.propositionList);

      const tool = server.getTool("list_propositions")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: true }));

      expect(result.entries).toHaveLength(2);
      expect(Object.keys(result.entries[0])).toEqual(COMPACT_PROPOSITION_FIELDS);
      expect(result.entries[0]).toEqual({
        id: 50,
        name: "Webentwicklung",
        article_no: "AN-00050",
        proposition_type: "service",
        price: "120.0",
        time_unit: "hour",
        unit_name_1: "Stunde",
        unit_name_n: "Stunden",
        record_state: "active",
      });
      // Felder, die compact weglaesst
      for (const dropped of ["type", "description", "flagged", "favorite", "created_at", "updated_at"]) {
        expect(result.entries[0]).not.toHaveProperty(dropped);
      }
      // Listen-Metadaten bleiben erhalten
      const { entries: _entries, ...meta } = fixtures.propositionList;
      expect(result).toMatchObject(meta);
    });

    it("liefert ohne compact-Angabe die volle Antwort (mit und ohne Schema-Default)", async () => {
      mockClient.list.mockResolvedValue(fixtures.propositionList);

      const tool = server.getTool("list_propositions")!;
      for (const args of [{ page_size: 25 }, (tool.parameters as z.ZodTypeAny).parse({})]) {
        expect(JSON.parse(await tool.execute(args))).toEqual(fixtures.propositionList);
      }
    });

    it("liefert bei compact=false dieselben Daten wie 2.0.4", async () => {
      mockClient.list.mockResolvedValue(fixtures.propositionList);

      const tool = server.getTool("list_propositions")!;
      const out = await tool.execute({ page_size: 25, compact: false });

      // 2.0.4 gab die API-Antwort als JSON.stringify(result, null, 2) aus.
      const v204 = JSON.stringify(fixtures.propositionList, null, 2);
      expect(JSON.parse(out)).toEqual(JSON.parse(v204));
    });

    it("gibt JSON ohne Einrueckung aus, parsebar und inhaltsgleich (beide compact-Stellungen)", async () => {
      mockClient.list.mockResolvedValue(fixtures.propositionList);
      const tool = server.getTool("list_propositions")!;

      const full = await tool.execute({ page_size: 25, compact: false });
      expect(full).toBe(JSON.stringify(fixtures.propositionList));

      const compact = await tool.execute({ page_size: 25, compact: true });
      expect(compact).not.toMatch(/\n/);
      expect(compact).toBe(JSON.stringify(JSON.parse(compact)));
    });

    it("reicht compact nicht an die API weiter", async () => {
      mockClient.list.mockResolvedValue(fixtures.propositionList);

      const tool = server.getTool("list_propositions")!;
      for (const compact of [true, false]) {
        await tool.execute({ page: 2, page_size: 25, compact });

        expect(mockClient.list).toHaveBeenLastCalledWith("/income/propositions", { page: 2, page_size: 25 });
      }
    });
  });

  // ---- get_proposition ----
  describe("get_proposition", () => {
    it("ruft /income/propositions/{id} auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.proposition);

      const tool = server.getTool("get_proposition")!;
      const result = JSON.parse(await tool.execute({ id: 50 }));

      expect(mockClient.get).toHaveBeenCalledWith("/income/propositions/50");
      expect(result).toHaveProperty("id", 50);
      expect(result).toHaveProperty("name", "Webentwicklung");
      expect(result).toHaveProperty("description", "Frontend- und Backend-Entwicklung");
    });
  });
});
