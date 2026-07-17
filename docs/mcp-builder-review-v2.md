# MCP-Builder Review & v2.0 Refactor

Stand: 2026-07-17 · Basis: Anthropic `mcp-builder`-Skill + Papierkram Swagger-Spec

Dieser Report dokumentiert die Review des Papierkram MCP Servers gegen die
`mcp-builder`-Best-Practices und die daraus umgesetzten Aenderungen (Release v2.0.0).

## Vorgehen

- Multi-Agent-Review (11 Reviewer je Dimension + adversariale Verifikation) gegen die
  Best-Practice-Kriterien.
- **Alle** Korrektheits-Findings zusaetzlich manuell gegen die echte Papierkram-Swagger-Spec
  geprueft (nicht aus Analogie uebernommen).
- **Alle** FastMCP-Empfehlungen gegen die *installierte* Version (`fastmcp@1.27.7`,
  `.d.ts` in node_modules) geprueft statt gegen die Doku.

## Korrektheits-Bugs (Swagger-verifiziert, behoben)

| Bug | Datei | Fix |
|---|---|---|
| `update_company` schrieb `note` statt API-Feld `notes` -> stiller Datenverlust | contacts.ts | Feld `notes` (create+update) |
| `provenance: "non_eu"` -> immer HTTP 422 (API kennt nur `domestic`/`eu`/`foreign`) | expenses.ts | Enum-Wert `foreign` |
| `contact_type`-Filter wird von der API ignoriert | contacts.ts | client-seitiger Filter + Doku |
| `line_items` optional, aber API verlangt sie (invoice/estimate/expense) | *.ts | `.min(1)` auf create |
| `task`/`project`/`customer` Pflicht-Assoziationen fehlten | tracker/projects | Pflicht-IDs |
| `vat_rate` als `'19%'`-String vs. API-Dezimalbruch `0.19` | _shared.ts | Union + Normalisierung auf `0.19` |
| `category` Freitext vs. festes API-Enum (94 Werte) | _categories.ts | generiertes `z.enum` |
| Falsy-Guards verwarfen `id = 0` | alle | `!== undefined` |

## Best-Practice-Haertung (nicht-breaking)

- MCP-Annotations (`readOnlyHint`/`destructiveHint`/`idempotentHint`/`openWorldHint` + `title`) auf allen 56 Tools.
- `UserError` mit statusspezifischer, handlungsleitender Meldung; `Retry-After` bei 429; Body-Kuerzung (kein Roh-Body-Leak).
- Request-Timeout (30 s, `PAPIERKRAM_TIMEOUT_MS`) via AbortController.
- Startup-Fast-Fail (Credentials beim Boot) + Graceful Shutdown (SIGINT/SIGTERM).
- Version aus `package.json` (vorher hart `1.0.0`).
- Response-Size-Guard (`toToolJson`, 25 000 Zeichen) mit Truncation-Metadaten.
- `.strict()` auf Write-Tools, Schema-Constraints (ID positiv, `page_size` <= 100, E-Mail-Format).
- DRY: geteilte Helfer (`_shared.ts`), totes `src/api/types.ts` entfernt.

## Bewusst NICHT umgesetzt (nach Verifikation gegen fastmcp 1.27.7)

Der Auto-Report ging von einer neueren FastMCP-API aus. Gegen die installierte Version widerlegt:

1. **SSE -> httpStream nicht migriert.** `startHTTPStreamServer` in 1.27.7 bedient nur `/mcp` (+ `/ping`),
   **nicht** `/sse`. Eine Migration haette die n8n-SSE-Integration gebrochen. SSE liefert bereits `/health` + `/ping`.
2. **Health-Endpoint im Konstruktor** existiert in 1.27.7 nicht (`ServerOptions` kennt kein `health`).
3. **PDF als Embedded-Resource** nicht moeglich: `Content` = `Audio|Image|Text`, kein Resource-Typ. base64 ist ohnehin das Deliverable.
4. **Kein `papierkram_`-Praefix** (Soeren-Entscheidung): MCP-Clients namespacen bereits per Server-ID.
5. **`send_*` Runtime-Guard behalten** (Report empfahl Entfernen als "toter Code"): Tests rufen `execute()` direkt auf
   (umgehen `.refine()`), der Guard ist echte Defense-in-Depth — nur `Error` -> `UserError` gewandelt.

## Zu pruefen (Steuer)

`vat_rate`-Normalisierung auf `0.19` beruht auf den Swagger-Beispielen, wurde aber nicht gegen einen
Produktiv-Beleg getestet. Nach dem Upgrade einmal den MwSt-Betrag auf einer frisch erzeugten Rechnung verifizieren.

## Verifikation

- `npm run build`: gruen · `npm test`: 254 Tests gruen · Coverage-Gate (80/70/80/80): bestanden.
- Tool-Anzahl unveraendert (56); keine Umbenennung.
- Nicht auf npm veroeffentlicht -> Konsumenten sind GitHub/Docker + eigene Deployments.
