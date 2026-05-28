# Changelog

Alle relevanten Aenderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/)
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

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

[1.3.1]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/releases/tag/v1.0.0
