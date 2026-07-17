import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { compactList, compactTimeEntry, compactTask } from "../../api/transformers.js";
import { toToolJson } from "../../api/format.js";
import { READ_ONLY, CREATE, UPDATE, DESTRUCTIVE, idParam, listParams, compactParam } from "./_shared.js";

export function registerTrackerTools(server: FastMCP) {
  // ---- Time Entries ----

  server.addTool({
    name: "list_time_entries",
    description:
      "List time entries in Papierkram. Returns compact summaries (id, times, duration, comments, task/project) by default; set compact=false for the full API response. Supports pagination and filtering.",
    annotations: { title: "List time entries", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
      compact: compactParam,
      project_id: idParam.optional().describe("Filter by project ID"),
      task_id: idParam.optional().describe("Filter by task ID"),
      invoice_id: idParam.optional().describe("Filter by invoice ID"),
      user_id: idParam.optional().describe("Filter by user ID"),
      billing_state: z.enum(["billed", "unbilled", "billable", "unbillable", "archived"]).optional().describe("Filter by billing state"),
      start_time_range_start: z.string().optional().describe("Filter by start time range start (RFC 3339, e.g. '2025-01-01T00:00:00Z')"),
      start_time_range_end: z.string().optional().describe("Filter by start time range end (RFC 3339, e.g. '2025-12-31T23:59:59Z')"),
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/tracker/time_entries", query as Record<string, string | number | boolean | undefined>);
      if (compact === false) return toToolJson(result);
      return toToolJson(compactList(result as Record<string, unknown>, compactTimeEntry));
    },
  });

  server.addTool({
    name: "get_time_entry",
    description: "Get the full time entry record by ID.",
    annotations: { title: "Get time entry", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Time entry ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/tracker/time_entries/${params.id}`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "create_time_entry",
    description:
      "Create a new time entry. Requires entry_date, start/end time, task_id and user_id (the API requires a task and a user). Returns the created entry with its new ID.",
    annotations: { title: "Create time entry", ...CREATE },
    parameters: z
      .object({
        entry_date: z.string().describe("Date of the entry (YYYY-MM-DD)"),
        started_at_time: z.string().describe("Start time (HH:MM, e.g. '09:00')"),
        ended_at_time: z.string().describe("End time (HH:MM, e.g. '10:30')"),
        task_id: idParam.describe("Associated task ID — required by the API"),
        user_id: idParam.describe("User ID (required, use 1 for account owner)"),
        comments: z.string().optional().describe("Description of work done"),
        unbillable: z.boolean().optional().describe("Mark as not billable"),
      })
      .strict(),
    execute: async (params) => {
      const { task_id, user_id, ...rest } = params;
      const body: Record<string, unknown> = { ...rest, task: { id: task_id }, user: { id: user_id } };
      const client = getClient();
      const result = await client.create("/tracker/time_entries", body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "update_time_entry",
    description: "Update an existing time entry (partial). Only provided fields are changed.",
    annotations: { title: "Update time entry", ...UPDATE },
    parameters: z
      .object({
        id: idParam.describe("Time entry ID"),
        entry_date: z.string().optional().describe("Date of the entry (YYYY-MM-DD)"),
        started_at_time: z.string().optional().describe("Start time (HH:MM, e.g. '09:00')"),
        ended_at_time: z.string().optional().describe("End time (HH:MM, e.g. '10:30')"),
        comments: z.string().optional().describe("Description of work done"),
        unbillable: z.boolean().optional().describe("Mark as not billable"),
        task_id: idParam.optional().describe("Associated task ID"),
        user_id: idParam.optional().describe("User ID"),
      })
      .strict(),
    execute: async (params) => {
      const { id, task_id, user_id, ...rest } = params;
      const body: Record<string, unknown> = { ...rest };
      if (task_id !== undefined) {
        body.task = { id: task_id };
      }
      if (user_id !== undefined) {
        body.user = { id: user_id };
      }
      const client = getClient();
      const result = await client.update(`/tracker/time_entries/${id}`, body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "delete_time_entry",
    description: "Permanently delete a time entry. Returns a confirmation string.",
    annotations: { title: "Delete time entry", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Time entry ID"),
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
    description:
      "List tasks (Tracker-Aufgaben) in Papierkram. Returns compact summaries (id, name, complete, deadline, project) by default; set compact=false for the full API response. Supports pagination and filtering by project.",
    annotations: { title: "List tasks", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
      project_id: idParam.optional().describe("Filter by project ID"),
      proposition_id: idParam.optional().describe("Filter by proposition ID"),
      compact: compactParam,
    }),
    execute: async (params) => {
      const { compact, ...query } = params;
      const client = getClient();
      const result = await client.list("/tracker/tasks", query as Record<string, string | number | boolean | undefined>);
      if (compact === false) return toToolJson(result);
      return toToolJson(compactList(result as Record<string, unknown>, compactTask));
    },
  });

  server.addTool({
    name: "get_task",
    description: "Get the full task record by ID.",
    annotations: { title: "Get task", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("Task ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/tracker/tasks/${params.id}`);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "create_task",
    description:
      "Create a new task (Tracker-Aufgabe). Requires name and project_id (a task must belong to a project). Returns the created task with its new ID.",
    annotations: { title: "Create task", ...CREATE },
    parameters: z
      .object({
        name: z.string().min(1).describe("Task name"),
        project_id: idParam.describe("Associated project ID — required by the API"),
        relative_costs: z.number().optional().describe("Relative cost rate"),
        complete: z.number().int().min(0).max(100).optional().describe("Completion percentage (0-100)"),
        deadline: z.string().optional().describe("Deadline (YYYY-MM-DD)"),
        flagged: z.boolean().optional().describe("Flag the task"),
        proposition_id: idParam.optional().describe("Associated proposition ID"),
      })
      .strict(),
    execute: async (params) => {
      const { project_id, proposition_id, complete, ...rest } = params;
      const body: Record<string, unknown> = { ...rest, project: { id: project_id } };
      if (complete !== undefined) {
        body.complete = String(complete);
      }
      if (proposition_id !== undefined) {
        body.proposition = { id: proposition_id };
      }
      const client = getClient();
      const result = await client.create("/tracker/tasks", body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "update_task",
    description: "Update an existing task (partial). Only provided fields are changed.",
    annotations: { title: "Update task", ...UPDATE },
    parameters: z
      .object({
        id: idParam.describe("Task ID"),
        name: z.string().min(1).optional().describe("Task name"),
        relative_costs: z.number().optional().describe("Relative cost rate"),
        complete: z.number().int().min(0).max(100).optional().describe("Completion percentage (0-100)"),
        deadline: z.string().optional().describe("Deadline (YYYY-MM-DD)"),
        flagged: z.boolean().optional().describe("Flag the task"),
        project_id: idParam.optional().describe("Associated project ID"),
        proposition_id: idParam.optional().describe("Associated proposition ID"),
      })
      .strict(),
    execute: async (params) => {
      const { id, project_id, proposition_id, complete, ...rest } = params;
      const body: Record<string, unknown> = { ...rest };
      if (complete !== undefined) {
        body.complete = String(complete);
      }
      if (project_id !== undefined) {
        body.project = { id: project_id };
      }
      if (proposition_id !== undefined) {
        body.proposition = { id: proposition_id };
      }
      const client = getClient();
      const result = await client.update(`/tracker/tasks/${id}`, body);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "delete_task",
    description: "Permanently delete a task. Returns a confirmation string.",
    annotations: { title: "Delete task", ...DESTRUCTIVE },
    parameters: z.object({
      id: idParam.describe("Task ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      await client.delete(`/tracker/tasks/${params.id}`);
      return `Task ${params.id} deleted successfully.`;
    },
  });
}
