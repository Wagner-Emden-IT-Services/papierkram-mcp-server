import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactInvoice } from "../../api/transformers.js";
import { toToolJson } from "../../api/format.js";
import {
  READ_ONLY,
  CREATE,
  UPDATE,
  DESTRUCTIVE,
  SEND,
  idParam,
  listParams,
  compactParam,
  incomeLineItemSchema,
  buildIncomeLineItems,
  buildCustomer,
} from "./_shared.js";

/** Billing-address fields shared by create/update invoice. */
const billingFields = {
  billing_company: z.string().optional().describe("Billing address: company name"),
  billing_street: z.string().optional().describe("Billing address: street"),
  billing_zip: z.string().optional().describe("Billing address: zip code"),
  billing_city: z.string().optional().describe("Billing address: city"),
  billing_country: z.string().optional().describe("Billing address: country (e.g. 'DE')"),
  billing_ust_idnr: z.string().optional().describe("Billing address: VAT ID"),
  billing_email: z.string().email().optional().describe("Billing address: email"),
};

function buildBilling(p: {
  billing_company?: string;
  billing_street?: string;
  billing_zip?: string;
  billing_city?: string;
  billing_country?: string;
  billing_ust_idnr?: string;
  billing_email?: string;
}): Record<string, unknown> | undefined {
  const billing: Record<string, unknown> = {};
  if (p.billing_company !== undefined) billing.company = p.billing_company;
  if (p.billing_street !== undefined) billing.street = p.billing_street;
  if (p.billing_zip !== undefined) billing.zip = p.billing_zip;
  if (p.billing_city !== undefined) billing.city = p.billing_city;
  if (p.billing_country !== undefined) billing.country = p.billing_country;
  if (p.billing_ust_idnr !== undefined) billing.ust_idnr = p.billing_ust_idnr;
  if (p.billing_email !== undefined) billing.email = p.billing_email;
  return Object.keys(billing).length > 0 ? billing : undefined;
}

export function registerInvoiceTools(server: FastMCP) {
  server.addTool({
    name: "list_invoices",
    description:
      "List invoices in Papierkram. Returns compact summaries (id, name, invoice_no, state, dates, total_gross, customer) by default; set compact=false for the full API response. Supports pagination and filtering.",
    annotations: { title: "List invoices", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
      compact: compactParam,
      company_id: idParam.optional().describe("Filter by company ID"),
      project_id: idParam.optional().describe("Filter by project ID"),
      document_date_range_start: z.string().optional().describe("Filter by document date range start (YYYY-MM-DD)"),
      document_date_range_end: z.string().optional().describe("Filter by document date range end (YYYY-MM-DD)"),
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/income/invoices", query as Record<string, string | number | boolean | undefined>);
      if (compact === false) return toToolJson(result);
      return toToolJson(compactList(result as Record<string, unknown>, compactInvoice));
    },
  });

  server.addTool({
    name: "get_invoice",
    description:
      "Get the full invoice record by ID, including invoice_no (null while still a draft), state, line items and totals.",
    annotations: { title: "Get invoice", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Invoice ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/income/invoices/${params.id}`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "create_invoice",
    description:
      "Create a new invoice (as a draft). Requires name, payment_term_id and at least one line_item (vat_rate as decimal, e.g. 0.19). The invoice number is assigned later via send_invoice. Returns the created draft with its ID.",
    annotations: { title: "Create invoice", ...CREATE },
    parameters: z
      .object({
        name: z.string().min(1).describe("Invoice name/title"),
        payment_term_id: idParam.describe("Payment term ID (required, use list_payment_terms to get available IDs)"),
        line_items: z.array(incomeLineItemSchema).min(1).describe("Invoice line items (at least one required)"),
        supply_date: z.string().optional().describe("Supply/service date (YYYY-MM-DD)"),
        document_date: z.string().optional().describe("Invoice date (YYYY-MM-DD)"),
        description: z.string().optional().describe("Description / notes"),
        flagged: z.boolean().optional().describe("Flag the invoice"),
        customer_id: idParam.optional().describe("Customer (company) ID"),
        contact_person_id: idParam.optional().describe("Contact person ID"),
        project_id: idParam.optional().describe("Project ID"),
        custom_template_id: idParam.optional().describe("Custom document template ID (use get_invoice on an existing invoice to find template IDs)"),
        ...billingFields,
      })
      .strict(),
    execute: async (params) => {
      const {
        customer_id, contact_person_id, project_id,
        payment_term_id, custom_template_id, line_items,
        billing_company, billing_street, billing_zip, billing_city,
        billing_country, billing_ust_idnr, billing_email,
        ...rest
      } = params;

      const body: Record<string, unknown> = {
        ...rest,
        payment_term: { id: payment_term_id },
        line_items: buildIncomeLineItems(line_items),
      };

      if (custom_template_id !== undefined) body.custom_template = { id: custom_template_id };
      const customer = buildCustomer(customer_id, contact_person_id, project_id);
      if (customer) body.customer = customer;
      const billing = buildBilling({ billing_company, billing_street, billing_zip, billing_city, billing_country, billing_ust_idnr, billing_email });
      if (billing) body.billing = billing;

      const client = getClient();
      const result = await client.create("/income/invoices", body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "update_invoice",
    description:
      "Update an existing draft invoice (partial). Only provided fields are changed. Only works on draft invoices (before send_invoice assigns the number).",
    annotations: { title: "Update invoice", ...UPDATE },
    parameters: z
      .object({
        id: idParam.describe("Invoice ID"),
        name: z.string().min(1).optional().describe("Invoice name/title"),
        supply_date: z.string().optional().describe("Supply/service date (YYYY-MM-DD)"),
        document_date: z.string().optional().describe("Invoice date (YYYY-MM-DD)"),
        payment_term_id: idParam.optional().describe("Payment term ID"),
        description: z.string().optional().describe("Description / notes"),
        flagged: z.boolean().optional().describe("Flag the invoice"),
        customer_id: idParam.optional().describe("Customer (company) ID"),
        contact_person_id: idParam.optional().describe("Contact person ID"),
        project_id: idParam.optional().describe("Project ID"),
        custom_template_id: idParam.optional().describe("Custom document template ID"),
        line_items: z.array(incomeLineItemSchema).optional().describe("Invoice line items"),
        ...billingFields,
      })
      .strict(),
    execute: async (params) => {
      const {
        id, customer_id, contact_person_id, project_id,
        payment_term_id, custom_template_id, line_items,
        billing_company, billing_street, billing_zip, billing_city,
        billing_country, billing_ust_idnr, billing_email,
        ...rest
      } = params;

      const body: Record<string, unknown> = { ...rest };

      if (payment_term_id !== undefined) body.payment_term = { id: payment_term_id };
      if (custom_template_id !== undefined) body.custom_template = { id: custom_template_id };
      const customer = buildCustomer(customer_id, contact_person_id, project_id);
      if (customer) body.customer = customer;
      const billing = buildBilling({ billing_company, billing_street, billing_zip, billing_city, billing_country, billing_ust_idnr, billing_email });
      if (billing) body.billing = billing;
      if (line_items && line_items.length > 0) body.line_items = buildIncomeLineItems(line_items);

      const client = getClient();
      const result = await client.update(`/income/invoices/${id}`, body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "delete_invoice",
    description: "Permanently delete a draft invoice. Only works on draft invoices. Returns a confirmation string.",
    annotations: { title: "Delete invoice", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Invoice ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/income/invoices/${params.id}`);
      return `Invoice ${params.id} deleted successfully.`;
    },
  });

  server.addTool({
    name: "cancel_invoice",
    description: "Cancel a finalised invoice by creating a cancellation document (Storno). Use for invoices that already have a number; use delete_invoice for drafts.",
    annotations: { title: "Cancel invoice", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Invoice ID to cancel"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/income/invoices/${params.id}/cancel`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "archive_invoice",
    description: "Archive an invoice (move out of the active list). Does not delete or cancel it.",
    annotations: { title: "Archive invoice", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Invoice ID to archive"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/income/invoices/${params.id}/archive`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "send_invoice",
    description:
      "Deliver an invoice. With send_via='email' the invoice is mailed (recipient, subject and body are required). With send_via='pdf' the invoice is finalised without sending an email — the PDF can then be retrieved via download_invoice_pdf. Either way Papierkram assigns the final invoice number. Finalising is not reversible.",
    annotations: { title: "Send/finalise invoice", ...SEND },
    parameters: z
      .object({
        id: idParam.describe("Invoice ID to deliver"),
        send_via: z
          .enum(["email", "pdf"])
          .default("email")
          .describe("'email' sends the invoice by mail. 'pdf' finalises without sending — use download_invoice_pdf afterwards."),
        recipient: z.string().email().optional().describe("Recipient email address. Required when send_via='email'."),
        subject: z
          .string()
          .optional()
          .describe("Email subject. Required when send_via='email'. Papierkram template variables like {{rechnung.rechnungsnummer}} are supported."),
        body: z
          .string()
          .optional()
          .describe("Email body. Required when send_via='email'. Papierkram template variables are supported."),
      })
      .strict()
      .refine(
        (p) => p.send_via !== "email" || (!!p.recipient && !!p.subject && !!p.body),
        {
          message:
            "send_via='email' requires recipient, subject and body. Use send_via='pdf' to finalise without sending an email.",
        },
      ),
    execute: async (params) => {
      const { id, send_via, recipient, subject, body } = params;
      let payload: Record<string, unknown>;
      if (send_via === "pdf") {
        payload = { send_via: "pdf" };
      } else {
        // Defense in depth: the .refine() above already enforces this, but tools may
        // be invoked directly, so re-check and surface a user-facing error.
        if (!recipient || !subject || !body) {
          throw new UserError(
            "send_via='email' requires recipient, subject and body. Use send_via='pdf' to finalise without sending an email.",
          );
        }
        payload = { send_via: "email", email: { recipient, subject, body } };
      }
      const client = getClient();
      const result = await client.post(`/income/invoices/${id}/deliver`, payload);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "download_invoice_pdf",
    description: "Download an invoice as PDF. Returns base64-encoded PDF data (content_type, base64_length, base64).",
    annotations: { title: "Download invoice PDF", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Invoice ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.getPdf(`/income/invoices/${params.id}/pdf`);
      // NOTE: base64 is the deliverable and must NOT be routed through toToolJson
      // (truncation would corrupt it). fastmcp 1.27.7 has no embedded-resource content type.
      return JSON.stringify({
        message: `PDF for invoice ${params.id} downloaded successfully.`,
        content_type: result.contentType,
        base64_length: result.base64.length,
        base64: result.base64,
      });
    },
  });
}
