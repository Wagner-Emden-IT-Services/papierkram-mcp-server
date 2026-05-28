import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactEstimate } from "../../api/transformers.js";

const lineItemSchema = z.object({
  name: z.string().describe("Line item name/description"),
  description: z.string().optional().describe("Additional description"),
  quantity: z.number().describe("Quantity"),
  unit: z.string().optional().describe("Unit (e.g. Stunde, Stück)"),
  price: z.number().describe("Unit price (net)"),
  vat_rate: z.string().describe("VAT rate (e.g. '19%', '7%', '0%')"),
});

export function registerEstimateTools(server: FastMCP) {
  server.addTool({
    name: "list_estimates",
    description: "List estimates/proposals in Papierkram. Returns compact summaries by default. Supports pagination and filtering.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
      compact: z.boolean().optional().default(true).describe("Return compact summaries (default: true). Set false for full API response."),
      company_id: z.number().optional().describe("Filter by company ID"),
      project_id: z.number().optional().describe("Filter by project ID"),
      document_date_range_start: z.string().optional().describe("Filter by document date range start (YYYY-MM-DD)"),
      document_date_range_end: z.string().optional().describe("Filter by document date range end (YYYY-MM-DD)"),
    }),
    execute: async (params) => {
      const { compact, company_id, project_id, document_date_range_start, document_date_range_end, ...query } = params;
      if (company_id) (query as Record<string, unknown>).company_id = company_id;
      if (project_id) (query as Record<string, unknown>).project_id = project_id;
      if (document_date_range_start) (query as Record<string, unknown>).document_date_range_start = document_date_range_start;
      if (document_date_range_end) (query as Record<string, unknown>).document_date_range_end = document_date_range_end;
      const client = getClient();
      const result = await client.list("/income/estimates", query as Record<string, string | number | boolean>);
      if (compact === false) return JSON.stringify(result, null, 2);
      return JSON.stringify(compactList(result as Record<string, unknown>, compactEstimate), null, 2);
    },
  });

  server.addTool({
    name: "get_estimate",
    description: "Get a specific estimate/proposal by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Estimate ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/income/estimates/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_estimate",
    description: "Create a new estimate/proposal in Papierkram.",
    parameters: z.object({
      name: z.string().describe("Estimate name/title"),
      document_date: z.string().describe("Estimate date (YYYY-MM-DD), required by API"),
      description: z.string().optional().describe("Description / notes"),
      flagged: z.boolean().optional().describe("Flag the estimate"),
      customer_id: z.number().optional().describe("Customer (company) ID"),
      contact_person_id: z.number().optional().describe("Contact person ID"),
      project_id: z.number().optional().describe("Project ID"),
      custom_template_id: z.number().optional().describe("Custom document template ID (use get_estimate on an existing estimate to find available template IDs)"),
      line_items: z.array(lineItemSchema).optional().describe("Estimate line items"),
    }),
    execute: async (params) => {
      const { customer_id, contact_person_id, project_id, custom_template_id, line_items, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (custom_template_id) {
        body.custom_template = { id: custom_template_id };
      }

      if (customer_id || contact_person_id || project_id) {
        const customer: Record<string, unknown> = {};
        if (customer_id) customer.id = customer_id;
        if (contact_person_id) customer.contact_person = { id: contact_person_id };
        if (project_id) customer.project = { id: project_id };
        body.customer = customer;
      }

      if (line_items && line_items.length > 0) {
        body.line_items = line_items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          vat_rate: item.vat_rate,
        }));
      }

      const client = getClient();
      const result = await client.create("/income/estimates", body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_estimate",
    description: "Update an existing estimate/proposal in Papierkram.",
    parameters: z.object({
      id: z.number().describe("Estimate ID"),
      name: z.string().optional().describe("Estimate name/title"),
      document_date: z.string().optional().describe("Estimate date (YYYY-MM-DD)"),
      description: z.string().optional().describe("Description / notes"),
      flagged: z.boolean().optional().describe("Flag the estimate"),
      customer_id: z.number().optional().describe("Customer (company) ID"),
      contact_person_id: z.number().optional().describe("Contact person ID"),
      project_id: z.number().optional().describe("Project ID"),
      custom_template_id: z.number().optional().describe("Custom document template ID (use get_estimate on an existing estimate to find available template IDs)"),
      line_items: z.array(lineItemSchema).optional().describe("Estimate line items"),
    }),
    execute: async (params) => {
      const { id, customer_id, contact_person_id, project_id, custom_template_id, line_items, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (custom_template_id) {
        body.custom_template = { id: custom_template_id };
      }

      if (customer_id || contact_person_id || project_id) {
        const customer: Record<string, unknown> = {};
        if (customer_id) customer.id = customer_id;
        if (contact_person_id) customer.contact_person = { id: contact_person_id };
        if (project_id) customer.project = { id: project_id };
        body.customer = customer;
      }

      if (line_items && line_items.length > 0) {
        body.line_items = line_items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          vat_rate: item.vat_rate,
        }));
      }

      const client = getClient();
      const result = await client.update(`/income/estimates/${id}`, body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_estimate",
    description: "Delete an estimate/proposal from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Estimate ID"),
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
      "Deliver an estimate in Papierkram. With send_via='email' the estimate is mailed (recipient, subject and body are required). With send_via='pdf' the estimate is finalised without sending an email - the PDF can then be retrieved via download_estimate_pdf. Either way Papierkram assigns the final estimate number.",
    parameters: z
      .object({
        id: z.number().describe("Estimate ID to deliver"),
        send_via: z
          .enum(["email", "pdf"])
          .default("email")
          .describe("'email' sends the estimate by mail. 'pdf' finalises without sending - use download_estimate_pdf afterwards."),
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
        if (!recipient || !subject || !body) {
          throw new Error(
            "send_via='email' requires recipient, subject and body. Use send_via='pdf' to finalise without sending an email.",
          );
        }
        payload = { send_via: "email", email: { recipient, subject, body } };
      }
      const client = getClient();
      const result = await client.post(`/income/estimates/${id}/deliver`, payload);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "download_estimate_pdf",
    description: "Download an estimate as PDF from Papierkram. Returns base64-encoded PDF data.",
    parameters: z.object({
      id: z.number().describe("Estimate ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.getPdf(`/income/estimates/${params.id}/pdf`);
      return JSON.stringify({
        message: `PDF for estimate ${params.id} downloaded successfully.`,
        content_type: result.contentType,
        base64_length: result.base64.length,
        base64: result.base64,
      });
    },
  });
}
