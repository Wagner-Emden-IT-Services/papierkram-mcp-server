import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerProjectTools } from "../../../src/core/tools/projects.js";

describe("Project Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerProjectTools(server as unknown as import("fastmcp").FastMCP);
  });

  // ---- list_projects ----
  describe("list_projects", () => {
    it("ruft /projects mit Paginierung auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.projectList);

      const tool = server.getTool("list_projects")!;
      await tool.execute({ page: 1, page_size: 25, compact: false });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/projects",
        expect.objectContaining({ page: 1, page_size: 25 }),
      );
    });

    it("gibt Compact-Modus standardmaessig zurueck", async () => {
      mockClient.list.mockResolvedValue(fixtures.projectList);

      const tool = server.getTool("list_projects")!;
      const result = JSON.parse(await tool.execute({ page_size: 25, compact: true }));

      // Compact-Modus: nur die relevanten Felder
      expect(result.entries[0]).toHaveProperty("id", 600);
      expect(result.entries[0]).toHaveProperty("name", "Webseite Redesign");
      expect(result.entries[0]).toHaveProperty("record_state", "active");
      expect(result.entries[0]).not.toHaveProperty("description");
    });

    it("uebergibt company_id als Query-Parameter", async () => {
      mockClient.list.mockResolvedValue(fixtures.projectList);

      const tool = server.getTool("list_projects")!;
      await tool.execute({ page_size: 25, compact: false, company_id: 100 });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/projects",
        expect.objectContaining({ company_id: 100 }),
      );
    });
  });

  // ---- get_project ----
  describe("get_project", () => {
    it("ruft /projects/{id} auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.project);

      const tool = server.getTool("get_project")!;
      const result = JSON.parse(await tool.execute({ id: 600 }));

      expect(mockClient.get).toHaveBeenCalledWith("/projects/600");
      expect(result).toHaveProperty("id", 600);
      expect(result).toHaveProperty("name", "Webseite Redesign");
    });
  });

  // ---- create_project ----
  describe("create_project", () => {
    it("baut customer-Objekt aus customer_id", async () => {
      mockClient.create.mockResolvedValue(fixtures.project);

      const tool = server.getTool("create_project")!;
      await tool.execute({ name: "Neues Projekt", customer_id: 100 });

      expect(mockClient.create).toHaveBeenCalledWith(
        "/projects",
        expect.objectContaining({
          name: "Neues Projekt",
          customer: { id: 100 },
        }),
      );
      // customer_id darf NICHT im Body auftauchen
      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(body).not.toHaveProperty("customer_id");
    });

    it("verlangt customer_id im Schema (API erfordert customer)", () => {
      const tool = server.getTool("create_project")!;
      const schema = tool.parameters as { safeParse(v: unknown): { success: boolean } };
      expect(schema.safeParse({ name: "Projekt ohne Kunde" }).success).toBe(false);
      expect(schema.safeParse({ name: "Mit Kunde", customer_id: 100 }).success).toBe(true);
    });
  });

  // ---- update_project ----
  describe("update_project", () => {
    it("trennt id vom Body und verschachtelt customer korrekt", async () => {
      mockClient.update.mockResolvedValue(fixtures.project);

      const tool = server.getTool("update_project")!;
      await tool.execute({ id: 600, name: "Umbenannt", customer_id: 101 });

      expect(mockClient.update).toHaveBeenCalledWith(
        "/projects/600",
        expect.objectContaining({
          name: "Umbenannt",
          customer: { id: 101 },
        }),
      );
      const body = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(body).not.toHaveProperty("id");
      expect(body).not.toHaveProperty("customer_id");
    });
  });

  // ---- delete_project ----
  describe("delete_project", () => {
    it("loescht Projekt und gibt Erfolgsmeldung zurueck", async () => {
      const tool = server.getTool("delete_project")!;
      const result = await tool.execute({ id: 600 });

      expect(mockClient.delete).toHaveBeenCalledWith("/projects/600");
      expect(result).toContain("600");
      expect(result).toContain("deleted");
    });
  });

  // ---- unarchive_project ----
  describe("unarchive_project", () => {
    it("ruft client.post mit /projects/{id}/unarchive auf", async () => {
      mockClient.post.mockResolvedValue(fixtures.project);

      const tool = server.getTool("unarchive_project")!;
      const result = JSON.parse(await tool.execute({ id: 601 }));

      expect(mockClient.post).toHaveBeenCalledWith("/projects/601/unarchive");
      expect(result).toHaveProperty("id");
    });
  });

  // ---- archive_project ----
  describe("archive_project", () => {
    it("ruft client.post mit /projects/{id}/archive auf", async () => {
      mockClient.post.mockResolvedValue({ ...fixtures.project, record_state: "archived" });

      const tool = server.getTool("archive_project")!;
      const result = JSON.parse(await tool.execute({ id: 600 }));

      expect(mockClient.post).toHaveBeenCalledWith("/projects/600/archive");
      expect(result).toHaveProperty("id");
    });
  });
});
