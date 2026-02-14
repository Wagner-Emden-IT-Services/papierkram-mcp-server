import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";

export function registerBankingTools(server: FastMCP) {
  server.addTool({
    name: "list_bank_connections",
    description: "List all bank connections in Papierkram.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Items per page"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/banking/bank_connections", params as Record<string, string | number | boolean>);
      return JSON.stringify(result, null, 2);
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
    description: "List all bank transactions in Papierkram. Can filter by bank connection.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Items per page"),
      bank_connection_id: z.number().optional().describe("Filter by bank connection ID"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/banking/transactions", params as Record<string, string | number | boolean>);
      return JSON.stringify(result, null, 2);
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
