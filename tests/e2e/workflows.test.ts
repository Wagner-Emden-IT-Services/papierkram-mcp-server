import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockClient, type MockClient } from "../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../helpers/mock-server.js";
import { fixtures } from "../helpers/fixtures.js";

let mockClient: MockClient;

vi.mock("../../src/api/client.js", () => ({
  getClient: () => mockClient,
}));

// MUST import AFTER vi.mock
import { registerTools } from "../../src/core/tools/index.js";

describe("End-to-End Workflows", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerTools(server as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- 1. Rechnungs-Workflow ----

  describe("Rechnungs-Workflow: create_invoice -> get_invoice -> cancel_invoice", () => {
    it("Erstellt, liest und storniert eine Rechnung", async () => {
      const createdInvoice = { id: 350, name: "Workflow-Rechnung", state: "draft", invoice_no: null, document_date: "2025-03-01", total_gross: "500.00" };
      const fetchedInvoice = { ...createdInvoice, billing: { company: "Testfirma GmbH" }, line_items: [{ name: "Beratung", quantity: 5, price: 100, vat_rate: "19%" }] };
      const cancelledInvoice = { ...fetchedInvoice, state: "cancelled", invoice_no: "RE-2025-010" };

      // Schritt 1: Rechnung erstellen
      mockClient.create.mockResolvedValue(createdInvoice);
      const createTool = server.getTool("create_invoice")!;
      const createResult = await createTool.execute({
        name: "Workflow-Rechnung",
        payment_term_id: 2,
        customer_id: 100,
        line_items: [{ name: "Beratung", quantity: 5, price: 100, vat_rate: "19%" }],
      });
      const created = JSON.parse(createResult);
      expect(created.id).toBe(350);
      expect(created.state).toBe("draft");
      expect(mockClient.create).toHaveBeenCalledWith("/income/invoices", expect.objectContaining({
        name: "Workflow-Rechnung",
        payment_term: { id: 2 },
        customer: { id: 100 },
      }));

      // Schritt 2: Rechnung abrufen
      mockClient.get.mockResolvedValue(fetchedInvoice);
      const getTool = server.getTool("get_invoice")!;
      const getResult = await getTool.execute({ id: 350 });
      const fetched = JSON.parse(getResult);
      expect(fetched.id).toBe(350);
      expect(fetched.line_items).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith("/income/invoices/350");

      // Schritt 3: Rechnung stornieren
      mockClient.post.mockResolvedValue(cancelledInvoice);
      const cancelTool = server.getTool("cancel_invoice")!;
      const cancelResult = await cancelTool.execute({ id: 350 });
      const cancelled = JSON.parse(cancelResult);
      expect(cancelled.state).toBe("cancelled");
      expect(mockClient.post).toHaveBeenCalledWith("/income/invoices/350/cancel");
    });
  });

  // ---- 2. Kunden-Workflow ----

  describe("Kunden-Workflow: create_company -> create_contact_person -> list_contact_persons", () => {
    it("Erstellt Firma mit Ansprechpartner und listet Kontakte", async () => {
      const createdCompany = { id: 110, name: "Workflow GmbH", contact_type: "customer", email: "info@workflow.de" };
      const createdPerson = { id: 210, first_name: "Anna", last_name: "Workflow", email: "anna@workflow.de", position: "CEO" };
      const personList = {
        entries: [createdPerson],
        has_more: false,
        page: 1,
        total_pages: 1,
        total_entries: 1,
      };

      // Schritt 1: Firma erstellen
      mockClient.create.mockResolvedValue(createdCompany);
      const createCompanyTool = server.getTool("create_company")!;
      const companyResult = await createCompanyTool.execute({
        contact_type: "customer",
        name: "Workflow GmbH",
        email: "info@workflow.de",
      });
      const company = JSON.parse(companyResult);
      expect(company.id).toBe(110);
      expect(mockClient.create).toHaveBeenCalledWith("/contact/companies", {
        contact_type: "customer",
        name: "Workflow GmbH",
        email: "info@workflow.de",
      });

      // Schritt 2: Ansprechpartner erstellen
      mockClient.create.mockResolvedValue(createdPerson);
      const createPersonTool = server.getTool("create_contact_person")!;
      const personResult = await createPersonTool.execute({
        company_id: 110,
        first_name: "Anna",
        last_name: "Workflow",
        email: "anna@workflow.de",
        position: "CEO",
      });
      const person = JSON.parse(personResult);
      expect(person.id).toBe(210);
      expect(mockClient.create).toHaveBeenCalledWith("/contact/companies/110/persons", {
        first_name: "Anna",
        last_name: "Workflow",
        email: "anna@workflow.de",
        position: "CEO",
      });

      // Schritt 3: Kontakte auflisten
      mockClient.list.mockResolvedValue(personList);
      const listPersonsTool = server.getTool("list_contact_persons")!;
      const listResult = await listPersonsTool.execute({ company_id: 110, page_size: 25, compact: false });
      const list = JSON.parse(listResult);
      expect(list.entries).toHaveLength(1);
      expect(list.entries[0].first_name).toBe("Anna");
      expect(mockClient.list).toHaveBeenCalledWith("/contact/companies/110/persons", { page_size: 25 });
    });
  });

  // ---- 3. Projekt-Workflow ----

  describe("Projekt-Workflow: create_project -> create_task -> create_time_entry", () => {
    it("Erstellt Projekt mit Aufgabe und Zeiteintrag", async () => {
      const createdProject = { id: 610, name: "Workflow-Projekt", record_state: "active", start_date: "2025-03-01" };
      const createdTask = { id: 810, name: "Umsetzung", complete: "0", project_id: 610 };
      const createdEntry = { id: 710, started_at: "2025-03-01T09:00:00+01:00", ended_at: "2025-03-01T12:00:00+01:00", duration: 10800, task_id: 810, project_id: 610 };

      // Schritt 1: Projekt erstellen
      mockClient.create.mockResolvedValue(createdProject);
      const createProjectTool = server.getTool("create_project")!;
      const projectResult = await createProjectTool.execute({
        name: "Workflow-Projekt",
        start_date: "2025-03-01",
        customer_id: 100,
      });
      const project = JSON.parse(projectResult);
      expect(project.id).toBe(610);
      expect(mockClient.create).toHaveBeenCalledWith("/projects", {
        name: "Workflow-Projekt",
        start_date: "2025-03-01",
        customer: { id: 100 },
      });

      // Schritt 2: Aufgabe erstellen
      mockClient.create.mockResolvedValue(createdTask);
      const createTaskTool = server.getTool("create_task")!;
      const taskResult = await createTaskTool.execute({
        name: "Umsetzung",
        project_id: 610,
        complete: 0,
      });
      const task = JSON.parse(taskResult);
      expect(task.id).toBe(810);
      expect(mockClient.create).toHaveBeenCalledWith("/tracker/tasks", {
        name: "Umsetzung",
        project: { id: 610 },
        complete: "0",
      });

      // Schritt 3: Zeiteintrag erstellen
      mockClient.create.mockResolvedValue(createdEntry);
      const createEntryTool = server.getTool("create_time_entry")!;
      const entryResult = await createEntryTool.execute({
        entry_date: "2025-03-01",
        started_at_time: "09:00",
        ended_at_time: "12:00",
        comments: "Feature-Entwicklung",
        task_id: 810,
        user_id: 1,
      });
      const entry = JSON.parse(entryResult);
      expect(entry.id).toBe(710);
      expect(entry.duration).toBe(10800);
      expect(mockClient.create).toHaveBeenCalledWith("/tracker/time_entries", {
        entry_date: "2025-03-01",
        started_at_time: "09:00",
        ended_at_time: "12:00",
        comments: "Feature-Entwicklung",
        task: { id: 810 },
        user: { id: 1 },
      });
    });
  });

  // ---- 4. Angebots-Workflow ----

  describe("Angebots-Workflow: create_estimate -> send_estimate", () => {
    it("Erstellt und versendet ein Angebot", async () => {
      const createdEstimate = { id: 410, name: "Workflow-Angebot", state: "draft", estimate_no: null, document_date: "2025-03-01", total_gross: "3000.00" };
      const sentEstimate = { ...createdEstimate, state: "sent" };

      // Schritt 1: Angebot erstellen
      mockClient.create.mockResolvedValue(createdEstimate);
      const createTool = server.getTool("create_estimate")!;
      const createResult = await createTool.execute({
        name: "Workflow-Angebot",
        document_date: "2025-03-01",
        customer_id: 100,
        line_items: [
          { name: "Webentwicklung", quantity: 20, price: 120, vat_rate: "19%", unit: "Stunde" },
          { name: "Design", quantity: 5, price: 100, vat_rate: "19%", unit: "Stunde" },
        ],
      });
      const created = JSON.parse(createResult);
      expect(created.id).toBe(410);
      expect(created.state).toBe("draft");
      expect(mockClient.create).toHaveBeenCalledWith("/income/estimates", expect.objectContaining({
        name: "Workflow-Angebot",
        document_date: "2025-03-01",
        customer: { id: 100 },
        line_items: expect.arrayContaining([
          expect.objectContaining({ name: "Webentwicklung", quantity: 20, price: 120 }),
        ]),
      }));

      // Schritt 2: Angebot per E-Mail versenden
      mockClient.post.mockResolvedValue(sentEstimate);
      const sendTool = server.getTool("send_estimate")!;
      const sendResult = await sendTool.execute({
        id: 410,
        send_via: "email",
        recipient: "kunde@testfirma.de",
        subject: "Unser Angebot {{angebot.angebotsnummer}}",
        body: "Anbei unser Angebot.",
      });
      const sent = JSON.parse(sendResult);
      expect(sent.state).toBe("sent");
      expect(mockClient.post).toHaveBeenCalledWith("/income/estimates/410/deliver", {
        send_via: "email",
        email: {
          recipient: "kunde@testfirma.de",
          subject: "Unser Angebot {{angebot.angebotsnummer}}",
          body: "Anbei unser Angebot.",
        },
      });
    });
  });

  // ---- 5. Ausgaben-Workflow ----

  describe("Ausgaben-Workflow: create_expense_voucher -> get_expense_voucher -> delete_expense_voucher", () => {
    it("Erstellt, liest und loescht einen Ausgabebeleg", async () => {
      const createdVoucher = { id: 510, name: "Workflow-Ausgabe", state: "created", document_date: "2025-03-01", amount: "99.99" };
      const fetchedVoucher = { ...createdVoucher, provenance: "domestic", line_items: [{ name: "Software-Lizenz", amount: 99.99, vat_rate: "19%", category: "Sonstige betriebliche Aufwendungen" }] };

      // Schritt 1: Ausgabebeleg erstellen
      mockClient.create.mockResolvedValue(createdVoucher);
      const createTool = server.getTool("create_expense_voucher")!;
      const createResult = await createTool.execute({
        name: "Workflow-Ausgabe",
        provenance: "domestic",
        document_date: "2025-03-01",
        line_items: [{ name: "Software-Lizenz", amount: 99.99, vat_rate: "19%", category: "Sonstige betriebliche Aufwendungen" }],
      });
      const created = JSON.parse(createResult);
      expect(created.id).toBe(510);
      expect(mockClient.create).toHaveBeenCalledWith("/expense/vouchers", expect.objectContaining({
        name: "Workflow-Ausgabe",
        provenance: "domestic",
      }));

      // Schritt 2: Ausgabebeleg abrufen
      mockClient.get.mockResolvedValue(fetchedVoucher);
      const getTool = server.getTool("get_expense_voucher")!;
      const getResult = await getTool.execute({ id: 510 });
      const fetched = JSON.parse(getResult);
      expect(fetched.id).toBe(510);
      expect(fetched.provenance).toBe("domestic");
      expect(mockClient.get).toHaveBeenCalledWith("/expense/vouchers/510");

      // Schritt 3: Ausgabebeleg loeschen
      const deleteTool = server.getTool("delete_expense_voucher")!;
      const deleteResult = await deleteTool.execute({ id: 510 });
      expect(deleteResult).toBe("Expense voucher 510 deleted successfully.");
      expect(mockClient.delete).toHaveBeenCalledWith("/expense/vouchers/510");
    });
  });

  // ---- 6. Archivierungs-Workflow ----

  describe("Archivierungs-Workflow: archive_project -> unarchive_project", () => {
    it("Archiviert und reaktiviert ein Projekt", async () => {
      const archivedProject = { id: 600, name: "Webseite Redesign", record_state: "archived" };
      const unarchivedProject = { id: 600, name: "Webseite Redesign", record_state: "active" };

      // Schritt 1: Projekt archivieren
      mockClient.post.mockResolvedValue(archivedProject);
      const archiveTool = server.getTool("archive_project")!;
      const archiveResult = await archiveTool.execute({ id: 600 });
      const archived = JSON.parse(archiveResult);
      expect(archived.record_state).toBe("archived");
      expect(mockClient.post).toHaveBeenCalledWith("/projects/600/archive");

      // Schritt 2: Projekt wieder aktivieren
      mockClient.post.mockResolvedValue(unarchivedProject);
      const unarchiveTool = server.getTool("unarchive_project")!;
      const unarchiveResult = await unarchiveTool.execute({ id: 600 });
      const unarchived = JSON.parse(unarchiveResult);
      expect(unarchived.record_state).toBe("active");
      expect(mockClient.post).toHaveBeenCalledWith("/projects/600/unarchive");
    });
  });

  // ---- 7. PDF-Download-Workflow ----

  describe("PDF-Download-Workflow: get_invoice -> download_invoice_pdf", () => {
    it("Liest Rechnung und laedt PDF herunter", async () => {
      // Schritt 1: Rechnung abrufen
      mockClient.get.mockResolvedValue(fixtures.invoice);
      const getTool = server.getTool("get_invoice")!;
      const getResult = await getTool.execute({ id: 300 });
      const invoice = JSON.parse(getResult);
      expect(invoice.id).toBe(300);
      expect(invoice.state).toBe("paid");
      expect(mockClient.get).toHaveBeenCalledWith("/income/invoices/300");

      // Schritt 2: PDF herunterladen
      mockClient.getPdf.mockResolvedValue({
        base64: "JVBER0FakeBase64ContentForTest==",
        contentType: "application/pdf",
      });
      const pdfTool = server.getTool("download_invoice_pdf")!;
      const pdfResult = await pdfTool.execute({ id: 300 });
      const pdf = JSON.parse(pdfResult);
      expect(pdf.message).toContain("PDF for invoice 300");
      expect(pdf.content_type).toBe("application/pdf");
      expect(pdf.base64).toBe("JVBER0FakeBase64ContentForTest==");
      expect(pdf.base64_length).toBe("JVBER0FakeBase64ContentForTest==".length);
      expect(mockClient.getPdf).toHaveBeenCalledWith("/income/invoices/300/pdf");
    });
  });

  // ---- 8. Komplett-Workflow ----

  describe("Komplett-Workflow: Kunde -> Projekt -> Rechnung mit Verknuepfungen", () => {
    it("Erstellt Kunde, Projekt und Rechnung und prueft alle Verknuepfungen", async () => {
      const newCompany = { id: 120, name: "Komplett-Kunde GmbH", contact_type: "customer", email: "info@komplett.de", customer_no: "K-020" };
      const newProject = { id: 620, name: "Komplett-Projekt", record_state: "active", company_id: 120 };
      const newInvoice = {
        id: 360, name: "Komplett-Rechnung", state: "draft", invoice_no: null,
        document_date: "2025-03-15", total_gross: "1428.00",
        billing: { company: "Komplett-Kunde GmbH" },
      };

      // Schritt 1: Kunde erstellen
      mockClient.create.mockResolvedValue(newCompany);
      const createCompanyTool = server.getTool("create_company")!;
      const companyResult = await createCompanyTool.execute({
        contact_type: "customer",
        name: "Komplett-Kunde GmbH",
        email: "info@komplett.de",
      });
      const company = JSON.parse(companyResult);
      expect(company.id).toBe(120);

      // Schritt 2: Projekt fuer den Kunden erstellen
      mockClient.create.mockResolvedValue(newProject);
      const createProjectTool = server.getTool("create_project")!;
      const projectResult = await createProjectTool.execute({
        name: "Komplett-Projekt",
        customer_id: 120,
        start_date: "2025-03-01",
        end_date: "2025-06-30",
      });
      const project = JSON.parse(projectResult);
      expect(project.id).toBe(620);
      // Pruefe, dass customer nested korrekt aufgebaut wurde
      expect(mockClient.create).toHaveBeenCalledWith("/projects", {
        name: "Komplett-Projekt",
        customer: { id: 120 },
        start_date: "2025-03-01",
        end_date: "2025-06-30",
      });

      // Schritt 3: Rechnung fuer Kunde + Projekt erstellen
      mockClient.create.mockResolvedValue(newInvoice);
      const createInvoiceTool = server.getTool("create_invoice")!;
      const invoiceResult = await createInvoiceTool.execute({
        name: "Komplett-Rechnung",
        payment_term_id: 2,
        customer_id: 120,
        project_id: 620,
        document_date: "2025-03-15",
        billing_company: "Komplett-Kunde GmbH",
        line_items: [
          { name: "Webentwicklung", quantity: 10, price: 120, vat_rate: "19%" },
        ],
      });
      const invoice = JSON.parse(invoiceResult);
      expect(invoice.id).toBe(360);
      expect(invoice.billing.company).toBe("Komplett-Kunde GmbH");

      // Pruefe, dass die Rechnung korrekt mit Kunde und Projekt verknuepft ist
      expect(mockClient.create).toHaveBeenCalledWith("/income/invoices", expect.objectContaining({
        name: "Komplett-Rechnung",
        payment_term: { id: 2 },
        customer: { id: 120, project: { id: 620 } },
        billing: { company: "Komplett-Kunde GmbH" },
        document_date: "2025-03-15",
        line_items: [
          expect.objectContaining({ name: "Webentwicklung", quantity: 10, price: 120, vat_rate: 0.19 }),
        ],
      }));

      // Schritt 4: Rechnung abrufen und Verknuepfungen pruefen
      mockClient.get.mockResolvedValue({
        ...newInvoice,
        customer: { id: 120, name: "Komplett-Kunde GmbH" },
        project: { id: 620, name: "Komplett-Projekt" },
      });
      const getInvoiceTool = server.getTool("get_invoice")!;
      const fetchResult = await getInvoiceTool.execute({ id: 360 });
      const fetched = JSON.parse(fetchResult);
      expect(fetched.id).toBe(360);
      expect(fetched.customer.id).toBe(120);
      expect(fetched.project.id).toBe(620);
      expect(mockClient.get).toHaveBeenCalledWith("/income/invoices/360");
    });
  });
});
