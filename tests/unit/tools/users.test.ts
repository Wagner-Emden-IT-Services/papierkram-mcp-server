import { describe, it, expect, vi, beforeEach } from "vitest";
import type { z } from "zod";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerUserTools } from "../../../src/core/tools/users.js";

describe("User Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerUserTools(server as unknown as import("fastmcp").FastMCP);
  });

  // ---- list_users ----
  describe("list_users", () => {
    it("ruft /users mit Paginierung und Sortierung auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.userList);
      const params = { page: 2, page_size: 10, order_by: "id", order_direction: "desc" };

      const result = JSON.parse(await server.getTool("list_users")!.execute(params));

      expect(mockClient.list).toHaveBeenCalledWith("/users", params);
      expect(result).toEqual(fixtures.userList);
    });

    it("begrenzt page_size auf 1 bis 100, Standard 25", () => {
      const schema = server.getTool("list_users")!.parameters as z.ZodTypeAny;

      expect(schema.parse({})).toEqual({ page_size: 25 });
      expect(schema.safeParse({ page_size: 0 }).success).toBe(false);
      expect(schema.safeParse({ page_size: 101 }).success).toBe(false);
    });
  });

  // ---- get_user ----
  describe("get_user", () => {
    it("ruft /users/{id} auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.user);

      const result = JSON.parse(await server.getTool("get_user")!.execute({ id: 1 }));

      expect(mockClient.get).toHaveBeenCalledWith("/users/1");
      expect(result).toEqual(fixtures.user);
    });

    it("verlangt eine positive ganze ID", () => {
      const schema = server.getTool("get_user")!.parameters as z.ZodTypeAny;

      for (const bad of [{}, { id: 0 }, { id: 1.5 }]) expect(schema.safeParse(bad).success).toBe(false);
    });
  });
});
