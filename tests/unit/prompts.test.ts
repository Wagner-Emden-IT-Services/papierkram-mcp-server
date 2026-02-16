import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockServer, type MockServer } from "../helpers/mock-server.js";
import { registerPrompts } from "../../src/core/prompts.js";

describe("Prompt Templates", () => {
  let server: MockServer;

  beforeEach(() => {
    server = createMockServer();
    registerPrompts(server as any);
  });

  it("Registriert genau 4 Prompts", () => {
    expect(server.prompts).toHaveLength(4);
  });

  // ---- invoice_summary ----

  describe("invoice_summary", () => {
    it("Gibt Prompt ohne period-Argument zurueck", async () => {
      const prompt = server.getPrompt("invoice_summary")!;
      expect(prompt).toBeDefined();

      const result = await prompt.load({});

      expect(result).toContain("list and summarize the recent invoices from Papierkram");
      expect(result).toContain("list_invoices");
      expect(result).not.toContain("for ");
    });

    it("Gibt Prompt mit period-Argument zurueck", async () => {
      const prompt = server.getPrompt("invoice_summary")!;
      const result = await prompt.load({ period: "this month" });

      expect(result).toContain("for this month");
      expect(result).toContain("list_invoices");
    });
  });

  // ---- expense_report ----

  describe("expense_report", () => {
    it("Gibt Prompt ohne period-Argument zurueck", async () => {
      const prompt = server.getPrompt("expense_report")!;
      expect(prompt).toBeDefined();

      const result = await prompt.load({});

      expect(result).toContain("expense report from Papierkram");
      expect(result).toContain("list_expense_vouchers");
      expect(result).not.toContain("for ");
    });

    it("Gibt Prompt mit period-Argument zurueck", async () => {
      const prompt = server.getPrompt("expense_report")!;
      const result = await prompt.load({ period: "last quarter" });

      expect(result).toContain("for last quarter");
      expect(result).toContain("list_expense_vouchers");
    });
  });

  // ---- project_status ----

  describe("project_status", () => {
    it("Gibt feste Prompt-Ausgabe ohne Argumente zurueck", async () => {
      const prompt = server.getPrompt("project_status")!;
      expect(prompt).toBeDefined();

      const result = await prompt.load({});

      expect(result).toContain("status overview of all active projects");
      expect(result).toContain("list_projects");
      expect(result).toContain("list_time_entries");
      expect(result).toContain("budget utilization");
    });
  });

  // ---- customer_overview ----

  describe("customer_overview", () => {
    it("Gibt Prompt mit company_name-Argument zurueck", async () => {
      const prompt = server.getPrompt("customer_overview")!;
      expect(prompt).toBeDefined();

      const result = await prompt.load({ company_name: "Testfirma GmbH" });

      expect(result).toContain('"Testfirma GmbH"');
      expect(result).toContain("list_companies");
      expect(result).toContain("get_company");
      expect(result).toContain("list_invoices");
      expect(result).toContain("list_projects");
    });
  });
});
