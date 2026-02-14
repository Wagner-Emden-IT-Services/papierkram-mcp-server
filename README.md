# Papierkram MCP Server

MCP (Model Context Protocol) Server for the [Papierkram.de](https://papierkram.de) accounting API. Enables AI assistants like Claude to interact with your Papierkram account for invoicing, expenses, contacts, projects, time tracking, and more.

## Features

- Full coverage of the Papierkram API v1
- Supports both **stdio** and **HTTP/SSE** transports
- Works with Claude Desktop, Cursor, and any MCP-compatible client
- TypeScript with full type safety

### Supported API areas

| Area | Tools |
|------|-------|
| **Contacts** | List, get, create, update, delete companies; list, get, create contact persons |
| **Invoices** | List, get, create, cancel, archive, send invoices; download PDF |
| **Estimates** | List, get, create estimates; download PDF |
| **Expenses** | List, get, create expense vouchers |
| **Banking** | List, get bank connections and transactions |
| **Projects** | List, get, create, update, archive projects |
| **Time Tracking** | List, get, create, update, delete time entries; list, get, create tasks |
| **Account** | Get account info |

## Setup

### Prerequisites

- Node.js 18+
- A Papierkram.de account with API access

### Installation

```bash
git clone https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server.git
cd papierkram-mcp-server
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
PAPIERKRAM_API_KEY=your-api-key-here
PAPIERKRAM_SUBDOMAIN=your-subdomain
PORT=3001
```

You can find your API key in Papierkram under **Einstellungen > API**.

### Build

```bash
npm run build
```

## Usage

### Stdio transport (for Claude Desktop / Cursor)

```bash
npm run dev        # development
npm start          # production (after build)
```

### HTTP/SSE transport

```bash
npm run dev:http   # development (port 3001)
npm run start:http # production (after build)
```

### Claude Desktop configuration

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "papierkram": {
      "command": "node",
      "args": ["path/to/papierkram-mcp-server/dist/index.js"],
      "env": {
        "PAPIERKRAM_API_KEY": "your-api-key",
        "PAPIERKRAM_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

## Development

```bash
npm run dev        # Run with hot reload (stdio)
npm run dev:http   # Run with hot reload (HTTP/SSE)
npm run build      # Compile TypeScript
```

## License

MIT

## Author

Wagner-Emden IT Services
