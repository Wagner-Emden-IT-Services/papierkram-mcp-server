import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerTrackerTools } from "../../../src/core/tools/tracker.js";

describe("Tracker Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerTrackerTools(server as unknown as import("fastmcp").FastMCP);
  });

  // ==========================================================================
  // TIME ENTRIES
  // ==========================================================================

  describe("list_time_entries", () => {
    it("ruft /tracker/time_entries mit Paginierung auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.timeEntryList);

      const tool = server.getTool("list_time_entries")!;
      await tool.execute({ page: 1, page_size: 25, compact: false });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/tracker/time_entries",
        expect.objectContaining({ page: 1, page_size: 25 }),
      );
    });

    it("gibt Compact-Modus standardmaessig zurueck", async () => {
      mockClient.list.mockResolvedValue(fixtures.timeEntryList);

      const tool = server.getTool("list_time_entries")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: true }));

      expect(result.entries[0]).toHaveProperty("id", 700);
      expect(result.entries[0]).toHaveProperty("started_at");
      expect(result.entries[0]).toHaveProperty("ended_at");
      expect(result.entries[0]).toHaveProperty("duration", 9000);
      expect(result.entries[0]).toHaveProperty("task_id", 800);
      expect(result.entries[0]).toHaveProperty("project_id", 600);
    });

    it("uebergibt project_id als Query-Parameter", async () => {
      mockClient.list.mockResolvedValue(fixtures.timeEntryList);

      const tool = server.getTool("list_time_entries")!;
      await tool.execute({ page_size: 25, compact: false, project_id: 600 });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/tracker/time_entries",
        expect.objectContaining({ project_id: 600 }),
      );
    });

    it("uebergibt alle Filter-Parameter korrekt", async () => {
      mockClient.list.mockResolvedValue(fixtures.timeEntryList);

      const tool = server.getTool("list_time_entries")!;
      await tool.execute({
        page_size: 25,
        compact: false,
        project_id: 600,
        task_id: 800,
        invoice_id: 300,
        user_id: 1,
        billing_state: "unbilled",
        start_time_range_start: "2025-01-01T00:00:00Z",
        start_time_range_end: "2025-12-31T23:59:59Z",
      });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/tracker/time_entries",
        expect.objectContaining({
          project_id: 600,
          task_id: 800,
          invoice_id: 300,
          user_id: 1,
          billing_state: "unbilled",
          start_time_range_start: "2025-01-01T00:00:00Z",
          start_time_range_end: "2025-12-31T23:59:59Z",
        }),
      );
    });
  });

  // ---- get_time_entry ----
  describe("get_time_entry", () => {
    it("ruft /tracker/time_entries/{id} auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.timeEntry);

      const tool = server.getTool("get_time_entry")!;
      const result = JSON.parse(await tool.execute({ id: 700 }));

      expect(mockClient.get).toHaveBeenCalledWith("/tracker/time_entries/700");
      expect(result).toHaveProperty("id", 700);
      expect(result).toHaveProperty("comments", "Frontend-Entwicklung");
    });
  });

  // ---- create_time_entry ----
  describe("create_time_entry", () => {
    it("baut task-Objekt aus task_id", async () => {
      mockClient.create.mockResolvedValue(fixtures.timeEntry);

      const tool = server.getTool("create_time_entry")!;
      await tool.execute({
        entry_date: "2025-01-15",
        started_at_time: "09:00",
        ended_at_time: "11:30",
        task_id: 800,
        user_id: 1,
      });

      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(body).toHaveProperty("task", { id: 800 });
      expect(body).not.toHaveProperty("task_id");
    });

    it("baut IMMER user- und task-Objekt (beide REQUIRED)", async () => {
      mockClient.create.mockResolvedValue(fixtures.timeEntry);

      const tool = server.getTool("create_time_entry")!;
      await tool.execute({
        entry_date: "2025-01-15",
        started_at_time: "09:00",
        ended_at_time: "11:30",
        task_id: 800,
        user_id: 1,
      });

      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(body).toHaveProperty("user", { id: 1 });
      expect(body).toHaveProperty("task", { id: 800 });
      expect(body).not.toHaveProperty("user_id");
    });

    it("verlangt task_id im Schema (API erfordert task)", () => {
      const tool = server.getTool("create_time_entry")!;
      const schema = tool.parameters as { safeParse(v: unknown): { success: boolean } };
      const base = { entry_date: "2025-01-15", started_at_time: "09:00", ended_at_time: "11:30", user_id: 1 };
      expect(schema.safeParse(base).success).toBe(false);
      expect(schema.safeParse({ ...base, task_id: 800 }).success).toBe(true);
    });

    it("sendet alle Felder korrekt an /tracker/time_entries", async () => {
      mockClient.create.mockResolvedValue(fixtures.timeEntry);

      const tool = server.getTool("create_time_entry")!;
      await tool.execute({
        entry_date: "2025-01-15",
        started_at_time: "09:00",
        ended_at_time: "11:30",
        comments: "Frontend-Arbeit",
        unbillable: false,
        task_id: 800,
        user_id: 1,
      });

      expect(mockClient.create).toHaveBeenCalledWith(
        "/tracker/time_entries",
        expect.objectContaining({
          entry_date: "2025-01-15",
          started_at_time: "09:00",
          ended_at_time: "11:30",
          comments: "Frontend-Arbeit",
          unbillable: false,
          task: { id: 800 },
          user: { id: 1 },
        }),
      );
    });
  });

  // ---- update_time_entry ----
  describe("update_time_entry", () => {
    it("trennt id vom Body", async () => {
      mockClient.update.mockResolvedValue(fixtures.timeEntry);

      const tool = server.getTool("update_time_entry")!;
      await tool.execute({ id: 700, comments: "Aktualisiert" });

      expect(mockClient.update).toHaveBeenCalledWith(
        "/tracker/time_entries/700",
        expect.objectContaining({ comments: "Aktualisiert" }),
      );
      const body = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(body).not.toHaveProperty("id");
    });

    it("verschachtelt task und user nur wenn vorhanden", async () => {
      mockClient.update.mockResolvedValue(fixtures.timeEntry);

      const tool = server.getTool("update_time_entry")!;
      await tool.execute({ id: 700, task_id: 801, user_id: 2 });

      const body = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(body).toHaveProperty("task", { id: 801 });
      expect(body).toHaveProperty("user", { id: 2 });
      expect(body).not.toHaveProperty("task_id");
      expect(body).not.toHaveProperty("user_id");
    });

    it("laesst task und user weg wenn nicht angegeben", async () => {
      mockClient.update.mockResolvedValue(fixtures.timeEntry);

      const tool = server.getTool("update_time_entry")!;
      await tool.execute({ id: 700, comments: "Nur Kommentar" });

      const body = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(body).not.toHaveProperty("task");
      expect(body).not.toHaveProperty("user");
    });
  });

  // ---- delete_time_entry ----
  describe("delete_time_entry", () => {
    it("loescht Zeiteintrag und gibt Erfolgsmeldung zurueck", async () => {
      const tool = server.getTool("delete_time_entry")!;
      const result = await tool.execute({ id: 700 });

      expect(mockClient.delete).toHaveBeenCalledWith("/tracker/time_entries/700");
      expect(result).toContain("700");
      expect(result).toContain("deleted");
    });
  });

  // ==========================================================================
  // TASKS
  // ==========================================================================

  describe("list_tasks", () => {
    it("ruft /tracker/tasks mit Paginierung auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.taskList);

      const tool = server.getTool("list_tasks")!;
      await tool.execute({ page: 1, page_size: 25, compact: false });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/tracker/tasks",
        expect.objectContaining({ page: 1, page_size: 25 }),
      );
    });

    it("gibt Compact-Modus standardmaessig zurueck", async () => {
      mockClient.list.mockResolvedValue(fixtures.taskList);

      const tool = server.getTool("list_tasks")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: true }));

      expect(result.entries[0]).toHaveProperty("id", 800);
      expect(result.entries[0]).toHaveProperty("name", "Header implementieren");
      expect(result.entries[0]).toHaveProperty("complete", "75");
      expect(result.entries[0]).toHaveProperty("project_id", 600);
      expect(result.entries[0]).not.toHaveProperty("flagged");
    });

    it("uebergibt project_id als direkte Query", async () => {
      mockClient.list.mockResolvedValue(fixtures.taskList);

      const tool = server.getTool("list_tasks")!;
      await tool.execute({ page_size: 25, compact: false, project_id: 600 });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/tracker/tasks",
        expect.objectContaining({ project_id: 600 }),
      );
    });

    it("uebergibt proposition_id als Query-Parameter", async () => {
      mockClient.list.mockResolvedValue(fixtures.taskList);

      const tool = server.getTool("list_tasks")!;
      await tool.execute({ page_size: 25, compact: false, proposition_id: 50 });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/tracker/tasks",
        expect.objectContaining({ proposition_id: 50 }),
      );
    });
  });

  // ---- get_task ----
  describe("get_task", () => {
    it("ruft /tracker/tasks/{id} auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.task);

      const tool = server.getTool("get_task")!;
      const result = JSON.parse(await tool.execute({ id: 800 }));

      expect(mockClient.get).toHaveBeenCalledWith("/tracker/tasks/800");
      expect(result).toHaveProperty("id", 800);
      expect(result).toHaveProperty("name", "Header implementieren");
    });
  });

  // ---- create_task ----
  describe("create_task", () => {
    it("konvertiert complete als String (CRITICAL)", async () => {
      mockClient.create.mockResolvedValue(fixtures.task);

      const tool = server.getTool("create_task")!;
      await tool.execute({ name: "Neue Aufgabe", complete: 50, project_id: 600 });

      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(body).toHaveProperty("complete", "50");
      // NICHT als Number!
      expect(typeof body.complete).toBe("string");
    });

    it("konvertiert complete: 0 auch zu '0' (falsy aber defined)", async () => {
      mockClient.create.mockResolvedValue(fixtures.task);

      const tool = server.getTool("create_task")!;
      await tool.execute({ name: "Aufgabe bei Null", complete: 0 });

      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(body).toHaveProperty("complete", "0");
      expect(typeof body.complete).toBe("string");
    });

    it("baut project-Objekt aus project_id", async () => {
      mockClient.create.mockResolvedValue(fixtures.task);

      const tool = server.getTool("create_task")!;
      await tool.execute({ name: "Task mit Projekt", project_id: 600 });

      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(body).toHaveProperty("project", { id: 600 });
      expect(body).not.toHaveProperty("project_id");
    });

    it("baut proposition-Objekt aus proposition_id", async () => {
      mockClient.create.mockResolvedValue(fixtures.task);

      const tool = server.getTool("create_task")!;
      await tool.execute({ name: "Task mit Proposition", proposition_id: 50 });

      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(body).toHaveProperty("proposition", { id: 50 });
      expect(body).not.toHaveProperty("proposition_id");
    });

    it("sendet kein complete wenn nicht angegeben", async () => {
      mockClient.create.mockResolvedValue(fixtures.task);

      const tool = server.getTool("create_task")!;
      await tool.execute({ name: "Aufgabe ohne complete" });

      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(body).not.toHaveProperty("complete");
    });

    it("sendet alle Felder korrekt an /tracker/tasks", async () => {
      mockClient.create.mockResolvedValue(fixtures.task);

      const tool = server.getTool("create_task")!;
      await tool.execute({
        name: "Volle Aufgabe",
        complete: 75,
        deadline: "2025-03-01",
        flagged: true,
        project_id: 600,
        proposition_id: 50,
      });

      expect(mockClient.create).toHaveBeenCalledWith(
        "/tracker/tasks",
        expect.objectContaining({
          name: "Volle Aufgabe",
          complete: "75",
          deadline: "2025-03-01",
          flagged: true,
          project: { id: 600 },
          proposition: { id: 50 },
        }),
      );
    });
  });

  // ---- update_task ----
  describe("update_task", () => {
    it("trennt id vom Body und konvertiert complete als String", async () => {
      mockClient.update.mockResolvedValue(fixtures.task);

      const tool = server.getTool("update_task")!;
      await tool.execute({ id: 800, complete: 100 });

      expect(mockClient.update).toHaveBeenCalledWith(
        "/tracker/tasks/800",
        expect.objectContaining({ complete: "100" }),
      );
      const body = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(body).not.toHaveProperty("id");
    });

    it("konvertiert complete: 0 auch bei update zu '0'", async () => {
      mockClient.update.mockResolvedValue(fixtures.task);

      const tool = server.getTool("update_task")!;
      await tool.execute({ id: 800, complete: 0 });

      const body = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(body).toHaveProperty("complete", "0");
      expect(typeof body.complete).toBe("string");
    });

    it("verschachtelt project und proposition korrekt", async () => {
      mockClient.update.mockResolvedValue(fixtures.task);

      const tool = server.getTool("update_task")!;
      await tool.execute({ id: 800, project_id: 601, proposition_id: 51 });

      const body = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(body).toHaveProperty("project", { id: 601 });
      expect(body).toHaveProperty("proposition", { id: 51 });
      expect(body).not.toHaveProperty("project_id");
      expect(body).not.toHaveProperty("proposition_id");
    });
  });

  // ---- delete_task ----
  describe("delete_task", () => {
    it("loescht Task und gibt Erfolgsmeldung zurueck", async () => {
      const tool = server.getTool("delete_task")!;
      const result = await tool.execute({ id: 800 });

      expect(mockClient.delete).toHaveBeenCalledWith("/tracker/tasks/800");
      expect(result).toContain("800");
      expect(result).toContain("deleted");
    });
  });
});
