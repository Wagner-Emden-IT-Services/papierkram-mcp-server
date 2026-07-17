import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactCompany, compactContactPerson } from "../../api/transformers.js";
import { toToolJson } from "../../api/format.js";
import { READ_ONLY, CREATE, UPDATE, DESTRUCTIVE, idParam, listParams, compactParam } from "./_shared.js";

export function registerContactTools(server: FastMCP) {
  // ---- Companies ----

  server.addTool({
    name: "list_companies",
    description:
      "List companies/contacts in Papierkram. Returns compact summaries (id, name, contact_type, email, customer/supplier no.) by default; set compact=false for the full API response. Supports pagination. NOTE: the Papierkram API does not filter by contact_type server-side, so contact_type filters the returned page client-side only.",
    annotations: { title: "List companies", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
      contact_type: z.enum(["customer", "supplier"]).optional().describe("Filter the returned page by contact type (client-side; see note)"),
      compact: compactParam,
    }),
    execute: async (params) => {
      const { compact, contact_type, ...query } = params;
      const client = getClient();
      const result = (await client.list("/contact/companies", query as Record<string, string | number | boolean | undefined>)) as Record<string, unknown>;

      let data = result;
      if (contact_type && Array.isArray(result.entries)) {
        data = { ...result, entries: (result.entries as Array<Record<string, unknown>>).filter((e) => e.contact_type === contact_type) };
      }

      if (compact === false) return toToolJson(data);
      return toToolJson(compactList(data, compactCompany));
    },
  });

  server.addTool({
    name: "get_company",
    description: "Get the full company/contact record by ID.",
    annotations: { title: "Get company", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Company ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/contact/companies/${params.id}`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "create_company",
    description: "Create a new company/contact. Requires contact_type and name. Returns the created company with its new ID.",
    annotations: { title: "Create company", ...CREATE },
    parameters: z
      .object({
        contact_type: z.enum(["customer", "supplier"]).describe("Contact type"),
        name: z.string().min(1).describe("Company name"),
        phone: z.string().optional().describe("Phone number"),
        fax: z.string().optional().describe("Fax number"),
        email: z.string().email().optional().describe("Email address"),
        website: z.string().optional().describe("Website URL"),
        twitter: z.string().optional().describe("Twitter handle"),
        ust_idnr: z.string().optional().describe("VAT ID (USt-IdNr.)"),
        notes: z.string().optional().describe("Internal notes"),
        color: z.string().optional().describe("Color code"),
        postal_street: z.string().optional().describe("Postal address: street"),
        postal_city: z.string().optional().describe("Postal address: city"),
        postal_zip: z.string().optional().describe("Postal address: zip code"),
        postal_country: z.string().optional().describe("Postal address: country (e.g. 'DE')"),
        bank_bic: z.string().optional().describe("Bank BIC/SWIFT code"),
        bank_iban: z.string().optional().describe("Bank IBAN"),
        bank_institute: z.string().optional().describe("Bank institute name"),
      })
      .strict(),
    execute: async (params) => {
      const client = getClient();
      const result = await client.create("/contact/companies", params);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "update_company",
    description: "Update an existing company/contact (partial). Only provided fields are changed.",
    annotations: { title: "Update company", ...UPDATE },
    parameters: z
      .object({
        id: idParam.describe("Company ID"),
        name: z.string().min(1).optional().describe("Company name"),
        phone: z.string().optional().describe("Phone number"),
        fax: z.string().optional().describe("Fax number"),
        email: z.string().email().optional().describe("Email address"),
        website: z.string().optional().describe("Website URL"),
        twitter: z.string().optional().describe("Twitter handle"),
        ust_idnr: z.string().optional().describe("VAT ID (USt-IdNr.)"),
        notes: z.string().optional().describe("Internal notes"),
        color: z.string().optional().describe("Color code"),
        postal_street: z.string().optional().describe("Postal address: street"),
        postal_city: z.string().optional().describe("Postal address: city"),
        postal_zip: z.string().optional().describe("Postal address: zip code"),
        postal_country: z.string().optional().describe("Postal address: country (e.g. 'DE')"),
        bank_bic: z.string().optional().describe("Bank BIC/SWIFT code"),
        bank_iban: z.string().optional().describe("Bank IBAN"),
        bank_institute: z.string().optional().describe("Bank institute name"),
      })
      .strict(),
    execute: async (params) => {
      const { id, ...body } = params;
      const client = getClient();
      const result = await client.update(`/contact/companies/${id}`, body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "delete_company",
    description: "Permanently delete a company/contact. Returns a confirmation string.",
    annotations: { title: "Delete company", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Company ID"),
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
    description:
      "List contact persons of a specific company. Returns compact summaries (id, name, email, position) by default; set compact=false for the full API response.",
    annotations: { title: "List contact persons", ...READ_ONLY },
    parameters: z.object({
      company_id: idParam.describe("Company ID"),
      page: z.number().int().min(1).optional().describe("Page number (1-based)"),
      page_size: z.number().int().min(1).max(100).optional().default(25).describe("Items per page (1-100, default: 25)"),
      compact: compactParam,
    }),
    execute: async (params) => {
      const { company_id, compact, ...query } = params;
      const client = getClient();
      const result = await client.list(
        `/contact/companies/${company_id}/persons`,
        query as Record<string, string | number | boolean | undefined>
      );
      if (compact === false) return toToolJson(result);
      return toToolJson(compactList(result as Record<string, unknown>, compactContactPerson));
    },
  });

  server.addTool({
    name: "get_contact_person",
    description: "Get the full contact person record by ID (within a company).",
    annotations: { title: "Get contact person", ...READ_ONLY },
    parameters: z.object({
      company_id: idParam.describe("Company ID"),
      id: idParam.describe("Contact person ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(
        `/contact/companies/${params.company_id}/persons/${params.id}`
      );
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "create_contact_person",
    description: "Create a new contact person for a company. Requires company_id, first_name, last_name. Returns the created contact with its new ID.",
    annotations: { title: "Create contact person", ...CREATE },
    parameters: z
      .object({
        company_id: idParam.describe("Company ID"),
        first_name: z.string().min(1).describe("First name"),
        last_name: z.string().min(1).describe("Last name"),
        title: z.string().optional().describe("Academic title"),
        salutation: z.string().optional().describe("Salutation (e.g. Herr, Frau)"),
        position: z.string().optional().describe("Job position"),
        department: z.string().optional().describe("Department"),
        phone: z.string().optional().describe("Phone number"),
        mobile: z.string().optional().describe("Mobile number"),
        fax: z.string().optional().describe("Fax number"),
        email: z.string().email().optional().describe("Email address"),
        skype: z.string().optional().describe("Skype name"),
        comment: z.string().optional().describe("Comment"),
        default: z.boolean().optional().describe("Set as default contact"),
      })
      .strict(),
    execute: async (params) => {
      const { company_id, ...body } = params;
      const client = getClient();
      const result = await client.create(
        `/contact/companies/${company_id}/persons`,
        body
      );
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "update_contact_person",
    description: "Update an existing contact person (partial). Only provided fields are changed.",
    annotations: { title: "Update contact person", ...UPDATE },
    parameters: z
      .object({
        company_id: idParam.describe("Company ID"),
        id: idParam.describe("Contact person ID"),
        first_name: z.string().min(1).optional().describe("First name"),
        last_name: z.string().min(1).optional().describe("Last name"),
        title: z.string().optional().describe("Academic title"),
        salutation: z.string().optional().describe("Salutation (e.g. Herr, Frau)"),
        position: z.string().optional().describe("Job position"),
        department: z.string().optional().describe("Department"),
        phone: z.string().optional().describe("Phone number"),
        mobile: z.string().optional().describe("Mobile number"),
        fax: z.string().optional().describe("Fax number"),
        email: z.string().email().optional().describe("Email address"),
        skype: z.string().optional().describe("Skype name"),
        comment: z.string().optional().describe("Comment"),
        default: z.boolean().optional().describe("Set as default contact"),
      })
      .strict(),
    execute: async (params) => {
      const { company_id, id, ...body } = params;
      const client = getClient();
      const result = await client.update(
        `/contact/companies/${company_id}/persons/${id}`,
        body
      );
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "delete_contact_person",
    description: "Permanently delete a contact person. Returns a confirmation string.",
    annotations: { title: "Delete contact person", ...DESTRUCTIVE },
    parameters: z.object({
      company_id: idParam.describe("Company ID"),
      id: idParam.describe("Contact person ID"),
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
