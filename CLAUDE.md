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
│   │   ├── _shared.ts          # Annotation presets, shared Zod schemas, body builders, vat normalization
│   │   ├── _categories.ts      # Auto-generated expense category enum (from Swagger)
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
│   ├── client.ts               # HTTP client (auth, timeout, error mapping, rate limits)
│   ├── errors.ts               # mapApiError/networkError -> UserError (actionable messages)
│   └── format.ts               # toToolJson: CHARACTER_LIMIT truncation for tool output
└── config/
    └── index.ts                # Environment variable configuration
```

## API Reference

- **Official API docs**: https://demo.papierkram.de/api (ONLY use this as reference, no other sources!)
- **Swagger spec**: https://demo.papierkram.de/api/v1/api-docs/api/v1/swagger.json
- **Demo API for testing**: https://demo.papierkram.de/api/v1 (use for read-only API tests without needing credentials)
- Base URL: `https://{subdomain}.papierkram.de/api/v1`

### Swagger-Spec abrufen und auswerten

Die Swagger-Spec ist eine grosse JSON-Datei. Beim Abrufen per `WebFetch` wird sie abgeschnitten.
Stattdessen immer so vorgehen:

1. **Herunterladen** per `curl` in eine temporaere `.cjs`-Datei (Projekt nutzt `"type": "module"`, daher `.cjs` fuer CommonJS-Scripts):
   ```bash
   curl -s "https://demo.papierkram.de/api/v1/api-docs/api/v1/swagger.json" > /tmp/swagger.json
   ```
2. **Parsen** mit Node.js (`.cjs`-Datei oder `--input-type=commonjs`):
   ```js
   const spec = JSON.parse(require('fs').readFileSync('/tmp/swagger.json', 'utf8'));
   ```
3. **Durchsuchen** nach bestimmten Properties, z.B.:
   - Request-Body-Schema: `spec.paths['/income/invoices'].post.requestBody.content['application/json'].schema.properties`
   - Response-Beispiele: `spec.paths['/income/invoices'].post.responses['201'].content['application/json'].examples`
4. **Hinweis**: Die Swagger-Spec nutzt OpenAPI 3.x-Format mit `requestBody` (nicht Swagger 2.0 `parameters[].in=body`). Viele Endpoints haben leere `parameters: []` - die eigentlichen Request-Body-Felder stehen unter `requestBody.content.application/json.schema.properties`.
5. **Demo-API** (https://demo.papierkram.de/api/v1) erfordert Authentifizierung fuer die meisten Endpoints - zum Pruefen der API-Struktur immer die Swagger-Spec nutzen, nicht die Demo-API direkt aufrufen.

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

## Pre-Push Checkliste (PFLICHT vor jedem Push!)

Vor jedem `git push` muessen folgende Pruefungen bestanden sein:

1. **Build**: `npm run build` — muss fehlerfrei durchlaufen
2. **Tests**: `npm test` — alle Tests muessen bestehen
3. **Tool-Anzahl**: README.md Tool-Anzahl muss mit der tatsaechlichen Anzahl registrierter Tools uebereinstimmen
4. **Version**: `package.json` Version muss mit dem aktuellen/geplanten Git-Tag uebereinstimmen
5. **CHANGELOG.md**: Neue Aenderungen muessen dokumentiert sein
6. **Keine Secrets**: `git diff --cached` pruefen — keine API-Keys, Passwoerter oder .env-Inhalte
7. **Keine ungewollten Dateien**: `git status` — keine temporaeren/lokalen Dateien im Commit
8. **LICENSE vorhanden**: LICENSE-Datei muss im Repo-Root existieren

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
