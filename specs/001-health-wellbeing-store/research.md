# Research Findings: Health and Wellbeing Ecommerce Store

**Feature Branch**: `001-health-wellbeing-store`

## Decisions

### 1. Technology Stack
**Decision**: Full-Stack TypeScript (Node.js)
- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express
- **Language**: TypeScript (shared interfaces for API contracts)

**Rationale**:
- Unified language (TypeScript) reduces context switching.
- React/Express is the most standard, widely supported web stack.
- Vite provides a fast, modern dev experience compared to CRA.
- Tailwind CSS allows rapid UI development for the "health/wellbeing" aesthetic without writing custom CSS files.

**Alternatives Considered**:
- *Python (FastAPI)*: Good, but requires managing two languages (TS + Python).
- *Next.js (Fullstack)*: Powerful, but tightly couples frontend/backend. Separate Express app aligns better with the "Architecture & Scope" requirement for clear separation.

### 2. Database & Storage
**Decision**: SQLite with Prisma ORM
**Rationale**:
- Zero-configuration (file-based), perfect for the "simplicity" constraint and small catalog (5-10 products).
- Prisma provides type-safe database access and easy schema management (migrations).
- Can easily swap to PostgreSQL later if scale increases.

**Alternatives Considered**:
- *PostgreSQL*: Overkill for 10 products; requires Docker/local setup.
- *JSON Files*: Too simple; makes relationships (Categories, Tags) and querying (Filtering) hard.

### 3. Testing Strategy
**Decision**: Vitest (Frontend) + Supertest/Jest (Backend)
**Rationale**:
- Vitest is native to Vite, faster than Jest.
- Supertest is the standard for integration testing Express APIs.

### 4. Authentication
**Decision**: JSON Web Tokens (JWT)
**Rationale**:
- Stateless, simple to implement for both email/password and simulated OAuth flows.
- Easy to secure admin routes via middleware.

## Unresolved Questions
- None.
