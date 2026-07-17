import { readFileSync } from "node:fs";
import { FastMCP } from "fastmcp";
import { loadConfig } from "../config/index.js";
import { registerResources } from "../core/resources.js";
import { registerTools } from "../core/tools/index.js";
import { registerPrompts } from "../core/prompts.js";

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8")
    ) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function startServer() {
  try {
    // Fail fast at boot if credentials are missing, instead of on the first tool call.
    loadConfig();

    const server = new FastMCP({
      name: "Papierkram MCP Server",
      version: getVersion() as `${number}.${number}.${number}`,
    });

    registerResources(server);
    registerTools(server);
    registerPrompts(server);

    console.error(`Papierkram MCP Server v${getVersion()} initialized`);
    console.error("Server is ready to handle requests");

    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

export default startServer;
