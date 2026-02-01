# Project Docs

This folder contains **tracked** documentation for the project.

## Structure

- `planning/` — design notes, architecture, API/service notes
- `tasks/` — task lists and scoped work items
- `decisions/` — decision logs (high-level choices)
- `adr/` — Architecture Decision Records (lightweight templates)
- `runbooks/` — operational notes (Redis, tooling, etc.)
- `_archive/` — historical / superseded docs kept for reference

## How to use

- Prefer small, evergreen docs over long “mega” documents.
- If a doc is temporary or personal scratch, put it under `.docs/` (ignored by git).

## Trunk-based workflow (summary)

This repo’s long-lived branch is `001-health-wellbeing-store`.
Work should happen on short-lived branches + small PRs, with tests run before merging.

See: `docs/runbooks/git-strategy.md`.
