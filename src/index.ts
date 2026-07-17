import startServer from "./server/server.js";

async function main() {
  try {
    const server = await startServer();

    await server.start({
      transportType: "stdio",
    });

    console.error("Papierkram MCP Server running on stdio");

    const shutdown = async (signal: string) => {
      console.error(`Received ${signal}, shutting down...`);
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
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
