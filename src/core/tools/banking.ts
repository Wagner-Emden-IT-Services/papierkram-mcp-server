import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactBankConnection, compactBankTransaction } from "../../api/transformers.js";
import { toToolJson } from "../../api/format.js";
import { READ_ONLY, idParam, listParams, compactParam } from "./_shared.js";

export function registerBankingTools(server: FastMCP) {
  server.addTool({
    name: "list_bank_connections",
    description:
      "List bank connections in Papierkram. Returns compact summaries (id, name) by default; set compact=false for the full API response. Supports pagination.",
    annotations: { title: "List bank connections", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
      compact: compactParam,
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/banking/bank_connections", query as Record<string, string | number | boolean | undefined>);
      if (compact === false) return toToolJson(result);
      return toToolJson(compactList(result as Record<string, unknown>, compactBankConnection));
    },
  });

  server.addTool({
    name: "get_bank_connection",
    description: "Get the full bank connection record by ID (IBAN, BIC, account details).",
    annotations: { title: "Get bank connection", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Bank connection ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/banking/bank_connections/${params.id}`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "list_bank_transactions",
    description:
      "List bank transactions in Papierkram. Returns compact summaries (id, value, state, date, usage, counterparty) by default; set compact=false for the full API response. Filter by bank connection and paginate.",
    annotations: { title: "List bank transactions", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
      bank_connection_id: idParam.optional().describe("Filter by bank connection ID"),
      compact: compactParam,
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/banking/transactions", query as Record<string, string | number | boolean | undefined>);
      if (compact === false) return toToolJson(result);
      return toToolJson(compactList(result as Record<string, unknown>, compactBankTransaction));
    },
  });

  server.addTool({
    name: "get_bank_transaction",
    description: "Get the full bank transaction record by ID.",
    annotations: { title: "Get bank transaction", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Bank transaction ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/banking/transactions/${params.id}`);
      return toToolJson(result);
    },
  });
}
