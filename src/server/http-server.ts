import startServer from "./server.js";

const PORT = parseInt(process.env.PORT || "3001", 10);

async function main() {
  try {
    const server = await startServer();

    server.start({
      transportType: "sse",
      sse: {
        port: PORT,
        endpoint: "/sse",
      },
    });

    console.error(`Papierkram MCP Server running at http://localhost:${PORT}`);
    console.error(`SSE endpoint: http://localhost:${PORT}/sse`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  console.error("Shutting down server...");
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
