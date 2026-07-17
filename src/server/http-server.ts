import startServer from "./server.js";
import { loadConfig } from "../config/index.js";

async function main() {
  try {
    const { port } = loadConfig();
    const server = await startServer();

    // NOTE: This fastmcp version's "httpStream" transport serves ONLY /mcp (+ /ping)
    // and does NOT co-serve /sse, so migrating would break existing SSE clients
    // (e.g. the documented n8n integration). We therefore keep the SSE transport,
    // which also exposes /health and /ping for orchestration/health checks.
    await server.start({
      transportType: "sse",
      sse: {
        port,
        endpoint: "/sse",
      },
    });

    console.error(`Papierkram MCP Server running at http://localhost:${port}`);
    console.error(`SSE endpoint:   http://localhost:${port}/sse`);
    console.error(`Health check:   http://localhost:${port}/health`);

    const shutdown = async (signal: string) => {
      console.error(`Received ${signal}, shutting down server...`);
      try {
        await server.stop();
      } catch (error) {
        console.error("Error during shutdown:", error);
      }
      process.exit(0);
    };
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      process.on(signal, () => void shutdown(signal));
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
