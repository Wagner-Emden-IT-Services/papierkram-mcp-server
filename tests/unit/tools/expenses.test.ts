import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerExpenseTools } from "../../../src/core/tools/expenses.js";

describe("Expense Voucher Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    server = createMockServer();
    registerExpenseTools(server as never);
  });

  // ---- list_expense_vouchers ----

  describe("list_expense_vouchers", () => {
    it("Ruft /expense/vouchers mit Standardparametern auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.expenseVoucherList);
      const tool = server.getTool("list_expense_vouchers")!;
      await tool.execute({ page_size: 25, compact: true });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/expense/vouchers",
        expect.objectContaining({ page_size: 25 })
      );
    });

    it("Gibt kompakte Daten zurueck wenn compact=true (Standard)", async () => {
      mockClient.list.mockResolvedValue(fixtures.expenseVoucherList);
      const tool = server.getTool("list_expense_vouchers")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: true }));

      // Compact-Felder: id, name, voucher_no, state, document_date, due_date, amount
      expect(result.entries[0]).toHaveProperty("id", 500);
      expect(result.entries[0]).toHaveProperty("voucher_no", "AB-2025-001");
      expect(result.entries[0]).toHaveProperty("amount", "250.00");
      expect(result).toHaveProperty("has_more", false);
    });

    it("Gibt vollstaendige API-Antwort zurueck wenn compact=false", async () => {
      mockClient.list.mockResolvedValue(fixtures.expenseVoucherList);
      const tool = server.getTool("list_expense_vouchers")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: false }));

      // Volle Antwort => alle Felder unmodifiziert
      expect(result).toEqual(fixtures.expenseVoucherList);
    });

    it("Uebergibt Filter-Parameter an API (creditor_id, project_id, document_date_range)", async () => {
      mockClient.list.mockResolvedValue(fixtures.expenseVoucherList);
      const tool = server.getTool("list_expense_vouchers")!;
      await tool.execute({
        page_size: 25,
        compact: true,
        creditor_id: 101,
        project_id: 600,
        document_date_range_start: "2025-01-01",
        document_date_range_end: "2025-06-30",
      });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/expense/vouchers",
        expect.objectContaining({
          creditor_id: 101,
          project_id: 600,
          document_date_range_start: "2025-01-01",
          document_date_range_end: "2025-06-30",
        })
      );
    });
  });

  // ---- get_expense_voucher ----

  describe("get_expense_voucher", () => {
    it("Ruft /expense/vouchers/{id} mit korrekter ID auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.expenseVoucher);
      const tool = server.getTool("get_expense_voucher")!;
      const result = JSON.parse(await tool.execute({ id: 500 }));

      expect(mockClient.get).toHaveBeenCalledWith("/expense/vouchers/500");
      expect(result).toHaveProperty("id", 500);
      expect(result).toHaveProperty("name", "Buerokosten Januar");
    });
  });

  // ---- create_expense_voucher ----

  describe("create_expense_voucher", () => {
    it("Baut creditor-Objekt korrekt aus creditor_id", async () => {
      mockClient.create.mockResolvedValue({ id: 502 });
      const tool = server.getTool("create_expense_voucher")!;
      await tool.execute({
        name: "Neue Ausgabe",
        provenance: "domestic",
        creditor_id: 101,
        line_items: [
          { name: "Druckerpatronen", amount: 59.99, vat_rate: "19%", category: "Sonstige betriebliche Aufwendungen" },
        ],
      });

      expect(mockClient.create).toHaveBeenCalledWith(
        "/expense/vouchers",
        expect.objectContaining({
          name: "Neue Ausgabe",
          provenance: "domestic",
          creditor: { id: 101 },
          line_items: [
            { name: "Druckerpatronen", amount: 59.99, vat_rate: "19%", category: "Sonstige betriebliche Aufwendungen" },
          ],
        })
      );
    });

    it("Sendet keinen creditor-Key wenn creditor_id nicht angegeben", async () => {
      mockClient.create.mockResolvedValue({ id: 503 });
      const tool = server.getTool("create_expense_voucher")!;
      await tool.execute({
        name: "Ausgabe ohne Lieferant",
        provenance: "eu",
      });

      const callBody = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(callBody).not.toHaveProperty("creditor");
      expect(callBody).toHaveProperty("provenance", "eu");
    });

    it("Erfordert provenance als Pflichtfeld (domestic, eu, non_eu)", async () => {
      mockClient.create.mockResolvedValue({ id: 504 });
      const tool = server.getTool("create_expense_voucher")!;
      await tool.execute({
        name: "EU-Rechnung",
        provenance: "non_eu",
      });

      const callBody = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(callBody).toHaveProperty("provenance", "non_eu");
    });
  });

  // ---- update_expense_voucher ----

  describe("update_expense_voucher", () => {
    it("Trennt id vom Body und verschachtelt creditor korrekt", async () => {
      mockClient.update.mockResolvedValue({ id: 500 });
      const tool = server.getTool("update_expense_voucher")!;
      await tool.execute({
        id: 500,
        name: "Aktualisierte Ausgabe",
        creditor_id: 102,
      });

      expect(mockClient.update).toHaveBeenCalledWith(
        "/expense/vouchers/500",
        expect.objectContaining({
          name: "Aktualisierte Ausgabe",
          creditor: { id: 102 },
        })
      );
      // id darf NICHT im Body stehen
      const callBody = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(callBody).not.toHaveProperty("id");
    });
  });

  // ---- delete_expense_voucher ----

  describe("delete_expense_voucher", () => {
    it("Loescht unter korrektem Pfad und gibt Erfolgsmeldung zurueck", async () => {
      const tool = server.getTool("delete_expense_voucher")!;
      const result = await tool.execute({ id: 500 });

      expect(mockClient.delete).toHaveBeenCalledWith("/expense/vouchers/500");
      expect(result).toContain("500");
      expect(result.toLowerCase()).toContain("deleted");
    });
  });
});
