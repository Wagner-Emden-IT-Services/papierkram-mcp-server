import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactTimeEntry, compactTask } from "../../api/transformers.js";

export function registerTrackerTools(server: FastMCP) {
  // ---- Time Entries ----

  server.addTool({
    name: "list_time_entries",
    description: "List time entries in Papierkram. Returns compact summaries by default. Supports pagination and filtering.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
      compact: z.boolean().optional().default(true).describe("Return compact summaries (default: true). Set false for full API response."),
      project_id: z.number().optional().describe("Filter by project ID"),
      task_id: z.number().optional().describe("Filter by task ID"),
      invoice_id: z.number().optional().describe("Filter by invoice ID"),
      user_id: z.number().optional().describe("Filter by user ID"),
      billing_state: z.enum(["billed", "unbilled", "billable", "unbillable", "archived"]).optional().describe("Filter by billing state"),
      start_time_range_start: z.string().optional().describe("Filter by start time range start (RFC 3339, e.g. '2025-01-01T00:00:00Z')"),
      start_time_range_end: z.string().optional().describe("Filter by start time range end (RFC 3339, e.g. '2025-12-31T23:59:59Z')"),
    }),
    execute: async (params) => {
      const { compact, project_id, task_id, invoice_id, user_id, billing_state, start_time_range_start, start_time_range_end, ...query } = params;
      if (project_id) (query as Record<string, unknown>).project_id = project_id;
      if (task_id) (query as Record<string, unknown>).task_id = task_id;
      if (invoice_id) (query as Record<string, unknown>).invoice_id = invoice_id;
      if (user_id) (query as Record<string, unknown>).user_id = user_id;
      if (billing_state) (query as Record<string, unknown>).billing_state = billing_state;
      if (start_time_range_start) (query as Record<string, unknown>).start_time_range_start = start_time_range_start;
      if (start_time_range_end) (query as Record<string, unknown>).start_time_range_end = start_time_range_end;
      const client = getClient();
      const result = await client.list("/tracker/time_entries", query as Record<string, string | number | boolean>);
      if (compact === false) return JSON.stringify(result, null, 2);
      return JSON.stringify(compactList(result as Record<string, unknown>, compactTimeEntry), null, 2);
    },
  });

  server.addTool({
    name: "get_time_entry",
    description: "Get a specific time entry by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Time entry ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/tracker/time_entries/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_time_entry",
    description: "Create a new time entry in Papierkram.",
    parameters: z.object({
      entry_date: z.string().describe("Date of the entry (YYYY-MM-DD)"),
      started_at_time: z.string().describe("Start time (HH:MM, e.g. '09:00')"),
      ended_at_time: z.string().describe("End time (HH:MM, e.g. '10:30')"),
      comments: z.string().optional().describe("Description of work done"),
      unbillable: z.boolean().optional().describe("Mark as not billable"),
      task_id: z.number().optional().describe("Associated task ID"),
      user_id: z.number().describe("User ID (required, use 1 for account owner)"),
    }),
    execute: async (params) => {
      const { task_id, user_id, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (task_id) {
        body.task = { id: task_id };
      }
      body.user = { id: user_id };

      const client = getClient();
      const result = await client.create("/tracker/time_entries", body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_time_entry",
    description: "Update an existing time entry in Papierkram.",
    parameters: z.object({
      id: z.number().describe("Time entry ID"),
      entry_date: z.string().optional().describe("Date of the entry (YYYY-MM-DD)"),
      started_at_time: z.string().optional().describe("Start time (HH:MM, e.g. '09:00')"),
      ended_at_time: z.string().optional().describe("End time (HH:MM, e.g. '10:30')"),
      comments: z.string().optional().describe("Description of work done"),
      unbillable: z.boolean().optional().describe("Mark as not billable"),
      task_id: z.number().optional().describe("Associated task ID"),
      user_id: z.number().optional().describe("User ID"),
    }),
    execute: async (params) => {
      const { id, task_id, user_id, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (task_id) {
        body.task = { id: task_id };
      }
      if (user_id) {
        body.user = { id: user_id };
      }

      const client = getClient();
      const result = await client.update(`/tracker/time_entries/${id}`, body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_time_entry",
    description: "Delete a time entry from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Time entry ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/tracker/time_entries/${params.id}`);
      return `Time entry ${params.id} deleted successfully.`;
    },
  });

  // ---- Tasks ----

  server.addTool({
    name: "list_tasks",
    description: "List tasks in Papierkram. Returns compact summaries by default. Supports pagination and filtering by project.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().default(25).describe("Items per page (default: 25)"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
      project_id: z.number().optional().describe("Filter by project ID"),
      proposition_id: z.number().optional().describe("Filter by proposition ID"),
      compact: z.boolean().optional().default(true).describe("Return compact summaries (default: true). Set false for full API response."),
    }),
    execute: async (params) => {
      const { compact, proposition_id, ...query } = params;
      if (proposition_id) (query as Record<string, unknown>).proposition_id = proposition_id;
      const client = getClient();
      const result = await client.list("/tracker/tasks", query as Record<string, string | number | boolean>);
      if (compact === false) return JSON.stringify(result, null, 2);
      return JSON.stringify(compactList(result as Record<string, unknown>, compactTask), null, 2);
    },
  });

  server.addTool({
    name: "get_task",
    description: "Get a specific task by ID from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Task ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/tracker/tasks/${params.id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "create_task",
    description: "Create a new task in Papierkram.",
    parameters: z.object({
      name: z.string().describe("Task name"),
      relative_costs: z.number().optional().describe("Relative cost rate"),
      complete: z.number().optional().describe("Completion percentage (0-100)"),
      deadline: z.string().optional().describe("Deadline (YYYY-MM-DD)"),
      flagged: z.boolean().optional().describe("Flag the task"),
      project_id: z.number().optional().describe("Associated project ID"),
      proposition_id: z.number().optional().describe("Associated proposition ID"),
    }),
    execute: async (params) => {
      const { project_id, proposition_id, complete, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (complete !== undefined) {
        body.complete = String(complete);
      }

      if (project_id) {
        body.project = { id: project_id };
      }
      if (proposition_id) {
        body.proposition = { id: proposition_id };
      }

      const client = getClient();
      const result = await client.create("/tracker/tasks", body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "update_task",
    description: "Update an existing task in Papierkram.",
    parameters: z.object({
      id: z.number().describe("Task ID"),
      name: z.string().optional().describe("Task name"),
      relative_costs: z.number().optional().describe("Relative cost rate"),
      complete: z.number().optional().describe("Completion percentage (0-100)"),
      deadline: z.string().optional().describe("Deadline (YYYY-MM-DD)"),
      flagged: z.boolean().optional().describe("Flag the task"),
      project_id: z.number().optional().describe("Associated project ID"),
      proposition_id: z.number().optional().describe("Associated proposition ID"),
    }),
    execute: async (params) => {
      const { id, project_id, proposition_id, complete, ...rest } = params;

      const body: Record<string, unknown> = { ...rest };

      if (complete !== undefined) {
        body.complete = String(complete);
      }

      if (project_id) {
        body.project = { id: project_id };
      }
      if (proposition_id) {
        body.proposition = { id: proposition_id };
      }

      const client = getClient();
      const result = await client.update(`/tracker/tasks/${id}`, body);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "delete_task",
    description: "Delete a task from Papierkram.",
    parameters: z.object({
      id: z.number().describe("Task ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/tracker/tasks/${params.id}`);
      return `Task ${params.id} deleted successfully.`;
    },
  });
}
