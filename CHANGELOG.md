# Changelog

Alle relevanten Aenderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/)
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

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

[1.3.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Wagner-Emden-IT-Services/papierkram-mcp-server/releases/tag/v1.0.0
