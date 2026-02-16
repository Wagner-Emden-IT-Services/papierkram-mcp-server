import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;

vi.mock("../../../src/api/client.js", () => ({
  getClient: () => mockClient,
}));

// MUST import AFTER vi.mock
import { registerContactTools } from "../../../src/core/tools/contacts.js";

describe("Kontakt-Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerContactTools(server as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- list_companies ----

  describe("list_companies", () => {
    it("Ruft client.list mit korrektem Pfad auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.companyList);

      const tool = server.getTool("list_companies")!;
      await tool.execute({ page_size: 25, compact: true });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/contact/companies",
        { page_size: 25 }
      );
    });

    it("Gibt compact-Modus Ergebnis zurueck (default compact=true)", async () => {
      mockClient.list.mockResolvedValue(fixtures.companyList);

      const tool = server.getTool("list_companies")!;
      const result = await tool.execute({ page_size: 25, compact: true });
      const parsed = JSON.parse(result);

      // Compact: nur id, name, contact_type, email + customer_no/supplier_no
      expect(parsed.entries).toHaveLength(2);
      expect(parsed.entries[0]).toEqual({
        id: 100,
        name: "Testfirma GmbH",
        contact_type: "customer",
        email: "info@testfirma.de",
        customer_no: "K-001",
      });
      // supplier_no ist null -> wird nicht aufgenommen
      expect(parsed.entries[0]).not.toHaveProperty("supplier_no");
      // Pagination bleibt erhalten
      expect(parsed.has_more).toBe(false);
      expect(parsed.total_entries).toBe(2);
    });

    it("Gibt volles Ergebnis zurueck bei compact=false", async () => {
      mockClient.list.mockResolvedValue(fixtures.companyList);

      const tool = server.getTool("list_companies")!;
      const result = await tool.execute({ page_size: 25, compact: false });
      const parsed = JSON.parse(result);

      // Volle Antwort = identisch mit Fixture
      expect(parsed).toEqual(fixtures.companyList);
    });
  });

  // ---- get_company ----

  describe("get_company", () => {
    it("Ruft client.get mit korrekter ID auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.company);

      const tool = server.getTool("get_company")!;
      await tool.execute({ id: 100 });

      expect(mockClient.get).toHaveBeenCalledWith("/contact/companies/100");
    });

    it("Gibt JSON-String zurueck", async () => {
      mockClient.get.mockResolvedValue(fixtures.company);

      const tool = server.getTool("get_company")!;
      const result = await tool.execute({ id: 100 });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe(100);
      expect(parsed.name).toBe("Testfirma GmbH");
      expect(parsed.contact_type).toBe("customer");
    });
  });

  // ---- create_company ----

  describe("create_company", () => {
    it("Sendet alle Parameter an client.create", async () => {
      const newCompany = { contact_type: "customer" as const, name: "Neue GmbH", email: "info@neue.de" };
      mockClient.create.mockResolvedValue({ id: 102, ...newCompany });

      const tool = server.getTool("create_company")!;
      await tool.execute(newCompany);

      expect(mockClient.create).toHaveBeenCalledWith(
        "/contact/companies",
        newCompany
      );
    });

    it("Baut korrekten API-Pfad", async () => {
      mockClient.create.mockResolvedValue({ id: 103, contact_type: "supplier", name: "Lieferant Neu" });

      const tool = server.getTool("create_company")!;
      await tool.execute({ contact_type: "supplier", name: "Lieferant Neu" });

      expect(mockClient.create.mock.calls[0][0]).toBe("/contact/companies");
    });
  });

  // ---- update_company ----

  describe("update_company", () => {
    it("Trennt id vom Body und nutzt URL-Pfad", async () => {
      mockClient.update.mockResolvedValue({ id: 100, name: "Umbenannt GmbH" });

      const tool = server.getTool("update_company")!;
      await tool.execute({ id: 100, name: "Umbenannt GmbH" });

      expect(mockClient.update).toHaveBeenCalledWith(
        "/contact/companies/100",
        { name: "Umbenannt GmbH" }
      );
    });

    it("Sendet restliche Felder als Body", async () => {
      mockClient.update.mockResolvedValue({ id: 100, email: "neu@test.de", phone: "+49 30 55555" });

      const tool = server.getTool("update_company")!;
      await tool.execute({ id: 100, email: "neu@test.de", phone: "+49 30 55555" });

      const callBody = mockClient.update.mock.calls[0][1];
      expect(callBody).toEqual({ email: "neu@test.de", phone: "+49 30 55555" });
      // id darf NICHT im Body sein
      expect(callBody).not.toHaveProperty("id");
    });
  });

  // ---- delete_company ----

  describe("delete_company", () => {
    it("Ruft client.delete mit korrektem Pfad auf", async () => {
      const tool = server.getTool("delete_company")!;
      await tool.execute({ id: 100 });

      expect(mockClient.delete).toHaveBeenCalledWith("/contact/companies/100");
    });

    it("Gibt Erfolgsmeldung als String zurueck", async () => {
      const tool = server.getTool("delete_company")!;
      const result = await tool.execute({ id: 100 });

      expect(result).toBe("Company 100 deleted successfully.");
    });
  });

  // ---- list_contact_persons ----

  describe("list_contact_persons", () => {
    it("Baut URL mit company_id: /contact/companies/{company_id}/persons", async () => {
      mockClient.list.mockResolvedValue(fixtures.contactPersonList);

      const tool = server.getTool("list_contact_persons")!;
      await tool.execute({ company_id: 100, page_size: 25, compact: true });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/contact/companies/100/persons",
        { page_size: 25 }
      );
    });

    it("Unterstuetzt compact-Modus", async () => {
      mockClient.list.mockResolvedValue(fixtures.contactPersonList);

      const tool = server.getTool("list_contact_persons")!;
      const result = await tool.execute({ company_id: 100, page_size: 25, compact: true });
      const parsed = JSON.parse(result);

      // Compact: id, first_name, last_name, email, position
      expect(parsed.entries).toHaveLength(1);
      expect(parsed.entries[0]).toEqual({
        id: 200,
        first_name: "Max",
        last_name: "Mustermann",
        email: "max@testfirma.de",
        position: "Geschaeftsfuehrer",
      });
    });
  });

  // ---- get_contact_person ----

  describe("get_contact_person", () => {
    it("Baut URL mit company_id und id", async () => {
      mockClient.get.mockResolvedValue(fixtures.contactPerson);

      const tool = server.getTool("get_contact_person")!;
      await tool.execute({ company_id: 100, id: 200 });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/contact/companies/100/persons/200"
      );
    });

    it("Gibt JSON-String zurueck", async () => {
      mockClient.get.mockResolvedValue(fixtures.contactPerson);

      const tool = server.getTool("get_contact_person")!;
      const result = await tool.execute({ company_id: 100, id: 200 });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe(200);
      expect(parsed.first_name).toBe("Max");
      expect(parsed.last_name).toBe("Mustermann");
    });
  });

  // ---- create_contact_person ----

  describe("create_contact_person", () => {
    it("Trennt company_id fuer URL, Rest als Body", async () => {
      const params = {
        company_id: 100,
        first_name: "Lisa",
        last_name: "Mueller",
        email: "lisa@testfirma.de",
        position: "Buchhaltung",
      };
      mockClient.create.mockResolvedValue({ id: 201, ...params });

      const tool = server.getTool("create_contact_person")!;
      await tool.execute(params);

      expect(mockClient.create).toHaveBeenCalledWith(
        "/contact/companies/100/persons",
        {
          first_name: "Lisa",
          last_name: "Mueller",
          email: "lisa@testfirma.de",
          position: "Buchhaltung",
        }
      );
    });

    it("Sendet alle Felder korrekt", async () => {
      const params = {
        company_id: 100,
        first_name: "Hans",
        last_name: "Schmidt",
        title: "Dr.",
        salutation: "Herr",
        phone: "+49 30 11111",
        mobile: "+49 170 22222",
        email: "hans@testfirma.de",
      };
      mockClient.create.mockResolvedValue({ id: 202, ...params });

      const tool = server.getTool("create_contact_person")!;
      await tool.execute(params);

      const callBody = mockClient.create.mock.calls[0][1];
      // company_id darf NICHT im Body sein
      expect(callBody).not.toHaveProperty("company_id");
      // Alle anderen Felder muessen vorhanden sein
      expect(callBody).toHaveProperty("first_name", "Hans");
      expect(callBody).toHaveProperty("last_name", "Schmidt");
      expect(callBody).toHaveProperty("title", "Dr.");
      expect(callBody).toHaveProperty("salutation", "Herr");
      expect(callBody).toHaveProperty("phone", "+49 30 11111");
      expect(callBody).toHaveProperty("mobile", "+49 170 22222");
      expect(callBody).toHaveProperty("email", "hans@testfirma.de");
    });
  });

  // ---- update_contact_person ----

  describe("update_contact_person", () => {
    it("Baut URL mit company_id und id", async () => {
      mockClient.update.mockResolvedValue({ id: 200, position: "CEO" });

      const tool = server.getTool("update_contact_person")!;
      await tool.execute({ company_id: 100, id: 200, position: "CEO" });

      expect(mockClient.update).toHaveBeenCalledWith(
        "/contact/companies/100/persons/200",
        { position: "CEO" }
      );
    });

    it("Sendet nur geaenderte Felder", async () => {
      mockClient.update.mockResolvedValue({ id: 200, email: "max.neu@testfirma.de" });

      const tool = server.getTool("update_contact_person")!;
      await tool.execute({ company_id: 100, id: 200, email: "max.neu@testfirma.de" });

      const callBody = mockClient.update.mock.calls[0][1];
      expect(callBody).toEqual({ email: "max.neu@testfirma.de" });
      // company_id und id duerfen NICHT im Body sein
      expect(callBody).not.toHaveProperty("company_id");
      expect(callBody).not.toHaveProperty("id");
    });
  });

  // ---- delete_contact_person ----

  describe("delete_contact_person", () => {
    it("Baut URL mit company_id und id", async () => {
      const tool = server.getTool("delete_contact_person")!;
      await tool.execute({ company_id: 100, id: 200 });

      expect(mockClient.delete).toHaveBeenCalledWith(
        "/contact/companies/100/persons/200"
      );
    });

    it("Gibt Erfolgsmeldung zurueck", async () => {
      const tool = server.getTool("delete_contact_person")!;
      const result = await tool.execute({ company_id: 100, id: 200 });

      expect(result).toBe("Contact person 200 deleted successfully.");
    });
  });
});
