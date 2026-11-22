import { describe, it, expect, vi, beforeEach } from "vitest";
import type { z } from "zod";
import { createMockClient, type MockClient } from "../../helpers/mock-client.js";
import { createMockServer, type MockServer } from "../../helpers/mock-server.js";
import { fixtures } from "../../helpers/fixtures.js";

let mockClient: MockClient;
vi.mock("../../../src/api/client.js", () => ({ getClient: () => mockClient }));

import { registerInfoTools } from "../../../src/core/tools/info.js";

const REQUIRED = {
  name: "Softwareentwicklung",
  article_no: "AN-00052",
  proposition_type: "service",
  time_unit: "hour",
  vat_rate: "19%",
};

describe("Proposition Tools", () => {
  let server: MockServer;

  /** Validiert wie FastMCP gegen das Schema und fuehrt das Tool dann aus. */
  const run = (name: string, args: Record<string, unknown>) => {
    const tool = server.getTool(name)!;
    return tool.execute((tool.parameters as z.ZodTypeAny).parse(args));
  };
  const accepts = (name: string, args: Record<string, unknown>) =>
    (server.getTool(name)!.parameters as z.ZodTypeAny).safeParse(args).success;

  beforeEach(() => {
    mockClient = createMockClient();
    server = createMockServer();
    registerInfoTools(server as unknown as import("fastmcp").FastMCP);
  });

  // ---- create_proposition ----
  describe("create_proposition", () => {
    it("sendet nur die Pflichtfelder, wenn nur diese angegeben sind", async () => {
      mockClient.create.mockResolvedValue(fixtures.proposition);

      const result = JSON.parse(await run("create_proposition", REQUIRED));

      expect(mockClient.create).toHaveBeenCalledWith("/income/propositions", REQUIRED);
      expect(Object.keys(mockClient.create.mock.calls[0][1] as object).sort()).toEqual(Object.keys(REQUIRED).sort());
      expect(result).toEqual(fixtures.proposition);
    });

    it("sendet alle Felder, price als String", async () => {
      const optional = { description: "Beschreibung", unit_name_1: "Stunde", unit_name_n: "Stunden" };

      await run("create_proposition", { ...REQUIRED, ...optional, price: 150.5 });

      expect(mockClient.create).toHaveBeenCalledWith("/income/propositions", {
        ...REQUIRED,
        ...optional,
        price: "150.5",
      });
    });

    it("behaelt price 0", async () => {
      await run("create_proposition", { ...REQUIRED, price: 0 });

      expect((mockClient.create.mock.calls[0][1] as Record<string, unknown>).price).toBe("0");
    });

    it("reicht vat_rate als Namen durch (anders als bei Belegpositionen kein 0.19)", async () => {
      await run("create_proposition", { ...REQUIRED, vat_rate: "7%" });

      expect((mockClient.create.mock.calls[0][1] as Record<string, unknown>).vat_rate).toBe("7%");
      expect(accepts("create_proposition", { ...REQUIRED, vat_rate: 0.19 })).toBe(false);
    });

    it.each(Object.keys(REQUIRED))("verlangt %s", (field) => {
      const args: Record<string, unknown> = { ...REQUIRED };
      delete args[field];

      expect(accepts("create_proposition", args)).toBe(false);
    });

    it("lehnt Werte ausserhalb der Enums und unbekannte Felder ab", () => {
      expect(accepts("create_proposition", { ...REQUIRED, proposition_type: "goods" })).toBe(false);
      expect(accepts("create_proposition", { ...REQUIRED, time_unit: "minute" })).toBe(false);
      expect(accepts("create_proposition", { ...REQUIRED, unit: "Stunde" })).toBe(false);
    });
  });

  // ---- update_proposition ----
  describe("update_proposition", () => {
    it("sendet nur die angegebenen Felder, id nur im Pfad", async () => {
      mockClient.update.mockResolvedValue(fixtures.proposition);

      const result = JSON.parse(await run("update_proposition", { id: 50, name: "Umbenannt" }));

      expect(mockClient.update).toHaveBeenCalledWith("/income/propositions/50", { name: "Umbenannt" });
      expect(Object.keys(mockClient.update.mock.calls[0][1] as object)).toEqual(["name"]);
      expect(result).toEqual(fixtures.proposition);
    });

    it("sendet alle Felder, price als String", async () => {
      const fields = { ...REQUIRED, description: "Neu", unit_name_1: "Tag", unit_name_n: "Tage" };

      await run("update_proposition", { id: 50, ...fields, price: 0 });

      expect(mockClient.update).toHaveBeenCalledWith("/income/propositions/50", { ...fields, price: "0" });
    });

    it("verlangt id, lehnt falsche Werte und unbekannte Felder ab", () => {
      expect(accepts("update_proposition", { name: "Ohne ID" })).toBe(false);
      expect(accepts("update_proposition", { id: 50, vat_rate: 0.07 })).toBe(false);
      expect(accepts("update_proposition", { id: 50, time_unit: "minute" })).toBe(false);
      expect(accepts("update_proposition", { id: 50, record_state: "archived" })).toBe(false);
    });
  });

  // ---- delete_proposition ----
  describe("delete_proposition", () => {
    it("loescht (204 ohne Body) und gibt eine Bestaetigung zurueck", async () => {
      const result = await run("delete_proposition", { id: 50 });

      expect(mockClient.delete).toHaveBeenCalledWith("/income/propositions/50");
      expect(result).toBe("Proposition 50 deleted successfully.");
    });

    it("meldet keinen Erfolg, wenn die API ablehnt", async () => {
      mockClient.delete.mockRejectedValue(new Error("422"));

      await expect(run("delete_proposition", { id: 50 })).rejects.toThrow("422");
    });
  });

  // ---- archive_proposition / unarchive_proposition ----
  it.each([
    ["archive_proposition", "archive", "archived"],
    ["unarchive_proposition", "unarchive", "active"],
  ])("%s ruft POST .../%s auf", async (tool, action, state) => {
    mockClient.post.mockResolvedValue({ ...fixtures.proposition, record_state: state });

    const result = JSON.parse(await run(tool, { id: 50 }));

    expect(mockClient.post).toHaveBeenCalledWith(`/income/propositions/50/${action}`);
    expect(result.record_state).toBe(state);
  });
});
