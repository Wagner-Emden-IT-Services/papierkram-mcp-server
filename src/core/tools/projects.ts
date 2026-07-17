import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactProject } from "../../api/transformers.js";
import { toToolJson } from "../../api/format.js";
import { READ_ONLY, CREATE, UPDATE, DESTRUCTIVE, ARCHIVE, idParam, listParams, compactParam } from "./_shared.js";

export function registerProjectTools(server: FastMCP) {
  server.addTool({
    name: "list_projects",
    description:
      "List projects in Papierkram. Returns compact summaries (id, name, record_state, dates, company_id) by default; set compact=false for the full API response. Supports pagination and filtering by company.",
    annotations: { title: "List projects", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
      compact: compactParam,
      company_id: idParam.optional().describe("Filter by company ID"),
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/projects", query as Record<string, string | number | boolean | undefined>);
      if (compact === false) return toToolJson(result);
      return toToolJson(compactList(result as Record<string, unknown>, compactProject));
    },
  });

  server.addTool({
    name: "get_project",
    description: "Get the full project record by ID (budget, dates, state, customer).",
    annotations: { title: "Get project", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Project ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/projects/${params.id}`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "create_project",
    description:
      "Create a new project. Requires name and customer_id (a project must belong to a company). Returns the created project with its new ID.",
    annotations: { title: "Create project", ...CREATE },
    parameters: z
      .object({
        name: z.string().min(1).describe("Project name"),
        customer_id: idParam.describe("Customer (company) ID — required by the API"),
        description: z.string().optional().describe("Project description"),
        start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
        color: z.string().optional().describe("Color code"),
        budget_type: z.string().optional().describe("Budget type (e.g. 'money', 'time')"),
        budget_money: z.number().optional().describe("Money budget"),
        budget_time: z.number().optional().describe("Time budget"),
        budget_time_unit: z.string().optional().describe("Time budget unit (e.g. 'minutes', 'hours')"),
      })
      .strict(),
    execute: async (params) => {
      const { customer_id, ...rest } = params;
      const body: Record<string, unknown> = { ...rest, customer: { id: customer_id } };
      const client = getClient();
      const result = await client.create("/projects", body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "update_project",
    description: "Update an existing project (partial). Only provided fields are changed.",
    annotations: { title: "Update project", ...UPDATE },
    parameters: z
      .object({
        id: idParam.describe("Project ID"),
        name: z.string().min(1).optional().describe("Project name"),
        description: z.string().optional().describe("Project description"),
        start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
        color: z.string().optional().describe("Color code"),
        budget_type: z.string().optional().describe("Budget type"),
        budget_money: z.number().optional().describe("Money budget"),
        budget_time: z.number().optional().describe("Time budget"),
        budget_time_unit: z.string().optional().describe("Time budget unit"),
        customer_id: idParam.optional().describe("Customer (company) ID"),
      })
      .strict(),
    execute: async (params) => {
      const { id, customer_id, ...rest } = params;
      const body: Record<string, unknown> = { ...rest };
      if (customer_id !== undefined) {
        body.customer = { id: customer_id };
      }
      const client = getClient();
      const result = await client.update(`/projects/${id}`, body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "delete_project",
    description: "Permanently delete a project. Returns a confirmation string.",
    annotations: { title: "Delete project", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Project ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/projects/${params.id}`);
      return `Project ${params.id} deleted successfully.`;
    },
  });

  server.addTool({
    name: "unarchive_project",
    description: "Unarchive a project (restore from archive). Reversible via archive_project.",
    annotations: { title: "Unarchive project", ...ARCHIVE },
    parameters: z.object({
      id: idParam.describe("Project ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/projects/${params.id}/unarchive`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "archive_project",
    description: "Archive a project. Reversible via unarchive_project.",
    annotations: { title: "Archive project", ...ARCHIVE },
    parameters: z.object({
      id: idParam.describe("Project ID to archive"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/projects/${params.id}/archive`);
      return toToolJson(result);
    },
  });
}
