# Papierkram MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)

An [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) server for the [Papierkram.de](https://papierkram.de) accounting API. Enables AI assistants to manage invoices, expenses, contacts, projects, time tracking and more directly in your Papierkram account.

## Features

- **56 tools** covering the full Papierkram API v1
- **Install via npm**: run directly with `npx papierkram-mcp-server` — no clone needed
- **Two transports**: stdio (for Claude Desktop, Cursor, Claude Code) and HTTP/SSE (for n8n, custom integrations)
- **Docker ready** for easy self-hosted deployment
- TypeScript with Zod schema validation on all parameters

## Tools Overview

| Area | Operations | Count |
|------|-----------|:-----:|
| **Contacts** | Companies & contact persons: list, get, create, update, delete | 10 |
| **Invoices** | list, get, create, update, delete, cancel, archive, send, download PDF | 9 |
| **Estimates** | list, get, create, update, delete, send, download PDF | 7 |
| **Expenses** | list, get, create, update, delete | 5 |
| **Projects** | list, get, create, update, delete, archive, unarchive | 7 |
| **Time Tracking** | list, get, create, update, delete | 5 |
| **Tasks** | list, get, create, update, delete | 5 |
| **Banking** | list, get bank connections & transactions (read-only) | 4 |
| **Account** | Account info, payment terms, propositions | 4 |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ (or Docker)
- A [Papierkram.de](https://papierkram.de) account with API access

### Get your API Key

Go to **Papierkram > Einstellungen > API** and create an API key.

### Option A: npm (recommended)

No clone required — run directly with npx:

```bash
npx papierkram-mcp-server
```

Or install it globally:

```bash
npm install -g papierkram-mcp-server
papierkram-mcp-server
```

The server talks stdio by default; set `PAPIERKRAM_API_KEY` and `PAPIERKRAM_SUBDOMAIN` in your
environment or your MCP client config (see [Usage](#usage)).

### Option B: Docker (self-hosted HTTP/SSE)

```bash
git clone https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server.git
cd papierkram-mcp-server
cp .env.example .env
# Edit .env with your API key and subdomain
docker compose up -d
```

The HTTP/SSE server will be available at `http://localhost:3001/sse`.

### Option C: Node.js from source

```bash
git clone https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server.git
cd papierkram-mcp-server
npm install
cp .env.example .env
# Edit .env with your API key and subdomain
npm run build
```

## Configuration

Create a `.env` file (or copy from `.env.example`):

```env
PAPIERKRAM_API_KEY=your-api-key-here
PAPIERKRAM_SUBDOMAIN=your-subdomain
PORT=3001  # optional, only for HTTP/SSE mode
```

Your subdomain is the part before `.papierkram.de` in your Papierkram URL.

## Usage

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "papierkram": {
      "command": "npx",
      "args": ["-y", "papierkram-mcp-server"],
      "env": {
        "PAPIERKRAM_API_KEY": "your-api-key",
        "PAPIERKRAM_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

> Installed from source instead? Use `"command": "node"` with `"args": ["/absolute/path/to/papierkram-mcp-server/dist/index.js"]`.

### Claude Code (CLI)

Add to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "papierkram": {
      "command": "npx",
      "args": ["-y", "papierkram-mcp-server"],
      "env": {
        "PAPIERKRAM_API_KEY": "your-api-key",
        "PAPIERKRAM_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings with the same configuration as Claude Desktop.

### HTTP/SSE (for n8n or custom clients)

```bash
# Development
npm run dev:http

# Production
npm run start:http

# Docker
docker compose up -d
```

Connect your MCP client to `http://localhost:3001/sse`.

## Development

```bash
npm run dev        # stdio mode with hot reload
npm run dev:http   # HTTP/SSE mode with hot reload
npm run build      # compile TypeScript to dist/
```

### Project Structure

```
src/
├── index.ts              # Stdio entry point
├── server/
│   ├── server.ts         # MCP server setup + tool registration
│   └── http-server.ts    # HTTP/SSE entry point
├── core/tools/           # Tool definitions (one file per API area) + shared helpers
├── api/
│   ├── client.ts         # HTTP client with auth, timeout & error handling
│   ├── errors.ts         # API/network errors -> actionable UserError messages
│   └── format.ts         # Tool-output size guard (truncation)
└── config/
    └── index.ts          # Environment configuration
```

## Contributing

Contributions are welcome! Please open an issue or pull request.

## License

[MIT](LICENSE) - Wagner-Emden IT Services
