import { describe, it, expect, vi, beforeEach } from "vitest";
import type { z } from "zod";
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

    it("sendet budget_money/budget_time als String (API verlangt String, nicht Zahl)", async () => {
      mockClient.create.mockResolvedValue(fixtures.project);
      const tool = server.getTool("create_project")!;
      await tool.execute({ name: "Budget", customer_id: 100, budget_money: 1000, budget_time: 40 });

      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(body.budget_money).toBe("1000");
      expect(body.budget_time).toBe("40");
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

    it("sendet budget_money/budget_time als String", async () => {
      mockClient.update.mockResolvedValue(fixtures.project);
      const tool = server.getTool("update_project")!;
      await tool.execute({ id: 600, budget_money: 2500, budget_time: 12 });

      const body = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(body.budget_money).toBe("2500");
      expect(body.budget_time).toBe("12");
    });
  });

  // ---- team_members / default_proposition ----
  describe("team_members und default_proposition", () => {
    const run = (name: string, args: Record<string, unknown>) => {
      const tool = server.getTool(name)!;
      return tool.execute((tool.parameters as z.ZodTypeAny).parse(args));
    };

    it("create_project sendet beide Felder im API-Format", async () => {
      mockClient.create.mockResolvedValue(fixtures.project);
      const fields = { team_members: [{ id: 1 }, { id: 2 }], default_proposition: { id: 50 } };

      const result = JSON.parse(await run("create_project", { name: "Team", customer_id: 100, ...fields }));

      expect(mockClient.create).toHaveBeenCalledWith("/projects", { name: "Team", customer: { id: 100 }, ...fields });
      expect(result.team_members).toEqual(fixtures.project.team_members);
    });

    it("create_project ohne die Felder sendet sie nicht", async () => {
      await run("create_project", { name: "Ohne Team", customer_id: 100 });

      const body = mockClient.create.mock.calls[0][1] as Record<string, unknown>;
      expect(Object.keys(body).sort()).toEqual(["customer", "name"]);
    });

    it("update_project sendet beide Felder im API-Format", async () => {
      const fields = { team_members: [{ id: 2 }], default_proposition: { id: 51 } };

      await run("update_project", { id: 600, ...fields });

      expect(mockClient.update).toHaveBeenCalledWith("/projects/600", fields);
    });

    it.each([
      { name: "Umbenannt" },
      { customer_id: 101 },
      { budget_money: 2500 },
      { default_proposition: { id: 50 } },
    ])("update_project ohne team_members sendet das Feld nicht: %o", async (change) => {
      await run("update_project", { id: 600, ...change });

      // Schluessel pruefen: auch team_members: undefined, null oder [] waeren hier falsch
      const body = mockClient.update.mock.calls[0][1] as Record<string, unknown>;
      expect(Object.keys(body)).not.toContain("team_members");
    });

    it("update_project sendet eine ausdruecklich leere Liste", async () => {
      await run("update_project", { id: 600, team_members: [] });

      expect(mockClient.update).toHaveBeenCalledWith("/projects/600", { team_members: [] });
    });

    it.each([
      { team_members: [1, 2] },
      { team_members: [{ id: 0 }] },
      { team_members: [{ id: 1, full_name: "Max Mustermann" }] },
      { team_members: null },
      { default_proposition: 50 },
      { default_proposition: { id: 50, name: "Webentwicklung" } },
    ])("lehnt falsche Formen ab: %o", (bad) => {
      for (const [name, base] of [
        ["create_project", { name: "P", customer_id: 100 }],
        ["update_project", { id: 600 }],
      ] as const) {
        const schema = server.getTool(name)!.parameters as z.ZodTypeAny;
        expect(schema.safeParse({ ...base, ...bad }).success).toBe(false);
      }
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
