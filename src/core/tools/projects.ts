import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";

export function registerProjectTools(server: FastMCP) {
  server.addTool({
    name: "list_projects",
    description: "List all projects in Papierkram. Supports pagination.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Items per page"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/projects", params as Record<string, string | number | boolean>);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_project",
    description: "Get a specific project by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Project ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/projects/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_project",
    description: "Create a new project in Papierkram.",
    parameters: z.object({
      name: z.string().describe("Project name"),
      description: z.string().optional().describe("Project description"),
      start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
      color: z.string().optional().describe("Color code"),
      budget_type: z.string().optional().describe("Budget type (e.g. 'money', 'time')"),
      budget_money: z.number().optional().describe("Money budget"),
      budget_time: z.number().optional().describe("Time budget"),
      budget_time_unit: z.string().optional().describe("Time budget unit (e.g. 'minutes', 'hours')"),
      customer_id: z.number().optional().describe("Customer (company) ID"),
    }),
    execute: async (params) => {
      const { customer_id, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (customer_id) {
        body.customer = { id: customer_id };
      }

      const client = getClient();
      const result = await client.create("/projects", body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_project",
    description: "Update an existing project in Papierkram.",
    parameters: z.object({
      id: z.number().describe("Project ID"),
      name: z.string().optional().describe("Project name"),
      description: z.string().optional().describe("Project description"),
      start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
      color: z.string().optional().describe("Color code"),
      budget_type: z.string().optional().describe("Budget type"),
      budget_money: z.number().optional().describe("Money budget"),
      budget_time: z.number().optional().describe("Time budget"),
      budget_time_unit: z.string().optional().describe("Time budget unit"),
      customer_id: z.number().optional().describe("Customer (company) ID"),
    }),
    execute: async (params) => {
      const { id, customer_id, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (customer_id) {
        body.customer = { id: customer_id };
      }

      const client = getClient();
      const result = await client.update(`/projects/${id}`, body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_project",
    description: "Delete a project from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Project ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/projects/${params.id}`);
      return `Project ${params.id} deleted successfully.`;
    },
  });

  server.addTool({
    name: "unarchive_project",
    description: "Unarchive a project in Papierkram (restore from archive).",
    parameters: z.object({
      id: z.number().describe("Project ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/projects/${params.id}/unarchive`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "archive_project",
    description: "Archive a project in Papierkram.",
    parameters: z.object({
      id: z.number().describe("Project ID to archive"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.post(`/projects/${params.id}/archive`);
      return JSON.stringify(result, null, 2);
    },
  });
}
