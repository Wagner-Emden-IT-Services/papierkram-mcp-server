import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerBankingTools } from "../../../src/core/tools/banking.js";

describe("Banking Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    server = createMockServer();
    registerBankingTools(server as never);
  });

  // ---- list_bank_connections ----

  describe("list_bank_connections", () => {
    it("Ruft /banking/bank_connections mit Standardparametern auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.bankConnectionList);
      const tool = server.getTool("list_bank_connections")!;
      await tool.execute({ page_size: 25, compact: true });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/banking/bank_connections",
        expect.objectContaining({ page_size: 25 })
      );
    });

    it("Gibt kompakte Daten zurueck (nur id und name)", async () => {
      mockClient.list.mockResolvedValue(fixtures.bankConnectionList);
      const tool = server.getTool("list_bank_connections")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: true }));

      // Compact-Felder: id, name
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ id: 900, name: "Geschaeftskonto Sparkasse" });
      expect(result.entries[1]).toEqual({ id: 901, name: "Tagesgeldkonto" });
      expect(result).toHaveProperty("has_more", false);
    });
  });

  // ---- get_bank_connection ----

  describe("get_bank_connection", () => {
    it("Ruft /banking/bank_connections/{id} mit korrekter ID auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.bankConnection);
      const tool = server.getTool("get_bank_connection")!;
      const result = JSON.parse(await tool.execute({ id: 900 }));

      expect(mockClient.get).toHaveBeenCalledWith("/banking/bank_connections/900");
      expect(result).toHaveProperty("id", 900);
      expect(result).toHaveProperty("name", "Geschaeftskonto Sparkasse");
    });
  });

  // ---- list_bank_transactions ----

  describe("list_bank_transactions", () => {
    it("Ruft /banking/transactions mit Standardparametern auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.bankTransactionList);
      const tool = server.getTool("list_bank_transactions")!;
      await tool.execute({ page_size: 25, compact: true });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/banking/transactions",
        expect.objectContaining({ page_size: 25 })
      );
    });

    it("Gibt kompakte Daten zurueck mit from_name aus verschachteltem from-Objekt", async () => {
      mockClient.list.mockResolvedValue(fixtures.bankTransactionList);
      const tool = server.getTool("list_bank_transactions")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: true }));

      // Compact-Felder: id, value, state, bdate, usage, from_name
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toHaveProperty("id", 1000);
      expect(result.entries[0]).toHaveProperty("value", "-150.00");
      expect(result.entries[0]).toHaveProperty("bdate", "2025-01-18");
      expect(result.entries[0]).toHaveProperty("usage", "Buerobedarf Amazon");
      expect(result.entries[0]).toHaveProperty("from_name", "Amazon EU S.a.r.l.");
      // from-Objekt soll NICHT mehr vorhanden sein (compact entfernt es)
      expect(result.entries[0]).not.toHaveProperty("from");
    });

    it("Uebergibt bank_connection_id als Query-Parameter", async () => {
      mockClient.list.mockResolvedValue(fixtures.bankTransactionList);
      const tool = server.getTool("list_bank_transactions")!;
      await tool.execute({ page_size: 25, compact: true, bank_connection_id: 900 });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/banking/transactions",
        expect.objectContaining({ bank_connection_id: 900 })
      );
    });
  });

  // ---- get_bank_transaction ----

  describe("get_bank_transaction", () => {
    it("Ruft /banking/transactions/{id} mit korrekter ID auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.bankTransaction);
      const tool = server.getTool("get_bank_transaction")!;
      const result = JSON.parse(await tool.execute({ id: 1000 }));

      expect(mockClient.get).toHaveBeenCalledWith("/banking/transactions/1000");
      expect(result).toHaveProperty("id", 1000);
      expect(result).toHaveProperty("value", "-150.00");
      expect(result).toHaveProperty("usage", "Buerobedarf Amazon");
    });
  });
});
