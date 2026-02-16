import { describe, it, expect } from "vitest";
import {
  compactCompany,
  compactContactPerson,
  compactInvoice,
  compactEstimate,
  compactExpenseVoucher,
  compactProject,
  compactTimeEntry,
  compactTask,
  compactBankConnection,
  compactBankTransaction,
  compactList,
} from "../../../src/api/transformers.js";
import { fixtures } from "../../helpers/fixtures.js";

describe("Compact Transformers", () => {
  // ---- compactCompany ----
  describe("compactCompany", () => {
    it("extrahiert Basis-Felder", () => {
      const result = compactCompany(fixtures.company);
      expect(result).toHaveProperty("id", 100);
      expect(result).toHaveProperty("name", "Testfirma GmbH");
      expect(result).toHaveProperty("contact_type", "customer");
      expect(result).toHaveProperty("email", "info@testfirma.de");
    });

    it("inkludiert customer_no wenn vorhanden", () => {
      const result = compactCompany(fixtures.company);
      expect(result).toHaveProperty("customer_no", "K-001");
    });

    it("inkludiert supplier_no wenn vorhanden", () => {
      const supplier = { ...fixtures.company, supplier_no: "L-005", customer_no: null };
      const result = compactCompany(supplier);
      expect(result).toHaveProperty("supplier_no", "L-005");
    });

    it("laesst customer_no weg wenn null/falsy", () => {
      const item = { ...fixtures.company, customer_no: null };
      const result = compactCompany(item);
      expect(result).not.toHaveProperty("customer_no");
    });

    it("laesst supplier_no weg wenn null/falsy", () => {
      const result = compactCompany(fixtures.company);
      expect(result).not.toHaveProperty("supplier_no");
    });

    it("ignoriert unbekannte Felder", () => {
      const result = compactCompany(fixtures.company);
      expect(result).not.toHaveProperty("phone");
      expect(result).not.toHaveProperty("website");
    });
  });

  // ---- compactContactPerson ----
  describe("compactContactPerson", () => {
    it("extrahiert Basis-Felder", () => {
      const result = compactContactPerson(fixtures.contactPerson);
      expect(result).toEqual({
        id: 200,
        first_name: "Max",
        last_name: "Mustermann",
        email: "max@testfirma.de",
        position: "Geschaeftsfuehrer",
      });
    });

    it("ignoriert unbekannte Felder", () => {
      const result = compactContactPerson(fixtures.contactPerson);
      expect(result).not.toHaveProperty("phone");
    });

    it("laesst optionale Felder weg wenn undefined", () => {
      const item = { id: 201, first_name: "Erika", last_name: "Musterfrau" };
      const result = compactContactPerson(item);
      expect(result).toEqual({ id: 201, first_name: "Erika", last_name: "Musterfrau" });
      expect(result).not.toHaveProperty("email");
      expect(result).not.toHaveProperty("position");
    });
  });

  // ---- compactInvoice ----
  describe("compactInvoice", () => {
    it("extrahiert Basis-Felder", () => {
      const result = compactInvoice(fixtures.invoice);
      expect(result).toHaveProperty("id", 300);
      expect(result).toHaveProperty("name", "Testrechnung");
      expect(result).toHaveProperty("invoice_no", "RE-2025-001");
      expect(result).toHaveProperty("state", "paid");
      expect(result).toHaveProperty("document_date", "2025-01-15");
      expect(result).toHaveProperty("due_date", "2025-02-15");
      expect(result).toHaveProperty("total_gross", "1190.00");
      expect(result).toHaveProperty("customer_no", "K-001");
    });

    it("extrahiert billing_company aus billing.company", () => {
      const result = compactInvoice(fixtures.invoice);
      expect(result).toHaveProperty("billing_company", "Testfirma GmbH");
    });

    it("laesst billing_company weg wenn kein billing", () => {
      const item = { ...fixtures.invoice };
      delete (item as Record<string, unknown>).billing;
      const result = compactInvoice(item);
      expect(result).not.toHaveProperty("billing_company");
    });

    it("laesst billing_company weg wenn billing.company fehlt", () => {
      const item = { ...fixtures.invoice, billing: { street: "Teststr. 1" } };
      const result = compactInvoice(item);
      expect(result).not.toHaveProperty("billing_company");
    });

    it("entfernt verschachtelte billing-Details", () => {
      const result = compactInvoice(fixtures.invoice);
      expect(result).not.toHaveProperty("billing");
    });
  });

  // ---- compactEstimate ----
  describe("compactEstimate", () => {
    it("extrahiert Basis-Felder", () => {
      const result = compactEstimate(fixtures.estimate);
      expect(result).toHaveProperty("id", 400);
      expect(result).toHaveProperty("name", "Testangebot");
      expect(result).toHaveProperty("estimate_no", "AN-2025-001");
      expect(result).toHaveProperty("state", "accepted");
      expect(result).toHaveProperty("document_date", "2025-01-10");
      expect(result).toHaveProperty("total_gross", "2380.00");
      expect(result).toHaveProperty("customer_no", "K-001");
    });

    it("extrahiert billing_company aus billing.company", () => {
      const result = compactEstimate(fixtures.estimate);
      expect(result).toHaveProperty("billing_company", "Testfirma GmbH");
    });

    it("laesst billing_company weg wenn kein billing", () => {
      const item = { id: 400, name: "Ohne Billing", estimate_no: "AN-X", state: "draft", document_date: "2025-01-01", total_gross: "0.00", customer_no: "K-002" };
      const result = compactEstimate(item);
      expect(result).not.toHaveProperty("billing_company");
    });

    it("laesst billing_company weg wenn billing.company fehlt", () => {
      const item = { ...fixtures.estimate, billing: { city: "Hamburg" } };
      const result = compactEstimate(item);
      expect(result).not.toHaveProperty("billing_company");
    });
  });

  // ---- compactExpenseVoucher ----
  describe("compactExpenseVoucher", () => {
    it("extrahiert Basis-Felder", () => {
      const result = compactExpenseVoucher(fixtures.expenseVoucher);
      expect(result).toEqual({
        id: 500,
        name: "Buerokosten Januar",
        voucher_no: "AB-2025-001",
        state: "created",
        document_date: "2025-01-20",
        due_date: "2025-02-20",
        amount: "250.00",
      });
    });

    it("ignoriert unbekannte Felder", () => {
      const result = compactExpenseVoucher(fixtures.expenseVoucher);
      expect(result).not.toHaveProperty("provenance");
    });
  });

  // ---- compactProject ----
  describe("compactProject", () => {
    it("extrahiert Basis-Felder", () => {
      const result = compactProject(fixtures.project);
      expect(result).toEqual({
        id: 600,
        name: "Webseite Redesign",
        record_state: "active",
        start_date: "2025-01-01",
        end_date: "2025-06-30",
        company_id: 100,
      });
    });

    it("ignoriert unbekannte Felder", () => {
      const result = compactProject(fixtures.project);
      expect(result).not.toHaveProperty("description");
    });
  });

  // ---- compactTimeEntry ----
  describe("compactTimeEntry", () => {
    it("extrahiert Basis-Felder", () => {
      const result = compactTimeEntry(fixtures.timeEntry);
      expect(result).toEqual({
        id: 700,
        started_at: "2025-01-15T09:00:00+01:00",
        ended_at: "2025-01-15T11:30:00+01:00",
        duration: 9000,
        comments: "Frontend-Entwicklung",
        task_id: 800,
        project_id: 600,
      });
    });

    it("laesst optionale Felder weg wenn undefined", () => {
      const item = { id: 701, started_at: "2025-02-01T08:00:00+01:00", ended_at: "2025-02-01T09:00:00+01:00", duration: 3600 };
      const result = compactTimeEntry(item);
      expect(result).toEqual({
        id: 701,
        started_at: "2025-02-01T08:00:00+01:00",
        ended_at: "2025-02-01T09:00:00+01:00",
        duration: 3600,
      });
      expect(result).not.toHaveProperty("comments");
      expect(result).not.toHaveProperty("task_id");
      expect(result).not.toHaveProperty("project_id");
    });
  });

  // ---- compactTask ----
  describe("compactTask", () => {
    it("extrahiert Basis-Felder", () => {
      const result = compactTask(fixtures.task);
      expect(result).toEqual({
        id: 800,
        name: "Header implementieren",
        complete: "75",
        deadline: "2025-03-01",
        project_id: 600,
      });
    });

    it("ignoriert unbekannte Felder", () => {
      const result = compactTask(fixtures.task);
      expect(result).not.toHaveProperty("flagged");
    });
  });

  // ---- compactBankConnection ----
  describe("compactBankConnection", () => {
    it("extrahiert nur id und name", () => {
      const result = compactBankConnection(fixtures.bankConnection);
      expect(result).toEqual({ id: 900, name: "Geschaeftskonto Sparkasse" });
    });

    it("ignoriert zusaetzliche Felder", () => {
      const item = { id: 902, name: "Konto X", iban: "DE89370400440532013000", bic: "COBADEFFXXX" };
      const result = compactBankConnection(item);
      expect(result).toEqual({ id: 902, name: "Konto X" });
      expect(result).not.toHaveProperty("iban");
      expect(result).not.toHaveProperty("bic");
    });
  });

  // ---- compactBankTransaction ----
  describe("compactBankTransaction", () => {
    it("extrahiert Basis-Felder", () => {
      const result = compactBankTransaction(fixtures.bankTransaction);
      expect(result).toHaveProperty("id", 1000);
      expect(result).toHaveProperty("value", "-150.00");
      expect(result).toHaveProperty("state", "imported");
      expect(result).toHaveProperty("bdate", "2025-01-18");
      expect(result).toHaveProperty("usage", "Buerobedarf Amazon");
    });

    it("extrahiert from_name aus from.name", () => {
      const result = compactBankTransaction(fixtures.bankTransaction);
      expect(result).toHaveProperty("from_name", "Amazon EU S.a.r.l.");
    });

    it("laesst from_name weg wenn kein from-Objekt", () => {
      const item = { id: 1002, value: "500.00", state: "imported", bdate: "2025-02-01", usage: "Zahlung" };
      const result = compactBankTransaction(item);
      expect(result).not.toHaveProperty("from_name");
      expect(result).not.toHaveProperty("from");
    });

    it("laesst from_name weg wenn from.name fehlt", () => {
      const item = { ...fixtures.bankTransaction, from: { iban: "DE1234" } };
      const result = compactBankTransaction(item);
      expect(result).not.toHaveProperty("from_name");
    });
  });

  // ---- compactList ----
  describe("compactList", () => {
    it("transformiert entries Array", () => {
      const result = compactList(fixtures.companyList, compactCompany);
      expect(result).toHaveProperty("entries");
      const entries = result.entries as Record<string, unknown>[];
      expect(entries).toHaveLength(2);
      expect(entries[0]).toHaveProperty("id", 100);
      expect(entries[0]).toHaveProperty("name", "Testfirma GmbH");
      expect(entries[0]).not.toHaveProperty("phone");
    });

    it("transformiert data Array", () => {
      const response = {
        data: [
          { id: 100, name: "Testfirma GmbH", contact_type: "customer", email: "info@test.de", customer_no: "K-001", phone: "+49 123" },
        ],
        has_more: false,
        page: 1,
      };
      const result = compactList(response, compactCompany);
      expect(result).toHaveProperty("data");
      const data = result.data as Record<string, unknown>[];
      expect(data).toHaveLength(1);
      expect(data[0]).not.toHaveProperty("phone");
      expect(data[0]).toHaveProperty("customer_no", "K-001");
    });

    it("gibt Original zurueck wenn kein Array", () => {
      const response = { message: "not found", status: 404 };
      const result = compactList(response, compactCompany);
      expect(result).toEqual(response);
    });

    it("bewahrt Paginierungs-Metadaten", () => {
      const result = compactList(fixtures.invoiceList, compactInvoice);
      expect(result).toHaveProperty("has_more", false);
      expect(result).toHaveProperty("page", 1);
      expect(result).toHaveProperty("total_pages", 1);
      expect(result).toHaveProperty("total_entries", 2);
    });

    it("verarbeitet leeres entries Array", () => {
      const response = { entries: [], has_more: false, page: 1, total_pages: 0, total_entries: 0 };
      const result = compactList(response, compactInvoice);
      expect(result).toHaveProperty("entries");
      expect(result.entries).toEqual([]);
      expect(result).toHaveProperty("has_more", false);
      expect(result).toHaveProperty("total_entries", 0);
    });
  });
});
