import { FastMCP } from "fastmcp";
import { z } from "zod";
import { getClient } from "../../api/client.js";
import { toToolJson } from "../../api/format.js";
import { READ_ONLY, idParam, listParams } from "./_shared.js";

export function registerUserTools(server: FastMCP) {
  server.addTool({
    name: "list_users",
    description:
      "List the users of the Papierkram account (id, name, role, email). Use the IDs for team_members and user_id.",
    annotations: { title: "List users", ...READ_ONLY },
    parameters: z.object({
      ...listParams,
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.list("/users", params as Record<string, string | number | boolean | undefined>);
      return toToolJson(result);
    },
  });

  server.addTool({
    name: "get_user",
    description: "Get a specific user of the Papierkram account by ID.",
    annotations: { title: "Get user", ...READ_ONLY },
    parameters: z.object({
      id: idParam.describe("User ID"),
    }),
    execute: async (params) => {
      const client = getClient();
      const result = await client.get(`/users/${params.id}`);
      return toToolJson(result);
    },
  });
}
