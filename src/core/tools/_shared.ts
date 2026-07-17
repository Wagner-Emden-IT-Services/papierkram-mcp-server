import { z } from "zod";
import { UserError } from "fastmcp";
import { EXPENSE_CATEGORIES } from "./_categories.js";

/**
 * Shared building blocks for tool definitions: MCP annotation presets,
 * reusable Zod parameter schemas, and small body-building helpers.
 * Keeping these in one place avoids the copy-paste that previously drifted
 * between the create/update handlers of each resource.
 */

// ---- Annotation presets (MCP behavioural hints; advisory, not security) ----
// openWorldHint is true everywhere: every tool calls the external Papierkram API.
export const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const CREATE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const;

export const UPDATE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const DESTRUCTIVE = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: true,
} as const;

// Reversible archive/unarchive toggles.
export const ARCHIVE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

// Finalizing/sending: assigns the legal document number and may email externally.
export const SEND = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
} as const;

// ---- Reusable parameter schemas ----
export const idParam = z.number().int().positive();

/** Standard pagination + ordering params for list tools. */
export const listParams = {
  page: z.number().int().min(1).optional().describe("Page number (1-based)"),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(25)
    .describe("Items per page (1-100, default: 25)"),
  order_by: z.string().optional().describe("Field to order by"),
  order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
};

export const compactParam = z
  .boolean()
  .optional()
  .default(true)
  .describe("Return compact summaries (default: true). Set false for the full API response.");

/** Line item for income documents (invoices + estimates). */
export const incomeLineItemSchema = z
  .object({
    name: z.string().min(1).describe("Line item name/description"),
    description: z.string().optional().describe("Additional description"),
    quantity: z.number().positive().describe("Quantity"),
    unit: z.string().optional().describe("Unit (e.g. Stunde, Stück)"),
    price: z.number().describe("Unit price (net)"),
    vat_rate: z
      .union([z.number(), z.string()])
      .describe("VAT rate as decimal fraction, e.g. 0.19 for 19% (a string like '19%' is also accepted and normalized to 0.19)"),
  })
  .strict();

/** Line item for expense vouchers. */
export const expenseLineItemSchema = z
  .object({
    name: z.string().min(1).describe("Line item name/description"),
    amount: z.number().describe("Total amount (gross)"),
    vat_rate: z
      .union([z.number(), z.string()])
      .describe("VAT rate as decimal fraction, e.g. 0.19 for 19% ('19%' is accepted and normalized)"),
    category: z
      .enum(EXPENSE_CATEGORIES)
      .describe("Accounting category — must be one of the exact Papierkram account labels"),
  })
  .strict();

/**
 * Normalizes a VAT rate to the API's decimal-fraction convention (0.19 for 19%).
 * Accepts numbers (passed through) and human strings like "19%" / "19" / "0,19".
 */
export function normalizeVatRate(v: number | string): number {
  if (typeof v === "number") return v;
  const s = v.trim().replace(",", ".");
  const n = s.endsWith("%") ? parseFloat(s.slice(0, -1)) / 100 : parseFloat(s);
  if (Number.isNaN(n)) {
    throw new UserError(`Invalid vat_rate "${v}". Use a decimal fraction like 0.19 (for 19%).`);
  }
  // Values above 1 are treated as percentages (19 -> 0.19); fractions pass through.
  return n > 1 ? n / 100 : n;
}

/** Maps income line items to the API body, normalizing vat_rate. */
export function buildIncomeLineItems(
  items: z.infer<typeof incomeLineItemSchema>[]
): Record<string, unknown>[] {
  return items.map((item) => ({ ...item, vat_rate: normalizeVatRate(item.vat_rate) }));
}

/** Maps expense line items to the API body, normalizing vat_rate. */
export function buildExpenseLineItems(
  items: z.infer<typeof expenseLineItemSchema>[]
): Record<string, unknown>[] {
  return items.map((item) => ({ ...item, vat_rate: normalizeVatRate(item.vat_rate) }));
}

/**
 * Builds the nested `customer` object for income documents.
 * Uses `!== undefined` so a legitimate id of 0 is never dropped.
 */
export function buildCustomer(
  customer_id?: number,
  contact_person_id?: number,
  project_id?: number
): Record<string, unknown> | undefined {
  if (customer_id === undefined && contact_person_id === undefined && project_id === undefined) {
    return undefined;
  }
  const customer: Record<string, unknown> = {};
  if (customer_id !== undefined) customer.id = customer_id;
  if (contact_person_id !== undefined) customer.contact_person = { id: contact_person_id };
  if (project_id !== undefined) customer.project = { id: project_id };
  return customer;
}
