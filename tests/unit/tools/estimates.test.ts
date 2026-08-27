import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerEstimateTools } from "../../../src/core/tools/estimates.js";

describe("Estimate Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    server = createMockServer();
    registerEstimateTools(server as never);
  });

  // ---- list_estimates ----

  describe("list_estimates", () => {
    it("Ruft /income/estimates mit Standardparametern auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.estimateList);
      const tool = server.getTool("list_estimates")!;
      await tool.execute({ page_size: 25, compact: true });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/estimates",
        expect.objectContaining({ page_size: 25 })
      );
    });

    it("Gibt kompakte Daten zurueck wenn compact=true (Standard)", async () => {
      mockClient.list.mockResolvedValue(fixtures.estimateList);
      const tool = server.getTool("list_estimates")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: true }));

      // Compact-Felder: id, name, estimate_no, state, document_date, total_gross, customer_no, billing_company
      expect(result.entries[0]).toHaveProperty("id", 400);
      expect(result.entries[0]).toHaveProperty("estimate_no", "AN-2025-001");
      expect(result.entries[0]).toHaveProperty("billing_company", "Testfirma GmbH");
      expect(result).toHaveProperty("has_more", false);
    });

    it("Gibt vollstaendige API-Antwort zurueck wenn compact=false", async () => {
      mockClient.list.mockResolvedValue(fixtures.estimateList);
      const tool = server.getTool("list_estimates")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: false }));

      // Volle Antwort => billing-Objekt direkt vorhanden
      expect(result.entries[0]).toHaveProperty("billing");
      expect(result.entries[0].billing).toHaveProperty("company", "Testfirma GmbH");
    });

    it("Uebergibt Filter-Parameter an API (company_id, project_id, document_date_range)", async () => {
      mockClient.list.mockResolvedValue(fixtures.estimateList);
      const tool = server.getTool("list_estimates")!;
      await tool.execute({
        page_size: 25,
        compact: true,
        company_id: 100,
        project_id: 600,
        document_date_range_start: "2025-01-01",
        document_date_range_end: "2025-12-31",
      });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/estimates",
        expect.objectContaining({
          company_id: 100,
          project_id: 600,
          document_date_range_start: "2025-01-01",
          document_date_range_end: "2025-12-31",
        })
      );
    });
  });

  // ---- get_estimate ----

  describe("get_estimate", () => {
    it("Ruft /income/estimates/{id} mit korrekter ID auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.estimate);
      const tool = server.getTool("get_estimate")!;
      const result = JSON.parse(await tool.execute({ id: 400 }));

      expect(mockClient.get).toHaveBeenCalledWith("/income/estimates/400");
      expect(result).toHaveProperty("id", 400);
      expect(result).toHaveProperty("name", "Testangebot");
    });
  });

  // ---- create_estimate ----

  describe("create_estimate", () => {
    it("Baut customer-Objekt korrekt aus customer_id, contact_person_id und project_id", async () => {
      mockClient.create.mockResolvedValue({ id: 402 });
      const tool = server.getTool("create_estimate")!;
      await tool.execute({
        name: "Neues Angebot",
        document_date: "2025-03-01",
        customer_id: 100,
        contact_person_id: 200,
        project_id: 600,
        line_items: [{ name: "Pos", quantity: 1, price: 100, vat_rate: 0.19 }],
      });

      expect(mockClient.create).toHaveBeenCalledWith(
        "/income/estimates",
        expect.objectContaining({
          name: "Neues Angebot",
          document_date: "2025-03-01",
          customer: {
            id: 100,
            contact_person: { id: 200 },
            project: { id: 600 },
          },
        })
      );
    });

    it("Sendet keinen customer-Key wenn keine IDs angegeben", async () => {
      mockClient.create.mockResolvedValue({ id: 403 });
      const tool = server.getTool("create_estimate")!;
      await tool.execute({
        name: "Angebot ohne Kunde",
        document_date: "2025-03-01",
        line_items: [{ name: "Pos", quantity: 1, price: 100, vat_rate: 0.19 }],
      });

      const callBody = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(callBody).not.toHaveProperty("customer");
      expect(callBody).toHaveProperty("document_date", "2025-03-01");
    });
  });

  // ---- update_estimate ----

  describe("update_estimate", () => {
    it("Trennt id vom Body und verschachtelt customer korrekt", async () => {
      mockClient.update.mockResolvedValue({ id: 400 });
      const tool = server.getTool("update_estimate")!;
      await tool.execute({
        id: 400,
        name: "Aktualisiertes Angebot",
        customer_id: 101,
      });

      expect(mockClient.update).toHaveBeenCalledWith(
        "/income/estimates/400",
        expect.objectContaining({
          name: "Aktualisiertes Angebot",
          customer: { id: 101 },
        })
      );
      // id darf NICHT im Body stehen
      const callBody = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(callBody).not.toHaveProperty("id");
    });
  });

  // ---- delete_estimate ----

  describe("delete_estimate", () => {
    it("Loescht unter korrektem Pfad und gibt Erfolgsmeldung zurueck", async () => {
      const tool = server.getTool("delete_estimate")!;
      const result = await tool.execute({ id: 400 });

      expect(mockClient.delete).toHaveBeenCalledWith("/income/estimates/400");
      expect(result).toContain("400");
      expect(result.toLowerCase()).toContain("deleted");
    });
  });

  // ---- send_estimate ----

  describe("send_estimate", () => {
    it("Sendet vollstaendiges email-Objekt (recipient/subject/body) bei send_via='email'", async () => {
      mockClient.post.mockResolvedValue(undefined);
      const tool = server.getTool("send_estimate")!;
      await tool.execute({
        id: 400,
        send_via: "email",
        recipient: "kunde@firma.de",
        subject: "Unser Angebot",
        body: "Anbei das Angebot.",
      });

      expect(mockClient.post).toHaveBeenCalledWith("/income/estimates/400/deliver", {
        send_via: "email",
        email: {
          recipient: "kunde@firma.de",
          subject: "Unser Angebot",
          body: "Anbei das Angebot.",
        },
      });
    });

    it("Finalisiert ohne Mailversand bei send_via='pdf'", async () => {
      mockClient.post.mockResolvedValue(undefined);
      const tool = server.getTool("send_estimate")!;
      await tool.execute({ id: 400, send_via: "pdf" });

      expect(mockClient.post).toHaveBeenCalledWith("/income/estimates/400/deliver", {
        send_via: "pdf",
      });
    });

    // Regression Issue #5, gleiche Ursache wie bei send_invoice.
    it("Liefert bei leerer deliver-Antwort das zurueckgelesene Angebot statt zu werfen", async () => {
      mockClient.post.mockResolvedValue(undefined);
      mockClient.get.mockResolvedValue({
        id: 400,
        estimate_no: "A-2026-0007",
        state: "sent",
        sent_via: "pdf",
      });
      const tool = server.getTool("send_estimate")!;
      const parsed = JSON.parse(await tool.execute({ id: 400, send_via: "pdf" }));

      expect(mockClient.get).toHaveBeenCalledWith("/income/estimates/400");
      expect(parsed.delivered).toBe(true);
      expect(parsed.estimate.estimate_no).toBe("A-2026-0007");
    });

    it("Meldet Erfolg mit Warnung, wenn nur das Zuruecklesen scheitert", async () => {
      mockClient.post.mockResolvedValue(undefined);
      mockClient.get.mockRejectedValue(new Error("boom"));
      const tool = server.getTool("send_estimate")!;
      const parsed = JSON.parse(await tool.execute({ id: 400, send_via: "pdf" }));

      expect(parsed.delivered).toBe(true);
      expect(parsed.estimate_id).toBe(400);
      expect(parsed.warning).toMatch(/get_estimate/);
    });

    it("Verweigert send_via='email' ohne recipient/subject/body", async () => {
      const tool = server.getTool("send_estimate")!;
      await expect(tool.execute({ id: 400, send_via: "email" })).rejects.toThrow();
      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });

  // ---- download_estimate_pdf ----

  describe("download_estimate_pdf", () => {
    it("Ruft /income/estimates/{id}/pdf auf und gibt base64 zurueck", async () => {
      const tool = server.getTool("download_estimate_pdf")!;
      const result = JSON.parse(await tool.execute({ id: 400 }));

      expect(mockClient.getPdf).toHaveBeenCalledWith("/income/estimates/400/pdf");
      expect(result).toHaveProperty("base64", "JVBER0FakeBase64==");
      expect(result).toHaveProperty("content_type", "application/pdf");
      expect(result).toHaveProperty("base64_length");
    });
  });
});
