# Papierkram MCP Server

## Commands

- `npm run build` - Compile TypeScript to `dist/`
- `npm run dev` - Run stdio server (development, via tsx)
- `npm run dev:http` - Run HTTP/SSE server on port 3001 (development)
- `npm start` - Run compiled stdio server
- `npm run start:http` - Run compiled HTTP/SSE server

## Architecture

```
src/
├── index.ts                    # Stdio entry point
├── server/
│   ├── server.ts               # FastMCP server setup + registration
│   └── http-server.ts          # HTTP/SSE entry point
├── core/
│   ├── tools/                  # MCP tool definitions (one file per API area)
│   │   ├── index.ts            # Aggregator - registers all tools
│   │   ├── contacts.ts         # Companies & contact persons
│   │   ├── invoices.ts         # Income invoices
│   │   ├── estimates.ts        # Income estimates
│   │   ├── expenses.ts         # Expense vouchers
│   │   ├── banking.ts          # Bank connections & transactions
│   │   ├── projects.ts         # Projects
│   │   ├── tracker.ts          # Time entries & tasks
│   │   └── info.ts             # Account info
│   ├── resources.ts            # MCP resource templates
│   └── prompts.ts              # MCP prompt templates
├── api/
│   ├── client.ts               # HTTP client (auth, error handling, rate limits)
│   └── types.ts                # TypeScript types for API responses
└── config/
    └── index.ts                # Environment variable configuration
```

## API Reference

- **Official API docs**: https://demo.papierkram.de/api (ONLY use this as reference, no other sources!)
- **Swagger spec**: https://demo.papierkram.de/api/v1/api-docs/api/v1/swagger.json
- **Demo API for testing**: https://demo.papierkram.de/api/v1 (use for read-only API tests without needing credentials)
- Base URL: `https://{subdomain}.papierkram.de/api/v1`

## Conventions

- **Tool naming**: `verb_noun` (e.g. `list_invoices`, `get_company`, `create_project`)
- **Parameters**: Use Zod schemas with `.describe()` for every field
- **API paths**: Relative to base URL `https://{subdomain}.papierkram.de/api/v1`
- **Returns**: JSON-stringified API responses via `JSON.stringify(result, null, 2)`
- **Errors**: The API client throws with status code + body on non-2xx responses

## Adding a new tool

1. Create or edit the relevant file in `src/core/tools/`
2. Define the tool with `server.addTool({ name, description, parameters, execute })`
3. If it's a new file, import and call the register function in `src/core/tools/index.ts`
4. Use `getClient()` from `../../api/client.js` for API calls

## Environment variables

- `PAPIERKRAM_API_KEY` (required) - API key from Papierkram settings
- `PAPIERKRAM_SUBDOMAIN` (required) - Your Papierkram subdomain
- `PORT` (optional, default: 3001) - HTTP server port

## Deployment

See `DEPLOYMENT.local.md` (not tracked in git) for deployment-specific details.

General deployment with Docker:

```bash
git clone https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server.git
cd papierkram-mcp-server
cp .env.example .env            # Edit with your credentials
docker compose build
docker compose up -d
```
