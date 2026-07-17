import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockServer, type MockServer } from "../helpers/mock-server.js";

let mockClient: any;

vi.mock("../../src/api/client.js", () => ({
  getClient: () => mockClient,
}));

// MUST import AFTER vi.mock
import { registerTools } from "../../src/core/tools/index.js";
import { registerResources } from "../../src/core/resources.js";
import { registerPrompts } from "../../src/core/prompts.js";

describe("MCP-Protokoll Registrierung", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = {
      list: vi.fn().mockResolvedValue({ entries: [], has_more: false }),
      get: vi.fn().mockResolvedValue({ id: 1 }),
      create: vi.fn().mockResolvedValue({ id: 1 }),
      update: vi.fn().mockResolvedValue({ id: 1 }),
      patch: vi.fn().mockResolvedValue({ id: 1 }),
      delete: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue({ id: 1 }),
      getPdf: vi.fn().mockResolvedValue({ base64: "fake", contentType: "application/pdf" }),
    };
    server = createMockServer();
    registerTools(server as any);
    registerResources(server as any);
    registerPrompts(server as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Tools ----

  it("Registriert alle 56 Tools", () => {
    expect(server.tools).toHaveLength(56);
  });

  it("Alle Tool-Namen folgen der verb_noun Konvention", () => {
    const verbNounPattern = /^[a-z]+_[a-z_]+$/;
    for (const tool of server.tools) {
      expect(tool.name, `Tool "${tool.name}" folgt nicht der verb_noun Konvention`).toMatch(verbNounPattern);
    }
  });

  it("Kein doppelter Tool-Name vorhanden", () => {
    const names = server.tools.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("Jedes Tool hat eine description", () => {
    for (const tool of server.tools) {
      expect(tool.description, `Tool "${tool.name}" hat keine description`).toBeTruthy();
      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  it("Jedes Tool deklariert MCP-Annotations (openWorldHint immer true)", () => {
    for (const tool of server.tools) {
      const ann = (tool as unknown as { annotations?: Record<string, unknown> }).annotations;
      expect(ann, `Tool "${tool.name}" hat keine annotations`).toBeTruthy();
      expect(ann!.openWorldHint, `Tool "${tool.name}" openWorldHint`).toBe(true);
      expect(typeof ann!.readOnlyHint, `Tool "${tool.name}" readOnlyHint`).toBe("boolean");
      expect(typeof ann!.destructiveHint, `Tool "${tool.name}" destructiveHint`).toBe("boolean");
    }
  });

  it("Read-Tools sind readOnly, Delete/Cancel sind destruktiv", () => {
    const get = (name: string) => (server.tools.find((t) => t.name === name) as unknown as { annotations: Record<string, boolean> }).annotations;
    expect(get("list_invoices").readOnlyHint).toBe(true);
    expect(get("get_company").readOnlyHint).toBe(true);
    expect(get("delete_invoice").destructiveHint).toBe(true);
    expect(get("cancel_invoice").destructiveHint).toBe(true);
    // send_invoice finalisiert -> nicht read-only, destruktiv
    expect(get("send_invoice").readOnlyHint).toBe(false);
    expect(get("send_invoice").destructiveHint).toBe(true);
  });

  it("Bestimmte erwartete Tool-Namen existieren (Stichprobe)", () => {
    const expectedTools = [
      // Contacts
      "list_companies", "get_company", "create_company", "update_company", "delete_company",
      "list_contact_persons", "get_contact_person", "create_contact_person",
      // Invoices
      "list_invoices", "get_invoice", "create_invoice", "cancel_invoice",
      "send_invoice", "download_invoice_pdf", "archive_invoice",
      // Estimates
      "list_estimates", "get_estimate", "create_estimate", "send_estimate", "download_estimate_pdf",
      // Expenses
      "list_expense_vouchers", "get_expense_voucher", "create_expense_voucher",
      // Banking
      "list_bank_connections", "get_bank_connection", "list_bank_transactions", "get_bank_transaction",
      // Projects
      "list_projects", "get_project", "create_project", "archive_project", "unarchive_project",
      // Tracker
      "list_time_entries", "get_time_entry", "create_time_entry",
      "list_tasks", "get_task", "create_task",
      // Info
      "get_account_info", "list_payment_terms", "list_propositions", "get_proposition",
    ];

    const registeredNames = new Set(server.tools.map((t) => t.name));

    for (const name of expectedTools) {
      expect(registeredNames, `Tool "${name}" fehlt`).toContain(name);
    }
  });

  // ---- Resource Templates ----

  it("Registriert genau 3 Resource Templates", () => {
    expect(server.resourceTemplates).toHaveLength(3);

    const names = server.resourceTemplates.map((r) => r.name);
    expect(names).toContain("Papierkram Company");
    expect(names).toContain("Papierkram Invoice");
    expect(names).toContain("Papierkram Project");
  });

  // ---- Prompts ----

  it("Registriert genau 4 Prompts", () => {
    expect(server.prompts).toHaveLength(4);
  });

  it("Bestimmte erwartete Prompt-Namen existieren", () => {
    const expectedPrompts = [
      "invoice_summary",
      "expense_report",
      "project_status",
      "customer_overview",
    ];

    const registeredNames = new Set(server.prompts.map((p) => p.name));

    for (const name of expectedPrompts) {
      expect(registeredNames, `Prompt "${name}" fehlt`).toContain(name);
    }
  });
});
