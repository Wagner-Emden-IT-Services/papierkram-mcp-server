import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactCompany, compactContactPerson } from "../../api/transformers.js";

export function registerContactTools(server: FastMCP) {
  // ---- Companies ----

  server.addTool({
    name: "list_companies",
    description: "List companies/contacts in Papierkram. Returns compact summaries by default (set compact=false for full details). Supports pagination and filtering by type.",
    parameters: z.object({
      page: z.number().optional().describe("Page number (default: 1)"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
      order_by: z.string().optional().describe("Field to order by (e.g. 'name')"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
      contact_type: z.enum(["customer", "supplier"]).optional().describe("Filter by contact type (note: may be ignored by API)"),
      compact: z.boolean().optional().default(true).describe("Return compact summaries (default: true). Set false for full API response."),
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/contact/companies", query as Record<string, string | number | boolean>);
      if (compact === false) return JSON.stringify(result, null, 2);
      return JSON.stringify(compactList(result as Record<string, unknown>, compactCompany), null, 2);
    },
  });

  server.addTool({
    name: "get_company",
    description: "Get a specific company/contact by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Company ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/contact/companies/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_company",
    description: "Create a new company/contact in Papierkram.",
    parameters: z.object({
      contact_type: z.enum(["customer", "supplier"]).describe("Contact type"),
      name: z.string().describe("Company name"),
      phone: z.string().optional().describe("Phone number"),
      fax: z.string().optional().describe("Fax number"),
      email: z.string().optional().describe("Email address"),
      website: z.string().optional().describe("Website URL"),
      twitter: z.string().optional().describe("Twitter handle"),
      ust_idnr: z.string().optional().describe("VAT ID (USt-IdNr.)"),
      color: z.string().optional().describe("Color code"),
      postal_street: z.string().optional().describe("Postal address: street"),
      postal_city: z.string().optional().describe("Postal address: city"),
      postal_zip: z.string().optional().describe("Postal address: zip code"),
      postal_country: z.string().optional().describe("Postal address: country (e.g. 'DE')"),
      bank_bic: z.string().optional().describe("Bank BIC/SWIFT code"),
      bank_iban: z.string().optional().describe("Bank IBAN"),
      bank_institute: z.string().optional().describe("Bank institute name"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.create("/contact/companies", params);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_company",
    description: "Update an existing company/contact in Papierkram.",
    parameters: z.object({
      id: z.number().describe("Company ID"),
      name: z.string().optional().describe("Company name"),
      phone: z.string().optional().describe("Phone number"),
      fax: z.string().optional().describe("Fax number"),
      email: z.string().optional().describe("Email address"),
      website: z.string().optional().describe("Website URL"),
      twitter: z.string().optional().describe("Twitter handle"),
      ust_idnr: z.string().optional().describe("VAT ID (USt-IdNr.)"),
      note: z.string().optional().describe("Internal notes"),
      color: z.string().optional().describe("Color code"),
      postal_street: z.string().optional().describe("Postal address: street"),
      postal_city: z.string().optional().describe("Postal address: city"),
      postal_zip: z.string().optional().describe("Postal address: zip code"),
      postal_country: z.string().optional().describe("Postal address: country (e.g. 'DE')"),
      bank_bic: z.string().optional().describe("Bank BIC/SWIFT code"),
      bank_iban: z.string().optional().describe("Bank IBAN"),
      bank_institute: z.string().optional().describe("Bank institute name"),
    }),
    execute: async (params) => {
      const { id, ...body } = params;
      const client = getClient();
      const result = await client.update(`/contact/companies/${id}`, body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_company",
    description: "Delete a company/contact from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Company ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/contact/companies/${params.id}`);
      return `Company ${params.id} deleted successfully.`;
    },
  });

  // ---- Contact Persons ----

  server.addTool({
    name: "list_contact_persons",
    description: "List contact persons of a specific company in Papierkram. Returns compact summaries by default.",
    parameters: z.object({
      company_id: z.number().describe("Company ID"),
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
      compact: z.boolean().optional().default(true).describe("Return compact summaries (default: true). Set false for full API response."),
    }),
    execute: async (params) => {
      const { company_id, compact, ...query } = params;
      const client = getClient();
      const result = await client.list(
        `/contact/companies/${company_id}/persons`,
        query as Record<string, string | number | boolean>
      );
      if (compact === false) return JSON.stringify(result, null, 2);
      return JSON.stringify(compactList(result as Record<string, unknown>, compactContactPerson), null, 2);
    },
  });

  server.addTool({
    name: "get_contact_person",
    description: "Get a specific contact person by ID.",
    parameters: z.object({
      company_id: z.number().describe("Company ID"),
      id: z.number().describe("Contact person ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(
        `/contact/companies/${params.company_id}/persons/${params.id}`
      );
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_contact_person",
    description: "Create a new contact person for a company in Papierkram.",
    parameters: z.object({
      company_id: z.number().describe("Company ID"),
      first_name: z.string().describe("First name"),
      last_name: z.string().describe("Last name"),
      title: z.string().optional().describe("Academic title"),
      salutation: z.string().optional().describe("Salutation (e.g. Herr, Frau)"),
      position: z.string().optional().describe("Job position"),
      department: z.string().optional().describe("Department"),
      phone: z.string().optional().describe("Phone number"),
      mobile: z.string().optional().describe("Mobile number"),
      fax: z.string().optional().describe("Fax number"),
      email: z.string().optional().describe("Email address"),
      skype: z.string().optional().describe("Skype name"),
      comment: z.string().optional().describe("Comment"),
      default: z.boolean().optional().describe("Set as default contact"),
    }),
    execute: async (params) => {
      const { company_id, ...body } = params;
      const client = getClient();
      const result = await client.create(
        `/contact/companies/${company_id}/persons`,
        body
      );
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_contact_person",
    description: "Update an existing contact person in Papierkram.",
    parameters: z.object({
      company_id: z.number().describe("Company ID"),
      id: z.number().describe("Contact person ID"),
      first_name: z.string().optional().describe("First name"),
      last_name: z.string().optional().describe("Last name"),
      title: z.string().optional().describe("Academic title"),
      salutation: z.string().optional().describe("Salutation (e.g. Herr, Frau)"),
      position: z.string().optional().describe("Job position"),
      department: z.string().optional().describe("Department"),
      phone: z.string().optional().describe("Phone number"),
      mobile: z.string().optional().describe("Mobile number"),
      fax: z.string().optional().describe("Fax number"),
      email: z.string().optional().describe("Email address"),
      skype: z.string().optional().describe("Skype name"),
      comment: z.string().optional().describe("Comment"),
      default: z.boolean().optional().describe("Set as default contact"),
    }),
    execute: async (params) => {
      const { company_id, id, ...body } = params;
      const client = getClient();
      const result = await client.update(
        `/contact/companies/${company_id}/persons/${id}`,
        body
      );
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_contact_person",
    description: "Delete a contact person from Papierkram.",
    parameters: z.object({
      company_id: z.number().describe("Company ID"),
      id: z.number().describe("Contact person ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(
        `/contact/companies/${params.company_id}/persons/${params.id}`
      );
      return `Contact person ${params.id} deleted successfully.`;
    },
  });
}
