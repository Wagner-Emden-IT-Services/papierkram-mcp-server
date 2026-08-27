# Papierkram MCP Server — Claude Code

@AGENTS.md

<!--
  Everything above is imported from AGENTS.md — the canonical, cross-agent
  instruction file (also read natively by Codex CLI). Keep ALL shared project
  rules in AGENTS.md so every agent sees them. Add ONLY Claude-Code-specific
  guidance below.
-->

## Claude-Code-specific notes

- **Skills:** `.claude/skills/` is auto-discovered by Claude Code (local, not in
  git). Prefer the `test-runner` skill for the test steps of the Pre-Push
  Checklist and `mcp-builder` when adding or refactoring tools.
- **Global rules:** `~/.claude/CLAUDE.md` (user-wide) also applies and takes
  precedence over this project file where they conflict.
