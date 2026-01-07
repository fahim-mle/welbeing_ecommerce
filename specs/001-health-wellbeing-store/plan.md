# Implementation Plan: Health and Wellbeing Ecommerce Store

**Branch**: `001-health-wellbeing-store` | **Date**: 2026-01-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-health-wellbeing-store/spec.md`

## Summary

Build a web-based ecommerce platform for health products with a frontend/backend separation. Features include:
- **Core**: Product browsing (by category/goal), "Guest" and "Authenticated" checkout flows.
- **Auth**: Flexible identity model supporting multiple providers (Email, OAuth) linked to a single User account.
- **Catalog**: Products support multiple images via URL references.
- **Admin**: Dashboard for catalog management (no UI for admin user creation).

## Technical Context

**Language/Version**: TypeScript (Node.js v20+)
**Primary Dependencies**: React (Vite), Express.js, Prisma, Tailwind CSS
**Storage**: SQLite (via Prisma)
**Testing**: Vitest (Frontend), Supertest/Jest (Backend)
**Target Platform**: Web (Linux server deployment)
**Project Type**: Web Application (Frontend + Backend)
**Performance Goals**: < 1s search results, < 5 min guest checkout flow
**Constraints**:
- Simulated payment processing.
- Seeded admin accounts (no admin creation UI).
- Image handling via URLs only (no uploads).
- Auth must support multi-provider linking.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Simplicity**: Design prioritizes simplicity (simulated payments, no upload infra).
- [x] **Testability**: Clear separation of concerns allows independent backend/frontend testing.
- [x] **Library-First/Modular**: Backend logic separated from API layer.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file
├── research.md          # Tech stack decisions
├── data-model.md        # Database schema
├── quickstart.md        # Setup guide
├── contracts/           # API specifications
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
# Option 2: Web application
backend/
├── src/
│   ├── api/          # Express routes
│   ├── config/       # Environment config
│   ├── services/     # Business logic
│   └── app.ts        # App entry point
├── prisma/           # Database schema and seeds
└── tests/            # Integration tests

frontend/
├── src/
│   ├── components/   # Reusable UI
│   ├── pages/        # Route pages
│   ├── api/          # API client
│   └── hooks/        # React hooks
└── tests/            # Unit tests
```

**Structure Decision**: Selected Option 2 (Web Application) to clearly separate the API (business logic) from the Client (presentation).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| UserIdentity Table | Multi-provider support | Single-table auth prevents future account linking |
| ProductImage Table | Multiple images per product | Comma-separated strings are brittle and hard to query/order |