import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactExpenseVoucher } from "../../api/transformers.js";
import { toToolJson } from "../../api/format.js";
import {
  READ_ONLY,
  CREATE,
  UPDATE,
  DESTRUCTIVE,
  idParam,
  listParams,
  compactParam,
  expenseLineItemSchema,
  buildExpenseLineItems,
} from "./_shared.js";

const provenanceParam = z
  .enum(["domestic", "eu", "foreign"])
  .describe("Origin of expense: 'domestic', 'eu', or 'foreign' (non-EU)");

export function registerExpenseTools(server: FastMCP) {
  server.addTool({
    name: "list_expense_vouchers",
    description:
      "List expense vouchers (Ausgabebelege) in Papierkram. Returns compact summaries (id, name, voucher_no, state, dates, amount) by default; set compact=false for the full API response. Supports pagination and filtering.",
    annotations: { title: "List expense vouchers", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
      compact: compactParam,
      creditor_id: idParam.optional().describe("Filter by creditor/supplier (company) ID"),
      project_id: idParam.optional().describe("Filter by project ID"),
      document_date_range_start: z.string().optional().describe("Filter by document date range start (YYYY-MM-DD)"),
      document_date_range_end: z.string().optional().describe("Filter by document date range end (YYYY-MM-DD)"),
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/expense/vouchers", query as Record<string, string | number | boolean | undefined>);
      if (compact === false) return toToolJson(result);
      return toToolJson(compactList(result as Record<string, unknown>, compactExpenseVoucher));
    },
  });

  server.addTool({
    name: "get_expense_voucher",
    description: "Get the full expense voucher record by ID.",
    annotations: { title: "Get expense voucher", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Expense voucher ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/expense/vouchers/${params.id}`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "create_expense_voucher",
    description:
      "Create a new expense voucher (Ausgabebeleg). Requires name, provenance, and at least one line_item. Each line_item needs a category from the fixed Papierkram account list and a vat_rate as decimal (0.19). Returns the created voucher with its new ID.",
    annotations: { title: "Create expense voucher", ...CREATE },
    parameters: z
      .object({
        name: z.string().min(1).describe("Voucher name/title"),
        provenance: provenanceParam,
        line_items: z.array(expenseLineItemSchema).min(1).describe("Voucher line items (at least one required)"),
        document_date: z.string().optional().describe("Voucher date (YYYY-MM-DD)"),
        due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
        description: z.string().optional().describe("Description / notes"),
        entertainment_reason: z.string().optional().describe("Entertainment/hospitality reason"),
        flagged: z.boolean().optional().describe("Flag the voucher"),
        creditor_id: idParam.optional().describe("Creditor/supplier (company) ID"),
      })
      .strict(),
    execute: async (params) => {
      const { creditor_id, line_items, ...rest } = params;
      const body: Record<string, unknown> = { ...rest, line_items: buildExpenseLineItems(line_items) };
      if (creditor_id !== undefined) {
        body.creditor = { id: creditor_id };
      }
      const client = getClient();
      const result = await client.create("/expense/vouchers", body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "update_expense_voucher",
    description: "Update an existing expense voucher (partial). Only provided fields are changed.",
    annotations: { title: "Update expense voucher", ...UPDATE },
    parameters: z
      .object({
        id: idParam.describe("Expense voucher ID"),
        name: z.string().min(1).optional().describe("Voucher name/title"),
        document_date: z.string().optional().describe("Voucher date (YYYY-MM-DD)"),
        due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
        description: z.string().optional().describe("Description / notes"),
        provenance: provenanceParam.optional(),
        entertainment_reason: z.string().optional().describe("Entertainment/hospitality reason"),
        flagged: z.boolean().optional().describe("Flag the voucher"),
        creditor_id: idParam.optional().describe("Creditor/supplier (company) ID"),
        line_items: z.array(expenseLineItemSchema).optional().describe("Voucher line items"),
      })
      .strict(),
    execute: async (params) => {
      const { id, creditor_id, line_items, ...rest } = params;
      const body: Record<string, unknown> = { ...rest };
      if (creditor_id !== undefined) {
        body.creditor = { id: creditor_id };
      }
      if (line_items && line_items.length > 0) {
        body.line_items = buildExpenseLineItems(line_items);
      }
      const client = getClient();
      const result = await client.update(`/expense/vouchers/${id}`, body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "delete_expense_voucher",
    description: "Permanently delete an expense voucher. Returns a confirmation string.",
    annotations: { title: "Delete expense voucher", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Expense voucher ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/expense/vouchers/${params.id}`);
      return `Expense voucher ${params.id} deleted successfully.`;
    },
  });
}
