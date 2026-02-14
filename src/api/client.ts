import { loadConfig } from "../config/index.js";

export class PapierkramClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const config = loadConfig();
    this.baseUrl = `https://${config.subdomain}.papierkram.de/api/v1`;
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };

    const init: RequestInit = { method, headers };

    if (body) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), init);

    // Handle rate limiting
    const remaining = response.headers.get("X-RateLimit-Remaining");
    if (remaining && parseInt(remaining, 10) <= 5) {
      console.error(
        `[papierkram] Rate limit warning: ${remaining} requests remaining`
      );
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Papierkram API error ${response.status} ${response.statusText}: ${errorBody}`
      );
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  // ---- Generic CRUD helpers ----
  async list<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>("GET", path, undefined, query);
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async create<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async update<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async delete(path: string): Promise<void> {
    return this.request<void>("DELETE", path);
  }

  // ---- Special operations ----
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async getPdf(path: string): Promise<{ base64: string; contentType: string }> {
    const url = new URL(`${this.baseUrl}${path}`);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "*/*",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Papierkram API error ${response.status} ${response.statusText}: ${errorBody}`
      );
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      base64,
      contentType: response.headers.get("Content-Type") || "application/pdf",
    };
  }
}

// Singleton instance
let client: PapierkramClient | null = null;

export function getClient(): PapierkramClient {
  if (!client) {
    client = new PapierkramClient();
  }
  return client;
}
