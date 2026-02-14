import { FastMCP } from "fastmcp";
import { registerResources } from "../core/resources.js";
import { registerTools } from "../core/tools/index.js";
import { registerPrompts } from "../core/prompts.js";

async function startServer() {
  try {
    const server = new FastMCP({
      name: "Papierkram MCP Server",
      version: "1.0.0",
    });

    registerResources(server);
    registerTools(server);
    registerPrompts(server);

    console.error("Papierkram MCP Server initialized");
    console.error("Server is ready to handle requests");

    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

export default startServer;
