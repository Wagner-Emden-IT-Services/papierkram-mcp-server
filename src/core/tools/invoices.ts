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

export function registerInvoiceTools(server: FastMCP) {
  server.addTool({
    name: "list_invoices",
    description: "List all invoices in Papierkram. Supports pagination and filtering.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Items per page"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/income/invoices", params as Record<string, string | number | boolean>);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_invoice",
    description: "Get a specific invoice by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Invoice ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/income/invoices/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_invoice",
    description: "Create a new invoice in Papierkram.",
    parameters: z.object({
      name: z.string().describe("Invoice name/title"),
      supply_date: z.string().optional().describe("Supply/service date (YYYY-MM-DD)"),
      document_date: z.string().optional().describe("Invoice date (YYYY-MM-DD)"),
      payment_term_id: z.number().describe("Payment term ID (required, use list_payment_terms to get available IDs)"),
      description: z.string().optional().describe("Description / notes"),
      flagged: z.boolean().optional().describe("Flag the invoice"),
      customer_id: z.number().optional().describe("Customer (company) ID"),
      contact_person_id: z.number().optional().describe("Contact person ID"),
      project_id: z.number().optional().describe("Project ID"),
      billing_company: z.string().optional().describe("Billing address: company name"),
      billing_street: z.string().optional().describe("Billing address: street"),
      billing_zip: z.string().optional().describe("Billing address: zip code"),
      billing_city: z.string().optional().describe("Billing address: city"),
      billing_country: z.string().optional().describe("Billing address: country (e.g. 'DE')"),
      billing_ust_idnr: z.string().optional().describe("Billing address: VAT ID"),
      billing_email: z.string().optional().describe("Billing address: email"),
      line_items: z.array(lineItemSchema).optional().describe("Invoice line items"),
    }),
    execute: async (params) => {
      const {
        customer_id, contact_person_id, project_id,
        payment_term_id,
        billing_company, billing_street, billing_zip, billing_city,
        billing_country, billing_ust_idnr, billing_email,
        line_items, ...rest
      } = params;

      const body: Record<string, unknown> = { ...rest };

      // Build nested payment_term object
      if (payment_term_id) {
        body.payment_term = { id: payment_term_id };
      }

      // Build nested customer object
      if (customer_id || contact_person_id || project_id) {
        const customer: Record<string, unknown> = {};
        if (customer_id) customer.id = customer_id;
        if (contact_person_id) customer.contact_person = { id: contact_person_id };
        if (project_id) customer.project = { id: project_id };
        body.customer = customer;
      }

      // Build nested billing object
      const billing: Record<string, unknown> = {};
      if (billing_company) billing.company = billing_company;
      if (billing_street) billing.street = billing_street;
      if (billing_zip) billing.zip = billing_zip;
      if (billing_city) billing.city = billing_city;
      if (billing_country) billing.country = billing_country;
      if (billing_ust_idnr) billing.ust_idnr = billing_ust_idnr;
      if (billing_email) billing.email = billing_email;
      if (Object.keys(billing).length > 0) body.billing = billing;

      // Transform line items
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
      const result = await client.create("/income/invoices", body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_invoice",
    description: "Update an existing invoice (draft) in Papierkram. Only works on draft invoices.",
    parameters: z.object({
      id: z.number().describe("Invoice ID"),
      name: z.string().optional().describe("Invoice name/title"),
      supply_date: z.string().optional().describe("Supply/service date (YYYY-MM-DD)"),
      document_date: z.string().optional().describe("Invoice date (YYYY-MM-DD)"),
      payment_term_id: z.number().optional().describe("Payment term ID"),
      description: z.string().optional().describe("Description / notes"),
      flagged: z.boolean().optional().describe("Flag the invoice"),
      customer_id: z.number().optional().describe("Customer (company) ID"),
      contact_person_id: z.number().optional().describe("Contact person ID"),
      project_id: z.number().optional().describe("Project ID"),
      billing_company: z.string().optional().describe("Billing address: company name"),
      billing_street: z.string().optional().describe("Billing address: street"),
      billing_zip: z.string().optional().describe("Billing address: zip code"),
      billing_city: z.string().optional().describe("Billing address: city"),
      billing_country: z.string().optional().describe("Billing address: country (e.g. 'DE')"),
      billing_ust_idnr: z.string().optional().describe("Billing address: VAT ID"),
      billing_email: z.string().optional().describe("Billing address: email"),
      line_items: z.array(lineItemSchema).optional().describe("Invoice line items"),
    }),
    execute: async (params) => {
      const {
        id, customer_id, contact_person_id, project_id,
        payment_term_id,
        billing_company, billing_street, billing_zip, billing_city,
        billing_country, billing_ust_idnr, billing_email,
        line_items, ...rest
      } = params;

      const body: Record<string, unknown> = { ...rest };

      if (payment_term_id) {
        body.payment_term = { id: payment_term_id };
      }

      if (customer_id || contact_person_id || project_id) {
        const customer: Record<string, unknown> = {};
        if (customer_id) customer.id = customer_id;
        if (contact_person_id) customer.contact_person = { id: contact_person_id };
        if (project_id) customer.project = { id: project_id };
        body.customer = customer;
      }

      const billing: Record<string, unknown> = {};
      if (billing_company) billing.company = billing_company;
      if (billing_street) billing.street = billing_street;
      if (billing_zip) billing.zip = billing_zip;
      if (billing_city) billing.city = billing_city;
      if (billing_country) billing.country = billing_country;
      if (billing_ust_idnr) billing.ust_idnr = billing_ust_idnr;
      if (billing_email) billing.email = billing_email;
      if (Object.keys(billing).length > 0) body.billing = billing;

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
      const result = await client.update(`/income/invoices/${id}`, body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_invoice",
    description: "Delete an invoice from Papierkram. Only works on draft invoices.",
    parameters: z.object({
      id: z.number().describe("Invoice ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/income/invoices/${params.id}`);
      return `Invoice ${params.id} deleted successfully.`;
    },
  });

  server.addTool({
    name: "cancel_invoice",
    description: "Cancel an invoice in Papierkram. This creates a cancellation document.",
    parameters: z.object({
      id: z.number().describe("Invoice ID to cancel"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/income/invoices/${params.id}/cancel`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "archive_invoice",
    description: "Archive an invoice in Papierkram.",
    parameters: z.object({
      id: z.number().describe("Invoice ID to archive"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/income/invoices/${params.id}/archive`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "send_invoice",
    description: "Send/deliver an invoice via email in Papierkram.",
    parameters: z.object({
      id: z.number().describe("Invoice ID to send"),
      email: z.string().optional().describe("Recipient email address (uses customer default if omitted)"),
    }),
    execute: async (params) => {
      const { id, email } = params;
      const body: Record<string, unknown> = {
        send_via: "email",
      };
      if (email) {
        body.email = { address: email };
      }
      const client = getClient();
      const result = await client.post(`/income/invoices/${id}/deliver`, body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "download_invoice_pdf",
    description: "Download an invoice as PDF from Papierkram. Returns base64-encoded PDF data.",
    parameters: z.object({
      id: z.number().describe("Invoice ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.getPdf(`/income/invoices/${params.id}/pdf`);
      return JSON.stringify({
        message: `PDF for invoice ${params.id} downloaded successfully.`,
        content_type: result.contentType,
        base64_length: result.base64.length,
        base64: result.base64,
      });
    },
  });
}
