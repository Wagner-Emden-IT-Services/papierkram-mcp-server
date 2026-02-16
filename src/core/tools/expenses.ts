import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactExpenseVoucher } from "../../api/transformers.js";

const lineItemSchema = z.object({
  name: z.string().describe("Line item name/description"),
  amount: z.number().describe("Total amount (gross)"),
  vat_rate: z.string().describe("VAT rate (e.g. '19%', '7%', '0%')"),
  category: z.string().describe("Accounting category (e.g. 'Sonstige betriebliche Aufwendungen')"),
});

export function registerExpenseTools(server: FastMCP) {
  server.addTool({
    name: "list_expense_vouchers",
    description: "List expense vouchers (Ausgabebelege) in Papierkram. Returns compact summaries by default. Supports pagination and filtering.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
      compact: z.boolean().optional().default(true).describe("Return compact summaries (default: true). Set false for full API response."),
      creditor_id: z.number().optional().describe("Filter by creditor/supplier (company) ID"),
      project_id: z.number().optional().describe("Filter by project ID"),
      document_date_range_start: z.string().optional().describe("Filter by document date range start (YYYY-MM-DD)"),
      document_date_range_end: z.string().optional().describe("Filter by document date range end (YYYY-MM-DD)"),
    }),
    execute: async (params) => {
      const { compact, creditor_id, project_id, document_date_range_start, document_date_range_end, ...query } = params;
      if (creditor_id) (query as Record<string, unknown>).creditor_id = creditor_id;
      if (project_id) (query as Record<string, unknown>).project_id = project_id;
      if (document_date_range_start) (query as Record<string, unknown>).document_date_range_start = document_date_range_start;
      if (document_date_range_end) (query as Record<string, unknown>).document_date_range_end = document_date_range_end;
      const client = getClient();
      const result = await client.list("/expense/vouchers", query as Record<string, string | number | boolean>);
      if (compact === false) return JSON.stringify(result, null, 2);
      return JSON.stringify(compactList(result as Record<string, unknown>, compactExpenseVoucher), null, 2);
    },
  });

  server.addTool({
    name: "get_expense_voucher",
    description: "Get a specific expense voucher by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Expense voucher ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/expense/vouchers/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_expense_voucher",
    description: "Create a new expense voucher (Ausgabebeleg) in Papierkram.",
    parameters: z.object({
      name: z.string().describe("Voucher name/title"),
      document_date: z.string().optional().describe("Voucher date (YYYY-MM-DD)"),
      due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      description: z.string().optional().describe("Description / notes"),
      provenance: z.enum(["domestic", "eu", "non_eu"]).describe("Origin of expense: 'domestic', 'eu', or 'non_eu'"),
      entertainment_reason: z.string().optional().describe("Entertainment/hospitality reason"),
      flagged: z.boolean().optional().describe("Flag the voucher"),
      creditor_id: z.number().optional().describe("Creditor/supplier (company) ID"),
      line_items: z.array(lineItemSchema).optional().describe("Voucher line items"),
    }),
    execute: async (params) => {
      const { creditor_id, line_items, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (creditor_id) {
        body.creditor = { id: creditor_id };
      }

      if (line_items && line_items.length > 0) {
        body.line_items = line_items.map((item) => ({
          name: item.name,
          amount: item.amount,
          vat_rate: item.vat_rate,
          category: item.category,
        }));
      }

      const client = getClient();
      const result = await client.create("/expense/vouchers", body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_expense_voucher",
    description: "Update an existing expense voucher (Ausgabebeleg) in Papierkram.",
    parameters: z.object({
      id: z.number().describe("Expense voucher ID"),
      name: z.string().optional().describe("Voucher name/title"),
      document_date: z.string().optional().describe("Voucher date (YYYY-MM-DD)"),
      due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      description: z.string().optional().describe("Description / notes"),
      provenance: z.enum(["domestic", "eu", "non_eu"]).optional().describe("Origin of expense"),
      entertainment_reason: z.string().optional().describe("Entertainment/hospitality reason"),
      flagged: z.boolean().optional().describe("Flag the voucher"),
      creditor_id: z.number().optional().describe("Creditor/supplier (company) ID"),
      line_items: z.array(lineItemSchema).optional().describe("Voucher line items"),
    }),
    execute: async (params) => {
      const { id, creditor_id, line_items, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (creditor_id) {
        body.creditor = { id: creditor_id };
      }

      if (line_items && line_items.length > 0) {
        body.line_items = line_items.map((item) => ({
          name: item.name,
          amount: item.amount,
          vat_rate: item.vat_rate,
          category: item.category,
        }));
      }

      const client = getClient();
      const result = await client.update(`/expense/vouchers/${id}`, body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_expense_voucher",
    description: "Delete an expense voucher (Ausgabebeleg) from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Expense voucher ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/expense/vouchers/${params.id}`);
      return `Expense voucher ${params.id} deleted successfully.`;
    },
  });
}
