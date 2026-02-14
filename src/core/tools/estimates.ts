import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";

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
    description: "List all estimates/proposals in Papierkram. Supports pagination.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Items per page"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/income/estimates", params as Record<string, string | number | boolean>);
      return JSON.stringify(result, null, 2);
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
      line_items: z.array(lineItemSchema).optional().describe("Estimate line items"),
    }),
    execute: async (params) => {
      const { customer_id, contact_person_id, project_id, line_items, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

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
      line_items: z.array(lineItemSchema).optional().describe("Estimate line items"),
    }),
    execute: async (params) => {
      const { id, customer_id, contact_person_id, project_id, line_items, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

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
