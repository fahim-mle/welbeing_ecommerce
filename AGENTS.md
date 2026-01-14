# AGENTS.md

This document serves as the primary operational guide for AI agents and developers working in this repository.
It defines the build processes, testing protocols, code style, and architectural standards that must be followed.

## 1. Project Overview & Structure

This is a Monorepo using Node.js workspaces.

- **Root**: Orchestration and shared config.
- **src/backend**: Express.js + TypeScript + Prisma + PostgreSQL (via Docker/Supabase).
- **src/frontend**: React + TypeScript + Vite + Tailwind CSS.

### Key Directories

- `.docs/`: Documentation and task lists.
- `src/backend/src/`: Backend source code.
- `src/frontend/src/`: Frontend source code.

## 2. Build, Lint & Test Commands

### Workspace (Root)

Run these commands from the root directory `/home/ghost/workspace/welbeing_ecommerce`:

- **Install Dependencies**: `npm run install:all` (Installs root and workspace dependencies)
- **Start All Dev Servers**: `npm run dev` (Runs backend and frontend concurrently)
- **Build All**: `npm run build`
- **Test All**: `npm run test`
- **Lint All**: `npm run lint`

### Backend (`src/backend`)

Commands should be run via `npm run <script> --workspace=@welbeing/backend` from root, or inside `src/backend`:

- **Development**: `npm run dev` (Uses `tsx watch`)
- **Build**: `npm run build` (Compiles TS to `dist/`)
- **Lint**: `npm run lint` (ESLint)
- **Test All**: `npm run test` (Jest)
- **Test Single File**: `npx jest path/to/file.test.ts`
- **Test Filter**: `npx jest -t "describe string"`
- **Database Migrate**: `npm run db:migrate` (Prisma migrate dev)
- **Database Seed**: `npm run db:seed` (Runs `prisma/seed.ts`)

### Frontend (`src/frontend`)

Commands should be run via `npm run <script> --workspace=@welbeing/frontend` from root, or inside `src/frontend`:

- **Development**: `npm run dev` (Vite dev server)
- **Build**: `npm run build` (TSC + Vite build)
- **Preview**: `npm run preview` (Preview production build)
- **Lint**: `npm run lint` (ESLint)
- **Test All**: `npm run test` (Vitest)
- **Test Single File**: `npx vitest run path/to/file.test.tsx`
- **Test Filter**: `npx vitest run -t "test description"`

## 3. Code Style & Conventions

### General

- **Language**: TypeScript is mandatory. Use `strict` mode. Avoid `any` - define interfaces/types.
- **Functional**: Prefer functional programming patterns. Pure functions where possible.
- **Conciseness**: Small, composable functions. One logical concern per function.
- **Comments**: Focus on the *WHY*, not the *WHAT*. Do not add comments for obvious code.
- **No Dead Code**: Remove unused imports, variables, and commented-out code immediately.

### Formatting

- **Indentation**: 2 spaces.
- **Quotes**: Single quotes `'` for strings (unless escaping requires double).
- **Semicolons**: Always use semicolons.
- **Trailing Commas**: ES5/ESNext trailing commas where applicable.

### Imports

- **Order**:
  1. External libraries (`react`, `express`, `zod`).
  2. Internal absolute/alias imports (if configured).
  3. Local relative imports (`../components`, `./types`).
- **Cleanliness**: Remove unused imports.

### Naming Conventions

- **Variables/Functions**: `camelCase` (e.g., `fetchProducts`, `isLoading`).
- **Components**: `PascalCase` (e.g., `ProductCard`, `UserProfile`).
- **Types/Interfaces**: `PascalCase` (e.g., `Product`, `AuthResponse`).
- **Files**:
  - React Components: `PascalCase.tsx`
  - Logic/Utilities: `camelCase.ts`
  - Tests: `*.test.ts` or `*.test.tsx`

### Error Handling

- **Backend**:
  - Use custom error classes (`AppError`, `ValidationError`) likely found in `src/backend/src/types/` or `utils/`.
  - Pass errors to the global error handler via `next(err)` in Express controllers.
  - Return structured JSON: `{ success: false, error: { message: "...", code: "..." } }`.
- **Frontend**:
  - Use `try/catch` in async thunks/effects.
  - Display user-friendly error messages (Toasts or Alerts), not raw stack traces.
  - Log errors to console in development.

## 4. Architecture & Patterns

### Backend

- **Layered Architecture**: `Controller` -> `Service` -> `Data Access (Prisma)`.
- **Controllers**: Thin. Validate input (Zod), call Service, send Response.
- **Services**: Contain all business logic.
- **Validation**: Use `zod` schemas for request validation.
- **Database**: Use `prisma` client. Do not write raw SQL unless absolutely necessary.

### Frontend

- **Framework**: React 19 + Vite.
- **Styling**: Tailwind CSS. Use utility classes directly in JSX.
- **Icons**: `lucide-react`.
- **State**: Use Context API for global state (Auth, Cart), local `useState` for UI state.
- **Data Fetching**: Encapsulate `fetch` calls in `src/api/` modules. Do not fetch directly in components.

## 5. Git Strategy

Follow the rules in `.docs/git-strategy.md` strictly.

- **Branch Naming**: `type/ID-description` (e.g., `feature/FF001-add-filters`).
- **Commit Messages**: Descriptive, imperative mood.

## 6. Agent Workflow (Guidance)

1. **Understand**: Read task lists (`.docs/frontend_improvement_tasklist.md`) and related code.
2. **Plan**: Identify files to change. Check for existing patterns.
3. **Implement**: Write code. Use existing components/utilities.
4. **Verify**: Run **LINT** and **TEST** commands before finishing.
   - Frontend: `npm run lint --workspace=@welbeing/frontend && npm run test --workspace=@welbeing/frontend`
   - Backend: `npm run lint --workspace=@welbeing/backend && npm run test --workspace=@welbeing/backend`

## 7. Documentation

- **API Specs**: See `src/backend/API_DOCS.md`.
- **Tasks**: Update `.docs/frontend_improvement_tasklist.md` when tasks are completed.
