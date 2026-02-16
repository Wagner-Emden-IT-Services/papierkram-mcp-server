import { vi } from "vitest";

/** Erzeugt einen Mock-PapierkramClient mit allen CRUD-Methoden */
export function createMockClient() {
  return {
    list: vi.fn().mockResolvedValue({ entries: [], has_more: false, page: 1, total_pages: 1 }),
    get: vi.fn().mockResolvedValue({ id: 1 }),
    create: vi.fn().mockResolvedValue({ id: 1 }),
    update: vi.fn().mockResolvedValue({ id: 1 }),
    patch: vi.fn().mockResolvedValue({ id: 1 }),
    delete: vi.fn().mockResolvedValue(undefined),
    post: vi.fn().mockResolvedValue({ id: 1 }),
    getPdf: vi.fn().mockResolvedValue({
      base64: "JVBER0FakeBase64==",
      contentType: "application/pdf",
    }),
  };
}

export type MockClient = ReturnType<typeof createMockClient>;
