import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";

export function registerTrackerTools(server: FastMCP) {
  // ---- Time Entries ----

  server.addTool({
    name: "list_time_entries",
    description: "List all time entries in Papierkram. Supports pagination.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Items per page"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/tracker/time_entries", params as Record<string, string | number | boolean>);
      return JSON.stringify(result, null, 2);
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
    description: "List all tasks in Papierkram. Supports pagination.",
    parameters: z.object({
      page: z.number().optional().describe("Page number"),
      page_size: z.number().optional().describe("Items per page"),
      order_by: z.string().optional().describe("Field to order by"),
      order_direction: z.enum(["asc", "desc"]).optional().describe("Order direction"),
      project_id: z.number().optional().describe("Filter by project ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/tracker/tasks", params as Record<string, string | number | boolean>);
      return JSON.stringify(result, null, 2);
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
