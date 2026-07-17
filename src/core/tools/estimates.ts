import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactEstimate } from "../../api/transformers.js";
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

export function registerEstimateTools(server: FastMCP) {
  server.addTool({
    name: "list_estimates",
    description:
      "List estimates/proposals (Angebote) in Papierkram. Returns compact summaries (id, name, estimate_no, state, date, total) by default; set compact=false for the full API response. Supports pagination and filtering.",
    annotations: { title: "List estimates", ...READ_ONLY },
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
      const result = await client.list("/income/estimates", query as Record<string, string | number | boolean | undefined>);
      if (compact === false) return toToolJson(result);
      return toToolJson(compactList(result as Record<string, unknown>, compactEstimate));
    },
  });

  server.addTool({
    name: "get_estimate",
    description: "Get the full estimate/proposal record by ID (line items, totals, state).",
    annotations: { title: "Get estimate", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Estimate ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/income/estimates/${params.id}`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "create_estimate",
    description:
      "Create a new estimate/proposal (Angebot). Requires name, document_date and at least one line_item (vat_rate as decimal, e.g. 0.19). Returns the created estimate with its new ID.",
    annotations: { title: "Create estimate", ...CREATE },
    parameters: z
      .object({
        name: z.string().min(1).describe("Estimate name/title"),
        document_date: z.string().describe("Estimate date (YYYY-MM-DD), required by API"),
        line_items: z.array(incomeLineItemSchema).min(1).describe("Estimate line items (at least one required)"),
        description: z.string().optional().describe("Description / notes"),
        flagged: z.boolean().optional().describe("Flag the estimate"),
        customer_id: idParam.optional().describe("Customer (company) ID"),
        contact_person_id: idParam.optional().describe("Contact person ID"),
        project_id: idParam.optional().describe("Project ID"),
        custom_template_id: idParam.optional().describe("Custom document template ID (use get_estimate on an existing estimate to find template IDs)"),
      })
      .strict(),
    execute: async (params) => {
      const { customer_id, contact_person_id, project_id, custom_template_id, line_items, ...rest } = params;
      const body: Record<string, unknown> = { ...rest, line_items: buildIncomeLineItems(line_items) };

      if (custom_template_id !== undefined) body.custom_template = { id: custom_template_id };
      const customer = buildCustomer(customer_id, contact_person_id, project_id);
      if (customer) body.customer = customer;

      const client = getClient();
      const result = await client.create("/income/estimates", body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "update_estimate",
    description: "Update an existing estimate/proposal (partial). Only provided fields are changed.",
    annotations: { title: "Update estimate", ...UPDATE },
    parameters: z
      .object({
        id: idParam.describe("Estimate ID"),
        name: z.string().min(1).optional().describe("Estimate name/title"),
        document_date: z.string().optional().describe("Estimate date (YYYY-MM-DD)"),
        description: z.string().optional().describe("Description / notes"),
        flagged: z.boolean().optional().describe("Flag the estimate"),
        customer_id: idParam.optional().describe("Customer (company) ID"),
        contact_person_id: idParam.optional().describe("Contact person ID"),
        project_id: idParam.optional().describe("Project ID"),
        custom_template_id: idParam.optional().describe("Custom document template ID"),
        line_items: z.array(incomeLineItemSchema).optional().describe("Estimate line items"),
      })
      .strict(),
    execute: async (params) => {
      const { id, customer_id, contact_person_id, project_id, custom_template_id, line_items, ...rest } = params;
      const body: Record<string, unknown> = { ...rest };

      if (custom_template_id !== undefined) body.custom_template = { id: custom_template_id };
      const customer = buildCustomer(customer_id, contact_person_id, project_id);
      if (customer) body.customer = customer;
      if (line_items && line_items.length > 0) body.line_items = buildIncomeLineItems(line_items);

      const client = getClient();
      const result = await client.update(`/income/estimates/${id}`, body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "delete_estimate",
    description: "Permanently delete an estimate/proposal. Returns a confirmation string.",
    annotations: { title: "Delete estimate", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Estimate ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/income/estimates/${params.id}`);
      return `Estimate ${params.id} deleted successfully.`;
    },
  });

  server.addTool({
    name: "send_estimate",
    description:
      "Deliver an estimate. With send_via='email' the estimate is mailed (recipient, subject and body are required). With send_via='pdf' the estimate is finalised without sending an email — the PDF can then be retrieved via download_estimate_pdf. Either way Papierkram assigns the final estimate number. Finalising is not reversible.",
    annotations: { title: "Send/finalise estimate", ...SEND },
    parameters: z
      .object({
        id: idParam.describe("Estimate ID to deliver"),
        send_via: z
          .enum(["email", "pdf"])
          .default("email")
          .describe("'email' sends the estimate by mail. 'pdf' finalises without sending — use download_estimate_pdf afterwards."),
        recipient: z.string().email().optional().describe("Recipient email address. Required when send_via='email'."),
        subject: z
          .string()
          .optional()
          .describe("Email subject. Required when send_via='email'. Papierkram template variables like {{angebot.angebotsnummer}} are supported."),
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
      const result = await client.post(`/income/estimates/${id}/deliver`, payload);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "download_estimate_pdf",
    description: "Download an estimate as PDF. Returns base64-encoded PDF data (content_type, base64_length, base64).",
    annotations: { title: "Download estimate PDF", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Estimate ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.getPdf(`/income/estimates/${params.id}/pdf`);
      // NOTE: base64 is the deliverable and must NOT be routed through toToolJson
      // (truncation would corrupt it). fastmcp 1.27.7 has no embedded-resource content type.
      return JSON.stringify({
        message: `PDF for estimate ${params.id} downloaded successfully.`,
        content_type: result.contentType,
        base64_length: result.base64.length,
        base64: result.base64,
      });
    },
  });
}
