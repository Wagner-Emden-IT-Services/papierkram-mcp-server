import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerInfoTools } from "../../../src/core/tools/info.js";

describe("Info Tools", () => {
  let server: MockServer;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerInfoTools(server as unknown as import("fastmcp").FastMCP);
  });

  // ---- get_account_info ----
  describe("get_account_info", () => {
    it("ruft /info auf ohne Parameter", async () => {
      mockClient.get.mockResolvedValue(fixtures.accountInfo);

      const tool = server.getTool("get_account_info")!;
      const result = JSON.parse(await tool.execute({}));

      expect(mockClient.get).toHaveBeenCalledWith("/info");
      expect(result).toHaveProperty("company", "Wagner-Emden IT Services");
      expect(result).toHaveProperty("plan", "professional");
    });
  });

  // ---- list_payment_terms ----
  describe("list_payment_terms", () => {
    it("ruft /income/payment_terms mit Paginierung auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.paymentTermList);

      const tool = server.getTool("list_payment_terms")!;
      const result = JSON.parse(await tool.execute({ page: 1, page_size: 25 }));

      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/payment_terms",
        expect.objectContaining({ page: 1, page_size: 25 }),
      );
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0]).toHaveProperty("name", "Sofort faellig");
    });
  });

  // ---- list_propositions ----
  describe("list_propositions", () => {
    it("ruft /income/propositions mit Paginierung auf", async () => {
      mockClient.list.mockResolvedValue(fixtures.propositionList);

      const tool = server.getTool("list_propositions")!;
      const result = JSON.parse(await tool.execute({ page: 1, page_size: 25 }));

      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/propositions",
        expect.objectContaining({ page: 1, page_size: 25 }),
      );
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toHaveProperty("name", "Webentwicklung");
    });

    it("uebergibt Sortierungsparameter korrekt", async () => {
      mockClient.list.mockResolvedValue(fixtures.propositionList);

      const tool = server.getTool("list_propositions")!;
      await tool.execute({
        page: 1,
        page_size: 10,
        order_by: "name",
        order_direction: "asc",
      });

      expect(mockClient.list).toHaveBeenCalledWith(
        "/income/propositions",
        expect.objectContaining({
          page: 1,
          page_size: 10,
          order_by: "name",
          order_direction: "asc",
        }),
      );
    });
  });

  // ---- get_proposition ----
  describe("get_proposition", () => {
    it("ruft /income/propositions/{id} auf", async () => {
      mockClient.get.mockResolvedValue(fixtures.proposition);

      const tool = server.getTool("get_proposition")!;
      const result = JSON.parse(await tool.execute({ id: 50 }));

      expect(mockClient.get).toHaveBeenCalledWith("/income/propositions/50");
      expect(result).toHaveProperty("id", 50);
      expect(result).toHaveProperty("name", "Webentwicklung");
      expect(result).toHaveProperty("description", "Frontend- und Backend-Entwicklung");
    });
  });
});
