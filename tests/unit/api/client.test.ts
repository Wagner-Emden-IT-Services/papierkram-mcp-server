import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock loadConfig bevor der Client importiert wird
vi.mock("../../../src/config/index.js", () => ({
  loadConfig: () => ({
    apiKey: "test-api-key-12345",
    subdomain: "test-firma",
    port: 3001,
  }),
}));

import { PapierkramClient, getClient } from "../../../src/api/client.js";

// ---- Hilfs-Funktion: fetch mocken ----

function mockFetch(
  data: unknown,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  } = {}
) {
  const { status = 200, statusText = "OK", headers = {} } = options;
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  } as Response);
}

// ---- Tests ----

describe("PapierkramClient", () => {
  let client: PapierkramClient;

  beforeEach(() => {
    client = new PapierkramClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =============================================
  // 1. Konstruktor
  // =============================================
  describe("Konstruktor", () => {
    it("sollte die BaseURL korrekt aus der Subdomain zusammenbauen", () => {
      const spy = mockFetch({ id: 1 });
      // Einen Request ausfuehren, um die URL zu pruefen
      client.get("/test");
      expect(spy).toHaveBeenCalledWith(
        "https://test-firma.papierkram.de/api/v1/test",
        expect.any(Object)
      );
    });

    it("sollte den API Key aus der Konfiguration setzen", async () => {
      const spy = mockFetch({ id: 1 });
      await client.get("/test");
      const callArgs = spy.mock.calls[0];
      const init = callArgs[1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer test-api-key-12345");
    });
  });

  // =============================================
  // 2. list() - GET mit Query-Parametern
  // =============================================
  describe("list()", () => {
    it("sollte einen GET Request mit Query-Parametern senden", async () => {
      const responseData = { entries: [{ id: 1 }], has_more: false };
      const spy = mockFetch(responseData);

      const result = await client.list("/income/invoices", {
        page: 1,
        page_size: 25,
      });

      expect(spy).toHaveBeenCalledTimes(1);
      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain("/income/invoices");
      expect(url).toContain("page=1");
      expect(url).toContain("page_size=25");
      expect(result).toEqual(responseData);
    });

    it("sollte undefined-Werte aus den Query-Parametern herausfiltern", async () => {
      const spy = mockFetch({ entries: [] });

      await client.list("/income/invoices", {
        page: 1,
        company_id: undefined,
        project_id: undefined,
      });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain("page=1");
      expect(url).not.toContain("company_id");
      expect(url).not.toContain("project_id");
    });

    it("sollte ohne Query-Parameter funktionieren", async () => {
      const spy = mockFetch({ entries: [] });

      await client.list("/companies");

      const url = spy.mock.calls[0][0] as string;
      expect(url).toBe(
        "https://test-firma.papierkram.de/api/v1/companies"
      );
    });

    it("sollte boolean Query-Parameter korrekt als String uebergeben", async () => {
      const spy = mockFetch({ entries: [] });

      await client.list("/tracker/time_entries", {
        billing_state: "billed" as string,
      });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain("billing_state=billed");
    });
  });

  // =============================================
  // 3. get() - Einfacher GET Request
  // =============================================
  describe("get()", () => {
    it("sollte einen einfachen GET Request senden und Daten zurueckgeben", async () => {
      const responseData = { id: 42, name: "Test GmbH" };
      const spy = mockFetch(responseData);

      const result = await client.get("/companies/42");

      expect(spy).toHaveBeenCalledTimes(1);
      const callArgs = spy.mock.calls[0];
      const init = callArgs[1] as RequestInit;
      expect(init.method).toBe("GET");
      expect(result).toEqual(responseData);
    });

    it("sollte keinen Content-Type Header bei GET setzen", async () => {
      const spy = mockFetch({ id: 1 });

      await client.get("/companies/1");

      const init = spy.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBeUndefined();
    });
  });

  // =============================================
  // 4. create() - POST mit JSON Body
  // =============================================
  describe("create()", () => {
    it("sollte einen POST Request mit JSON Body senden", async () => {
      const body = { name: "Neue Firma GmbH", contact_type: "customer" };
      const responseData = { id: 100, ...body };
      const spy = mockFetch(responseData);

      const result = await client.create("/companies", body);

      expect(spy).toHaveBeenCalledTimes(1);
      const callArgs = spy.mock.calls[0];
      const init = callArgs[1] as RequestInit;
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify(body));
      expect(result).toEqual(responseData);
    });

    it("sollte den Content-Type Header auf application/json setzen", async () => {
      const spy = mockFetch({ id: 1 });

      await client.create("/companies", { name: "Test" });

      const init = spy.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });

  // =============================================
  // 5. update() - PUT mit JSON Body
  // =============================================
  describe("update()", () => {
    it("sollte einen PUT Request mit JSON Body senden", async () => {
      const body = { name: "Aktualisierte Firma" };
      const responseData = { id: 42, ...body };
      const spy = mockFetch(responseData);

      const result = await client.update("/companies/42", body);

      const init = spy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe("PUT");
      expect(init.body).toBe(JSON.stringify(body));
      expect(result).toEqual(responseData);
    });
  });

  // =============================================
  // 6. patch() - PATCH mit JSON Body
  // =============================================
  describe("patch()", () => {
    it("sollte einen PATCH Request mit JSON Body senden", async () => {
      const body = { state: "active" };
      const responseData = { id: 42, state: "active" };
      const spy = mockFetch(responseData);

      const result = await client.patch("/companies/42", body);

      const init = spy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe("PATCH");
      expect(init.body).toBe(JSON.stringify(body));
      expect(result).toEqual(responseData);
    });
  });

  // =============================================
  // 7. delete() - DELETE Request
  // =============================================
  describe("delete()", () => {
    it("sollte einen DELETE Request senden und void zurueckgeben", async () => {
      const spy = mockFetch(undefined, { status: 204, statusText: "No Content" });

      const result = await client.delete("/companies/42");

      const init = spy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe("DELETE");
      expect(result).toBeUndefined();
    });
  });

  // =============================================
  // 8. post() - POST mit optionalem Body
  // =============================================
  describe("post()", () => {
    it("sollte einen POST Request mit Body senden", async () => {
      const body = { send_via: "email", email: { address: "test@example.com" } };
      const spy = mockFetch({ success: true });

      await client.post("/income/invoices/42/deliver", body);

      const init = spy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify(body));
    });

    it("sollte einen POST Request ohne Body senden koennen", async () => {
      const spy = mockFetch({ success: true });

      await client.post("/income/invoices/42/cancel");

      const init = spy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe("POST");
      expect(init.body).toBeUndefined();
    });

    it("sollte keinen Content-Type Header setzen wenn kein Body uebergeben wird", async () => {
      const spy = mockFetch({ success: true });

      await client.post("/income/invoices/42/cancel");

      const init = spy.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBeUndefined();
    });
  });

  // =============================================
  // 9. getPdf() - Spezial-Methode
  // =============================================
  describe("getPdf()", () => {
    it("sollte Accept: */* Header senden statt application/json", async () => {
      const spy = mockFetch(null, {
        headers: { "Content-Type": "application/pdf" },
      });

      await client.getPdf("/income/invoices/42/pdf");

      const init = spy.mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers.Accept).toBe("*/*");
    });

    it("sollte base64-kodierten Inhalt zurueckgeben", async () => {
      mockFetch(null, {
        headers: { "Content-Type": "application/pdf" },
      });

      const result = await client.getPdf("/income/invoices/42/pdf");

      expect(result).toHaveProperty("base64");
      expect(typeof result.base64).toBe("string");
    });

    it("sollte den Content-Type aus der Response extrahieren", async () => {
      mockFetch(null, {
        headers: { "Content-Type": "application/pdf" },
      });

      const result = await client.getPdf("/income/invoices/42/pdf");

      expect(result.contentType).toBe("application/pdf");
    });

    it("sollte application/pdf als Fallback verwenden wenn kein Content-Type vorhanden", async () => {
      mockFetch(null, { headers: {} });

      const result = await client.getPdf("/income/invoices/42/pdf");

      expect(result.contentType).toBe("application/pdf");
    });

    it("sollte bei Fehler-Response einen Error werfen", async () => {
      mockFetch("Not Found", { status: 404, statusText: "Not Found" });

      await expect(
        client.getPdf("/income/invoices/99999/pdf")
      ).rejects.toThrow("Papierkram API error 404 Not Found");
    });
  });

  // =============================================
  // 10. Fehlerbehandlung
  // =============================================
  describe("Fehlerbehandlung", () => {
    it("sollte bei 400 Bad Request einen Error mit Status und Body werfen", async () => {
      const errorBody = { error: "Ungueltige Parameter" };
      mockFetch(errorBody, { status: 400, statusText: "Bad Request" });

      await expect(client.get("/companies/invalid")).rejects.toThrow(
        'Papierkram API error 400 Bad Request: {"error":"Ungueltige Parameter"}'
      );
    });

    it("sollte bei 401 Unauthorized einen Error werfen", async () => {
      mockFetch({ error: "Nicht autorisiert" }, { status: 401, statusText: "Unauthorized" });

      await expect(client.get("/companies")).rejects.toThrow(
        "Papierkram API error 401 Unauthorized"
      );
    });

    it("sollte bei 500 Server Error einen Error werfen", async () => {
      mockFetch("Internal Server Error", {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(client.get("/companies")).rejects.toThrow(
        "Papierkram API error 500 Internal Server Error"
      );
    });
  });

  // =============================================
  // 11. 204 No Content
  // =============================================
  describe("204 No Content", () => {
    it("sollte undefined zurueckgeben bei Status 204", async () => {
      mockFetch(undefined, { status: 204, statusText: "No Content" });

      const result = await client.delete("/companies/42");

      expect(result).toBeUndefined();
    });
  });

  // =============================================
  // 12. Rate Limit Warnung
  // =============================================
  describe("Rate Limit Warnung", () => {
    it("sollte console.error aufrufen wenn verbleibende Requests <= 5", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch({ id: 1 }, {
        headers: { "X-RateLimit-Remaining": "3" },
      });

      await client.get("/companies/1");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[papierkram] Rate limit warning: 3 requests remaining"
      );
    });

    it("sollte console.error aufrufen wenn genau 5 Requests verbleiben", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch({ id: 1 }, {
        headers: { "X-RateLimit-Remaining": "5" },
      });

      await client.get("/companies/1");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[papierkram] Rate limit warning: 5 requests remaining"
      );
    });

    it("sollte KEINE Warnung ausgeben wenn mehr als 5 Requests verbleiben", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch({ id: 1 }, {
        headers: { "X-RateLimit-Remaining": "50" },
      });

      await client.get("/companies/1");

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("sollte KEINE Warnung ausgeben wenn kein Rate-Limit-Header vorhanden", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch({ id: 1 });

      await client.get("/companies/1");

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // 13. Query-Parameter
  // =============================================
  describe("Query-Parameter", () => {
    it("sollte mehrere Query-Parameter korrekt in die URL setzen", async () => {
      const spy = mockFetch({ entries: [] });

      await client.list("/tracker/time_entries", {
        project_id: 42,
        billing_state: "billed",
        page: 2,
        page_size: 10,
      });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain("project_id=42");
      expect(url).toContain("billing_state=billed");
      expect(url).toContain("page=2");
      expect(url).toContain("page_size=10");
    });

    it("sollte numerische Werte als String konvertieren", async () => {
      const spy = mockFetch({ entries: [] });

      await client.list("/income/invoices", { company_id: 123 });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain("company_id=123");
    });

    it("sollte boolean Werte als String konvertieren", async () => {
      const spy = mockFetch({ entries: [] });

      await client.list("/test", { active: true });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain("active=true");
    });
  });

  // =============================================
  // 14. Authorization Header
  // =============================================
  describe("Authorization Header", () => {
    it("sollte den Bearer Token bei GET Requests senden", async () => {
      const spy = mockFetch({ id: 1 });
      await client.get("/companies/1");
      const headers = (spy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer test-api-key-12345");
    });

    it("sollte den Bearer Token bei POST Requests senden", async () => {
      const spy = mockFetch({ id: 1 });
      await client.create("/companies", { name: "Test" });
      const headers = (spy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer test-api-key-12345");
    });

    it("sollte den Bearer Token bei getPdf Requests senden", async () => {
      const spy = mockFetch(null, {
        headers: { "Content-Type": "application/pdf" },
      });
      await client.getPdf("/income/invoices/1/pdf");
      const headers = (spy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer test-api-key-12345");
    });
  });

  // =============================================
  // 15. getClient() Singleton
  // =============================================
  describe("getClient() Singleton", () => {
    it("sollte bei mehrfachem Aufruf dieselbe Instanz zurueckgeben", async () => {
      // Da getClient() ein Modul-Level Singleton ist, muessen wir es
      // ueber resetModules testen, um den Singleton-Zustand zurueckzusetzen
      vi.resetModules();

      // Re-Mock nach resetModules
      vi.doMock("../../../src/config/index.js", () => ({
        loadConfig: () => ({
          apiKey: "test-api-key-12345",
          subdomain: "test-firma",
          port: 3001,
        }),
      }));

      const { getClient: freshGetClient } = await import(
        "../../../src/api/client.js"
      );

      const instanz1 = freshGetClient();
      const instanz2 = freshGetClient();

      expect(instanz1).toBe(instanz2);
    });

    it("sollte eine Instanz von PapierkramClient zurueckgeben", () => {
      const instanz = getClient();
      expect(instanz).toBeInstanceOf(PapierkramClient);
    });
  });
});
