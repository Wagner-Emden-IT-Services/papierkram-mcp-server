import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { toToolJson } from "../../api/format.js";
import { READ_ONLY, CREATE, UPDATE, DESTRUCTIVE, ARCHIVE, idParam, listParams } from "./_shared.js";

export function registerInfoTools(server: FastMCP) {
  server.addTool({
    name: "get_account_info",
    description: "Get account information from Papierkram (company name, plan, subscription details).",
    annotations: { title: "Get account info", ...READ_ONLY },
    parameters: z.object({}),
    execute: async () => {
      const client = getClient();
      const result = await client.get("/info");
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "list_payment_terms",
    description:
      "List payment terms (Zahlungsbedingungen). Use the returned IDs as payment_term_id when creating invoices.",
    annotations: { title: "List payment terms", ...READ_ONLY },
    parameters: z.object({
      page: z.number().int().min(1).optional().describe("Page number (1-based)"),
      page_size: z.number().int().min(1).max(100).optional().default(25).describe("Items per page (1-100, default: 25)"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/income/payment_terms", params as Record<string, string | number | boolean | undefined>);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "list_propositions",
    description:
      "List propositions (Waren/Dienstleistungen — products and services) that can be referenced in invoices and estimates.",
    annotations: { title: "List products/services", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/income/propositions", params as Record<string, string | number | boolean | undefined>);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "get_proposition",
    description: "Get a specific proposition (Ware/Dienstleistung — product/service) by ID.",
    annotations: { title: "Get product/service", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Proposition ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/income/propositions/${params.id}`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "create_proposition",
    description:
      "Create a proposition (Ware/Dienstleistung — product/service). Requires name, article_no, proposition_type, time_unit and vat_rate. Returns the created proposition with its new ID.",
    annotations: { title: "Create product/service", ...CREATE },
    parameters: z
      .object({
        name: z.string().min(1).describe("Proposition name"),
        article_no: z.string().min(1).describe("Article number"),
        proposition_type: z.enum(["service", "product"]).describe("Type: service or product"),
        time_unit: z.enum(["hour", "day"]).describe("Time unit (required for products too)"),
        vat_rate: z.string().min(1).describe("VAT rate name, e.g. '19%' (not a fraction like 0.19, unlike line items)"),
        price: z.number().optional().describe("Unit price"),
        description: z.string().optional().describe("Proposition description"),
        unit_name_1: z.string().optional().describe("Unit name, singular (e.g. 'Stunde')"),
        unit_name_n: z.string().optional().describe("Unit name, plural (e.g. 'Stunden')"),
      })
      .strict(),
    execute: async (params) => {
      const { price, ...rest } = params;
      const body: Record<string, unknown> = { ...rest };
      // Papierkram expects price as a string, and vat_rate as the rate's name (no normalizeVatRate here).
      if (price !== undefined) body.price = String(price);
      const client = getClient();
      const result = await client.create("/income/propositions", body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "update_proposition",
    description: "Update an existing proposition (partial). Only provided fields are changed.",
    annotations: { title: "Update product/service", ...UPDATE },
    parameters: z
      .object({
        id: idParam.describe("Proposition ID"),
        name: z.string().min(1).optional().describe("Proposition name"),
        article_no: z.string().min(1).optional().describe("Article number"),
        proposition_type: z.enum(["service", "product"]).optional().describe("Type: service or product"),
        time_unit: z.enum(["hour", "day"]).optional().describe("Time unit"),
        vat_rate: z.string().min(1).optional().describe("VAT rate name, e.g. '19%' (not a fraction like 0.19)"),
        price: z.number().optional().describe("Unit price"),
        description: z.string().optional().describe("Proposition description"),
        unit_name_1: z.string().optional().describe("Unit name, singular"),
        unit_name_n: z.string().optional().describe("Unit name, plural"),
      })
      .strict(),
    execute: async (params) => {
      const { id, price, ...rest } = params;
      const body: Record<string, unknown> = { ...rest };
      if (price !== undefined) body.price = String(price);
      const client = getClient();
      const result = await client.update(`/income/propositions/${id}`, body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "delete_proposition",
    description: "Permanently delete a proposition. Returns a confirmation string.",
    annotations: { title: "Delete product/service", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Proposition ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/income/propositions/${params.id}`);
      return `Proposition ${params.id} deleted successfully.`;
    },
  });

  server.addTool({
    name: "archive_proposition",
    description: "Archive a proposition. Reversible via unarchive_proposition.",
    annotations: { title: "Archive product/service", ...ARCHIVE },
    parameters: z.object({
      id: idParam.describe("Proposition ID to archive"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/income/propositions/${params.id}/archive`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "unarchive_proposition",
    description: "Unarchive a proposition (restore from archive). Reversible via archive_proposition.",
    annotations: { title: "Unarchive product/service", ...ARCHIVE },
    parameters: z.object({
      id: idParam.describe("Proposition ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/income/propositions/${params.id}/unarchive`);
      return toToolJson(result);
    },
  });
}
