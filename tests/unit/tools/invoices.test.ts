import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerInvoiceTools } from "../../../src/core/tools/invoices.js";

describe("Rechnungs-Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerInvoiceTools(server as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== list_invoices ==========
  describe("list_invoices", () => {
    it("ruft client.list mit /income/invoices auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.invoiceList);
      const tool = server.getTool("list_invoices")!;
      await tool.execute({ compact: true, page_size: 25 });
      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/invoices",
        expect.objectContaining({ page_size: 25 }),
      );
    });

    it("uebergibt Filter-Parameter als Query", async () => {
      mockClient.list.mockResolvedValue(fixtures.invoiceList);
      const tool = server.getTool("list_invoices")!;
      await tool.execute({
        compact: true,
        page_size: 25,
        company_id: 100,
        project_id: 600,
        document_date_range_start: "2025-01-01",
        document_date_range_end: "2025-12-31",
      });
      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/invoices",
        expect.objectContaining({
          company_id: 100,
          project_id: 600,
          document_date_range_start: "2025-01-01",
          document_date_range_end: "2025-12-31",
        }),
      );
    });

    it("gibt kompakte Daten im Compact-Modus zurueck (default)", async () => {
      mockClient.list.mockResolvedValue(fixtures.invoiceList);
      const tool = server.getTool("list_invoices")!;
      const result = await tool.execute({ compact: true, page_size: 25 });
      const parsed = JSON.parse(result);
      expect(parsed.entries).toHaveLength(2);
      // Compact-Felder vorhanden
      expect(parsed.entries[0]).toHaveProperty("id", 300);
      expect(parsed.entries[0]).toHaveProperty("invoice_no", "RE-2025-001");
      expect(parsed.entries[0]).toHaveProperty("billing_company", "Testfirma GmbH");
      // Pagination erhalten
      expect(parsed).toHaveProperty("has_more", false);
      expect(parsed).toHaveProperty("total_entries", 2);
    });

    it("gibt volle API-Antwort bei compact=false zurueck", async () => {
      mockClient.list.mockResolvedValue(fixtures.invoiceList);
      const tool = server.getTool("list_invoices")!;
      const result = await tool.execute({ compact: false, page_size: 25 });
      const parsed = JSON.parse(result);
      // Volle Antwort = unveraenderte Fixture
      expect(parsed).toEqual(fixtures.invoiceList);
    });
  });

  // ========== get_invoice ==========
  describe("get_invoice", () => {
    it("ruft client.get mit korrekter ID auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.invoice);
      const tool = server.getTool("get_invoice")!;
      await tool.execute({ id: 300 });
      expect(mockClient.get).toHaveBeenCalledWith("/income/invoices/300");
    });

    it("gibt JSON-String zurueck", async () => {
      mockClient.get.mockResolvedValue(fixtures.invoice);
      const tool = server.getTool("get_invoice")!;
      const result = await tool.execute({ id: 300 });
      const parsed = JSON.parse(result);
      expect(parsed.id).toBe(300);
      expect(parsed.name).toBe("Testrechnung");
      expect(parsed.invoice_no).toBe("RE-2025-001");
    });
  });

  // ========== create_invoice ==========
  describe("create_invoice", () => {
    it("baut verschachteltes payment_term Objekt", async () => {
      mockClient.create.mockResolvedValue({ id: 302 });
      const tool = server.getTool("create_invoice")!;
      await tool.execute({
        name: "Neue Rechnung",
        payment_term_id: 2,
        line_items: [{ name: "Pos", quantity: 1, price: 100, vat_rate: 0.19 }],
      });
      expect(mockClient.create).toHaveBeenCalledWith(
        "/income/invoices",
        expect.objectContaining({
          payment_term: { id: 2 },
        }),
      );
    });

    it("baut verschachteltes customer Objekt wenn IDs vorhanden", async () => {
      mockClient.create.mockResolvedValue({ id: 302 });
      const tool = server.getTool("create_invoice")!;
      await tool.execute({
        name: "Rechnung mit Kunde",
        payment_term_id: 1,
        customer_id: 100,
        contact_person_id: 200,
        project_id: 600,
        line_items: [{ name: "Pos", quantity: 1, price: 100, vat_rate: 0.19 }],
      });
      expect(mockClient.create).toHaveBeenCalledWith(
        "/income/invoices",
        expect.objectContaining({
          customer: {
            id: 100,
            contact_person: { id: 200 },
            project: { id: 600 },
          },
        }),
      );
    });

    it("erzeugt keinen customer-Key wenn keine IDs gesetzt", async () => {
      mockClient.create.mockResolvedValue({ id: 302 });
      const tool = server.getTool("create_invoice")!;
      await tool.execute({
        name: "Rechnung ohne Kunde",
        payment_term_id: 1,
        line_items: [{ name: "Pos", quantity: 1, price: 100, vat_rate: 0.19 }],
      });
      const callArgs = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs).not.toHaveProperty("customer");
    });

    it("baut verschachteltes billing Objekt aus billing_* Feldern", async () => {
      mockClient.create.mockResolvedValue({ id: 302 });
      const tool = server.getTool("create_invoice")!;
      await tool.execute({
        name: "Rechnung mit Billing",
        payment_term_id: 1,
        billing_company: "Testfirma GmbH",
        billing_street: "Teststr. 1",
        billing_zip: "10115",
        billing_city: "Berlin",
        billing_country: "DE",
        billing_ust_idnr: "DE123456789",
        billing_email: "rechnung@testfirma.de",
        line_items: [{ name: "Pos", quantity: 1, price: 100, vat_rate: 0.19 }],
      });
      expect(mockClient.create).toHaveBeenCalledWith(
        "/income/invoices",
        expect.objectContaining({
          billing: {
            company: "Testfirma GmbH",
            street: "Teststr. 1",
            zip: "10115",
            city: "Berlin",
            country: "DE",
            ust_idnr: "DE123456789",
            email: "rechnung@testfirma.de",
          },
        }),
      );
    });

    it("transformiert line_items und normalisiert vat_rate ('19%' -> 0.19, 0.07 bleibt)", async () => {
      mockClient.create.mockResolvedValue({ id: 302 });
      const tool = server.getTool("create_invoice")!;
      await tool.execute({
        name: "Rechnung mit Positionen",
        payment_term_id: 1,
        line_items: [
          { name: "Webentwicklung", description: "Frontend", quantity: 10, unit: "Stunde", price: 120, vat_rate: "19%" },
          { name: "Hosting", quantity: 1, price: 50, vat_rate: 0.07 },
        ],
      });
      const callArgs = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      const items = callArgs.line_items as Array<Record<string, unknown>>;
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        name: "Webentwicklung",
        description: "Frontend",
        quantity: 10,
        unit: "Stunde",
        price: 120,
        vat_rate: 0.19,
      });
      expect(items[1]).toMatchObject({
        name: "Hosting",
        quantity: 1,
        price: 50,
        vat_rate: 0.07,
      });
    });
  });

  // ========== update_invoice ==========
  describe("update_invoice", () => {
    it("trennt id und baut URL-Pfad", async () => {
      mockClient.update.mockResolvedValue({ id: 300 });
      const tool = server.getTool("update_invoice")!;
      await tool.execute({ id: 300, name: "Aktualisierte Rechnung" });
      expect(mockClient.update).toHaveBeenCalledWith(
        "/income/invoices/300",
        expect.objectContaining({ name: "Aktualisierte Rechnung" }),
      );
      // id darf nicht im Body sein
      const callArgs = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs).not.toHaveProperty("id");
    });

    it("verschachtelt payment_term, customer und billing korrekt", async () => {
      mockClient.update.mockResolvedValue({ id: 300 });
      const tool = server.getTool("update_invoice")!;
      await tool.execute({
        id: 300,
        payment_term_id: 3,
        customer_id: 100,
        contact_person_id: 200,
        billing_company: "Neue Firma",
        billing_city: "Hamburg",
      });
      expect(mockClient.update).toHaveBeenCalledWith(
        "/income/invoices/300",
        expect.objectContaining({
          payment_term: { id: 3 },
          customer: {
            id: 100,
            contact_person: { id: 200 },
          },
          billing: {
            company: "Neue Firma",
            city: "Hamburg",
          },
        }),
      );
    });

    it("sendet nur vorhandene Felder im Body", async () => {
      mockClient.update.mockResolvedValue({ id: 300 });
      const tool = server.getTool("update_invoice")!;
      await tool.execute({ id: 300, flagged: true });
      const callArgs = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs).toEqual({ flagged: true });
      expect(callArgs).not.toHaveProperty("payment_term");
      expect(callArgs).not.toHaveProperty("customer");
      expect(callArgs).not.toHaveProperty("billing");
    });
  });

  // ========== delete_invoice ==========
  describe("delete_invoice", () => {
    it("ruft client.delete korrekt auf", async () => {
      const tool = server.getTool("delete_invoice")!;
      await tool.execute({ id: 301 });
      expect(mockClient.delete).toHaveBeenCalledWith("/income/invoices/301");
    });

    it("gibt Erfolgsmeldung zurueck", async () => {
      const tool = server.getTool("delete_invoice")!;
      const result = await tool.execute({ id: 301 });
      expect(result).toBe("Invoice 301 deleted successfully.");
    });
  });

  // ========== cancel_invoice ==========
  describe("cancel_invoice", () => {
    it("ruft client.post mit /cancel Pfad auf", async () => {
      mockClient.post.mockResolvedValue({ id: 300, state: "canceled" });
      const tool = server.getTool("cancel_invoice")!;
      await tool.execute({ id: 300 });
      expect(mockClient.post).toHaveBeenCalledWith("/income/invoices/300/cancel");
    });

    it("gibt JSON-Ergebnis zurueck", async () => {
      mockClient.post.mockResolvedValue({ id: 300, state: "canceled" });
      const tool = server.getTool("cancel_invoice")!;
      const result = await tool.execute({ id: 300 });
      const parsed = JSON.parse(result);
      expect(parsed.id).toBe(300);
      expect(parsed.state).toBe("canceled");
    });
  });

  // ========== archive_invoice ==========
  describe("archive_invoice", () => {
    it("ruft client.post mit /archive Pfad auf", async () => {
      mockClient.post.mockResolvedValue({ id: 300, record_state: "archived" });
      const tool = server.getTool("archive_invoice")!;
      await tool.execute({ id: 300 });
      expect(mockClient.post).toHaveBeenCalledWith("/income/invoices/300/archive");
    });

    it("gibt JSON-Ergebnis zurueck", async () => {
      mockClient.post.mockResolvedValue({ id: 300, record_state: "archived" });
      const tool = server.getTool("archive_invoice")!;
      const result = await tool.execute({ id: 300 });
      const parsed = JSON.parse(result);
      expect(parsed.id).toBe(300);
      expect(parsed.record_state).toBe("archived");
    });
  });

  // ========== send_invoice ==========
  describe("send_invoice", () => {
    it("sendet vollstaendiges email-Objekt (recipient/subject/body) bei send_via='email'", async () => {
      mockClient.post.mockResolvedValue({ id: 300, state: "sent" });
      const tool = server.getTool("send_invoice")!;
      await tool.execute({
        id: 300,
        send_via: "email",
        recipient: "test@example.com",
        subject: "Ihre Rechnung",
        body: "Anbei die Rechnung.",
      });
      expect(mockClient.post).toHaveBeenCalledWith("/income/invoices/300/deliver", {
        send_via: "email",
        email: {
          recipient: "test@example.com",
          subject: "Ihre Rechnung",
          body: "Anbei die Rechnung.",
        },
      });
    });

    it("finalisiert ohne Mailversand bei send_via='pdf' (Payload nur send_via)", async () => {
      mockClient.post.mockResolvedValue({ id: 300, state: "open", invoice_no: "2026-0042" });
      const tool = server.getTool("send_invoice")!;
      const result = await tool.execute({ id: 300, send_via: "pdf" });
      expect(mockClient.post).toHaveBeenCalledWith("/income/invoices/300/deliver", {
        send_via: "pdf",
      });
      const parsed = JSON.parse(result);
      expect(parsed.invoice_no).toBe("2026-0042");
    });

    it("verweigert send_via='email' ohne recipient/subject/body (kein stiller Default-Mail-Versand)", async () => {
      const tool = server.getTool("send_invoice")!;
      await expect(tool.execute({ id: 300, send_via: "email" })).rejects.toThrow();
      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });

  // ========== download_invoice_pdf ==========
  describe("download_invoice_pdf", () => {
    it("ruft client.getPdf mit /pdf Pfad auf", async () => {
      const tool = server.getTool("download_invoice_pdf")!;
      await tool.execute({ id: 300 });
      expect(mockClient.getPdf).toHaveBeenCalledWith("/income/invoices/300/pdf");
    });

    it("gibt base64 und content_type in Antwort zurueck", async () => {
      mockClient.getPdf.mockResolvedValue({
        base64: "JVBER0FakeBase64==",
        contentType: "application/pdf",
      });
      const tool = server.getTool("download_invoice_pdf")!;
      const result = await tool.execute({ id: 300 });
      const parsed = JSON.parse(result);
      expect(parsed.content_type).toBe("application/pdf");
      expect(parsed.base64).toBe("JVBER0FakeBase64==");
      expect(parsed.message).toContain("300");
    });

    it("gibt base64_length zurueck", async () => {
      mockClient.getPdf.mockResolvedValue({
        base64: "ABCDEF1234567890",
        contentType: "application/pdf",
      });
      const tool = server.getTool("download_invoice_pdf")!;
      const result = await tool.execute({ id: 300 });
      const parsed = JSON.parse(result);
      expect(parsed.base64_length).toBe(16);
    });
  });
});
