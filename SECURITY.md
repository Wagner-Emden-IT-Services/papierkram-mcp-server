# Security Policy

## Unterstuetzte Versionen

| Version | Unterstuetzt       |
|---------|:------------------:|
| 1.3.x   | :white_check_mark: |
| < 1.3   | :x:                |

## Sicherheitsproblem melden

Falls du eine Sicherheitsluecke in diesem Projekt findest, melde sie bitte **nicht** ueber ein oeffentliches GitHub Issue.

Stattdessen sende eine E-Mail an: **security@wagner-emden.de**

Bitte beschreibe:

- Art der Sicherheitsluecke
- Schritte zur Reproduktion
- Moegliche Auswirkungen
- Falls vorhanden: Vorschlag zur Behebung

Wir bestaetigen den Eingang innerhalb von **48 Stunden** und arbeiten an einer Loesung. Nach der Behebung wird ein Security Advisory veroeffentlicht.

## Allgemeine Sicherheitshinweise

- **API-Keys** gehoeren in `.env`-Dateien, niemals in den Quellcode
- Die `.env`-Datei ist in `.gitignore` gelistet und wird nicht committed
- Der Server validiert alle Eingaben ueber Zod-Schemas
- HTTPS wird fuer alle API-Aufrufe an Papierkram.de verwendet
