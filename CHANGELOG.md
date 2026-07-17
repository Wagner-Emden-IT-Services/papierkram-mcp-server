# Changelog

Alle relevanten Aenderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/)
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [2.0.3] - 2026-07-17

### Behoben

- **`create_project` / `update_project`: `budget_money` und `budget_time`** wurden als Zahl
  gesendet, die Papierkram-API verlangt sie aber als **String** → HTTP 422
  (`did not match: string, null`). Werden jetzt vor dem Senden per `String()` konvertiert
  (analog zum `complete`-Feld bei Aufgaben). Gefunden beim Live-Tool-Test gegen die API.

## [2.0.2] - 2026-07-17

### Behoben

- **Frische Installationen (`npm install -g` / `npx`) crashten beim Start** mit
  `Error: Server does not support completions`. Ursache: Der `overrides`-Pin von
  `@modelcontextprotocol/sdk` auf `1.21.2` wird **nicht** an Konsumenten mitveröffentlicht,
  daher zog ein frischer Install die neueste `@modelcontextprotocol/sdk` (1.29.0), die mit
  `fastmcp@1.27.7` inkompatibel ist. `@modelcontextprotocol/sdk` ist jetzt eine **direkte
  Dependency, gepinnt auf `1.21.2`**, und `fastmcp` ist exakt auf `1.27.7` gepinnt — damit
  bekommen Konsumenten die funktionierende Kombination. (Der lokale Dev-Build war nie
  betroffen, weil dort `overrides` griff.)

## [2.0.1] - 2026-07-17

Packaging-/Infrastruktur-Release (erster Release ueber npm Trusted Publishing / OIDC).

### Geaendert

- **Node >= 20 erforderlich** (Node 18 entfernt): `fastmcp`/`undici` benoetigen das globale `File`,
  das es erst ab Node 20 gibt; Node 18 ist zudem seit April 2025 EOL. `engines` und CI-Matrix (20/22/24) angepasst.

### Behoben

- **Sauberer npm-Tarball**: `dist/` wird vor dem Build geleert (`prebuild`), sodass die in 2.0.0 noch
  enthaltenen toten `api/types.*`-Stubs (Rest der geloeschten Datei) nicht mehr mitgeliefert werden.
- `repository.url` auf `git+https`-Form normalisiert (npm-Publish-Warnung entfaellt).

### Infrastruktur

- npm **Trusted Publishing** (OIDC) via GitHub Actions (`.github/workflows/publish.yml`) — Releases ohne langlebige Tokens.

## [2.0.0] - 2026-07-17

Groesseres Refactoring auf Basis der Anthropic-`mcp-builder`-Best-Practices. Enthaelt
mehrere Korrektheits-Fixes gegen die Papierkram-Swagger-Spec sowie Contract-Aenderungen
(daher Major-Version). Alle 56 Tool-Namen bleiben unveraendert.

### Geaendert (BREAKING)

- **Pflicht-`line_items`**: `create_invoice`, `create_estimate` und `create_expense_voucher` verlangen jetzt mindestens eine Position (`line_items` war zuvor optional, die API erfordert sie).
- **Pflicht-Assoziationen** (von der API verlangt): `create_time_entry` erfordert `task_id`, `create_task` erfordert `project_id`, `create_project` erfordert `customer_id`.
- **`vat_rate`** akzeptiert nun Zahl (Dezimalbruch, z.B. `0.19`) **oder** String (`"19%"`) und wird vor dem Senden auf den API-Dezimalbruch normalisiert. Empfohlenes Format ist jetzt `0.19`.
- **`provenance`** bei Ausgabebelegen: Enum-Wert `non_eu` → **`foreign`** (der bisherige Wert loeste immer HTTP 422 aus).
- **Ausgabe-`category`** ist jetzt ein festes Enum der ~94 gueltigen Papierkram-Kontobezeichnungen statt Freitext.
- **`notes`**: Das interne Notizfeld bei `create_company`/`update_company` heisst jetzt `notes` (API-Feldname). Der alte Parameter `note` wurde von der API stillschweigend verworfen.
- **`.strict()`** auf allen Write-Tools (create/update/send): unbekannte oder vertippte Parameter werden jetzt abgelehnt statt still ignoriert.
- **Schema-Constraints**: IDs muessen positive Ganzzahlen sein, `page_size` ist auf 1–100 begrenzt, E-Mail-Felder werden validiert.
- **Grosse Listen-Antworten** koennen ab 25 000 Zeichen gekuerzt werden (mit `truncated`/`truncation_message`-Metadaten). PDF-Downloads sind ausgenommen.

### Behoben

- `update_company` schrieb die Notiz unter `note` statt `notes` → die Notiz ging still verloren (§ Datenverlust).
- `create_expense_voucher`: `provenance: "non_eu"` fuehrte immer zu HTTP 422 (API erwartet `foreign`).
- `list_companies`: Der `contact_type`-Filter wurde von der API ignoriert; er filtert jetzt client-seitig die zurueckgegebene Seite (mit Hinweis in der Description).
- Falsy-Guards im ID-Handling verwarfen eine legitime `id = 0` (jetzt `!== undefined`).

### Hinzugefuegt

- **MCP-Annotations** (`readOnlyHint`/`destructiveHint`/`idempotentHint`/`openWorldHint` + `title`) auf allen 56 Tools; `send_invoice`/`send_estimate` sind als destruktiv/finalisierend gekennzeichnet.
- **Handlungsleitende Fehlermeldungen** via `UserError` mit statusspezifischer Guidance (401/403/404/422/429/5xx), `Retry-After`-Auswertung bei 429 und Body-Kuerzung (kein Roh-Body-Leak).
- **Request-Timeout** (30 s, konfigurierbar via `PAPIERKRAM_TIMEOUT_MS`) via AbortController.
- **Startup-Fast-Fail**: Der Server validiert Credentials beim Boot statt beim ersten Tool-Call.
- **Graceful Shutdown** bei `SIGINT`/`SIGTERM` (stdio und HTTP).
- **Response-Size-Guard** (`CHARACTER_LIMIT` 25 000) mit Truncation-Hinweisen.
- Erweiterte Tool-Descriptions (Returns-Hinweise, Disambiguierung, Pflichtfelder).

### Geaendert (nicht-breaking)

- Die im MCP-Handshake gemeldete Version wird jetzt aus `package.json` abgeleitet (vorher hart `1.0.0`).
- Intern: geteilte Helfer (Annotations, Schemas, Body-Builder), DRY-Refactor der create/update-Handler, Entfernung des toten `src/api/types.ts`.

### Nicht geaendert (bewusste Entscheidung nach Verifikation)

- **Transport bleibt SSE**: In der installierten fastmcp-Version bedient `httpStream` **nicht** zusaetzlich `/sse` — eine Migration wuerde die bestehende n8n-SSE-Integration brechen. SSE stellt bereits `/health` + `/ping` bereit.
- **PDF-Downloads** liefern weiterhin base64 (fastmcp 1.27.7 hat keinen Embedded-Resource-Content-Typ).
- **Keine Tool-Umbenennung** (kein `papierkram_`-Praefix): MCP-Clients namespacen bereits per Server-ID.

## [1.4.0] - 2026-05-28

### Geaendert (BREAKING)

- `send_invoice` und `send_estimate`: Parameter-Schema komplett ueberarbeitet.
  - Neuer Pflichtparameter `send_via` mit Enum `"email" | "pdf"` (Default `"email"`).
  - `send_via="email"` erfordert nun `recipient`, `subject` und `body` (vorher: nur optionales `email: string`).
  - `send_via="pdf"` finalisiert die Rechnung/das Angebot **ohne** Mailversand — Papierkram vergibt die Dokumentnummer, das PDF wird anschliessend ueber `download_invoice_pdf` / `download_estimate_pdf` abgeholt.
  - Alter Parameter `email: string` entfaellt.

### Behoben

- `send_invoice` / `send_estimate`: HTTP 422 (`additional properties: address`) bei gesetztem `email`-Parameter. Tool sendete frueher `email: { address }`, korrekt laut Papierkram-Swagger ist `email: { recipient, subject, body }` mit `additionalProperties: false`. Issue #1.
- Kein stiller Default-Mail-Versand mehr: ein versehentlicher `send_invoice({ id })`-Aufruf wirft jetzt einen Fehler, statt unbemerkt die Papierkram-Standardmail an die Kunden-Default-Adresse auszuloesen.

### Hinzugefuegt

- `send_via: "pdf"`-Modus ermoeglicht Rechnungs-Finalisierung (RE-Nummern-Vergabe) ohne Mailversand. Workflow: `send_invoice({ id, send_via: "pdf" })` → `download_invoice_pdf({ id })`.

## [1.3.1] - 2026-02-28

### Hinzugefuegt

- `custom_template_id` Parameter fuer `create_invoice`, `update_invoice`, `create_estimate` und `update_estimate`
- Ermoeglicht die Auswahl einer benutzerdefinierten Dokumentenvorlage bei der Erstellung/Aktualisierung

### Dokumentation

- CLAUDE.md: Anleitung zum korrekten Abruf und Parsen der Swagger-Spec ergaenzt

## [1.3.0] - 2026-02-17

### Hinzugefuegt

- Umfassende Test-Suite mit 227 Tests (vitest)
- Unit-Tests fuer alle 56 Tools, 3 Ressourcen und 4 Prompts
- Integrationstests fuer Server-Setup und Tool-Registrierung
- Test-Coverage-Konfiguration

## [1.2.0] - 2026-02-17

### Hinzugefuegt

- `send_estimate` Tool zum Versenden von Angeboten per E-Mail
- Angebot-Versand mit konfigurierbarem Empfaenger und Nachricht

## [1.1.0] - 2026-02-17

### Hinzugefuegt

- Compact Mode fuer reduzierte API-Antworten (weniger Token-Verbrauch)
- API-Filter fuer Listen-Endpunkte (Datum, Status, etc.)
- README komplett ueberarbeitet fuer Public Release

### Behoben

- Diverse Bugfixes in der API-Kommunikation

## [1.0.0] - 2026-02-17

### Hinzugefuegt

- Erstveroeffentlichung des Papierkram MCP Servers
- 55 MCP Tools fuer die Papierkram.de API v1
- Kontakte: Firmen und Ansprechpartner (CRUD)
- Rechnungen: Erstellen, Bearbeiten, Stornieren, Archivieren, Versenden, PDF-Download
- Angebote: CRUD und PDF-Download
- Ausgabebelege: CRUD
- Projekte: CRUD mit Archivierung
- Zeiterfassung: Zeiteintraege und Aufgaben (CRUD)
- Banking: Bankverbindungen und Transaktionen (Lesezugriff)
- Kontoinformationen: Account-Info, Zahlungsbedingungen, Leistungen
- Zwei Transporte: stdio und HTTP/SSE
- Docker-Support mit Multi-Stage Build
- Zod-Schema-Validierung fuer alle Parameter
- MCP Resources und Prompt Templates

[2.0.3]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.4.0...v2.0.0
[1.4.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/releases/tag/v1.0.0
