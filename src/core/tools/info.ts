import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { toToolJson } from "../../api/format.js";
import { READ_ONLY, idParam, listParams } from "./_shared.js";

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
}
