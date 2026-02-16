import { vi } from "vitest";

interface ToolDef {
  name: string;
  description: string;
  parameters: unknown;
  execute: (params: Record<string, unknown>) => Promise<string>;
}

interface ResourceTemplateDef {
  uriTemplate: string;
  name: string;
  mimeType: string;
  arguments: Array<{ name: string; description: string; required: boolean }>;
  load: (args: Record<string, string>) => Promise<{ text: string }>;
}

interface PromptDef {
  name: string;
  description: string;
  arguments: Array<{ name: string; description: string; required: boolean }>;
  load: (args: Record<string, string>) => Promise<string>;
}

/**
 * Erzeugt einen Mock-FastMCP-Server, der alle addTool/addResourceTemplate/addPrompt-Aufrufe aufzeichnet.
 * Die registrierten Definitionen koennen dann in Tests abgefragt werden.
 */
export function createMockServer() {
  const tools: ToolDef[] = [];
  const resourceTemplates: ResourceTemplateDef[] = [];
  const prompts: PromptDef[] = [];

  return {
    addTool: vi.fn((def: ToolDef) => { tools.push(def); }),
    addResourceTemplate: vi.fn((def: ResourceTemplateDef) => { resourceTemplates.push(def); }),
    addPrompt: vi.fn((def: PromptDef) => { prompts.push(def); }),
    start: vi.fn(),

    // Helfer fuer Tests
    get tools() { return tools; },
    get resourceTemplates() { return resourceTemplates; },
    get prompts() { return prompts; },
    getTool(name: string) { return tools.find((t) => t.name === name); },
    getResourceTemplate(name: string) { return resourceTemplates.find((r) => r.name === name); },
    getPrompt(name: string) { return prompts.find((p) => p.name === name); },
  };
}

export type MockServer = ReturnType<typeof createMockServer>;
