import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";

export function registerInfoTools(server: FastMCP) {
  server.addTool({
    name: "get_account_info",
    description: "Get account information from Papierkram (company name, plan, subscription details).",
    parameters: z.object({}),
    execute: async () => {
      const client = getClient();
      const result = await client.get("/info");
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_payment_terms",
    description: "List payment terms (Zahlungsbedingungen) in Papierkram. Use the returned IDs when creating invoices.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/income/payment_terms", params as Record<string, string | number | boolean>);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_propositions",
    description: "List propositions (Waren/Dienstleistungen) in Papierkram. These are products and services that can be used in invoices and estimates.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/income/propositions", params as Record<string, string | number | boolean>);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_proposition",
    description: "Get a specific proposition (Ware/Dienstleistung) by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Proposition ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/income/propositions/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
