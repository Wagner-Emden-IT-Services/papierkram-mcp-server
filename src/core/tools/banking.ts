import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactBankConnection, compactBankTransaction } from "../../api/transformers.js";

export function registerBankingTools(server: FastMCP) {
  server.addTool({
    name: "list_bank_connections",
    description: "List bank connections in Papierkram. Returns compact summaries by default.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
      compact: z.boolean().optional().default(true).describe("Return compact summaries (default: true). Set false for full API response."),
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/banking/bank_connections", query as Record<string, string | number | boolean>);
      if (compact === false) return JSON.stringify(result, null, 2);
      return JSON.stringify(compactList(result as Record<string, unknown>, compactBankConnection), null, 2);
    },
  });

  server.addTool({
    name: "get_bank_connection",
    description: "Get a specific bank connection by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Bank connection ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/banking/bank_connections/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "list_bank_transactions",
    description: "List bank transactions in Papierkram. Returns compact summaries by default. Can filter by bank connection.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
      bank_connection_id: z.number().optional().describe("Filter by bank connection ID"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
      compact: z.boolean().optional().default(true).describe("Return compact summaries (default: true). Set false for full API response."),
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/banking/transactions", query as Record<string, string | number | boolean>);
      if (compact === false) return JSON.stringify(result, null, 2);
      return JSON.stringify(compactList(result as Record<string, unknown>, compactBankTransaction), null, 2);
    },
  });

  server.addTool({
    name: "get_bank_transaction",
    description: "Get a specific bank transaction by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Bank transaction ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/banking/transactions/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });
}
