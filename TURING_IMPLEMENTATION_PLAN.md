# Turing Implementation Plan — Welbeing E-Commerce Improvements

Branch: `turing-dev` from `001-health-wellbeing-store`
Source guideline: `IMPROVEMENT_PLAN.md` by Al-Biruni

## Operating rules

- Work only on `turing-dev`.
- Keep commits small and meaningful.
- Use conventional-style commit headings: `docs:`, `test:`, `feat:`, `fix:`, `refactor:`, `design-update:`.
- For each feature phase:
  1. inspect current code paths and tests,
  2. add/adjust tests first where practical,
  3. implement the smallest coherent slice,
  4. run focused tests/builds,
  5. commit,
  6. push to GitHub.
- Do not introduce real paid-provider credentials. Integrations must degrade safely when env vars are missing.
- Do not touch unrelated Hermes/profile/system config.

## Phase 0 — Baseline and branch hygiene

**Goal:** Establish the working branch, commit the guidelines and execution plan, and verify the existing baseline.

Tasks:
- Confirm branch `turing-dev` tracks GitHub.
- Commit `IMPROVEMENT_PLAN.md` and this implementation plan.
- Run baseline install/build/test commands enough to know current failures before changing code.

Verification:
- `git status --short --branch`
- `npm run build`
- targeted test commands if full suite is already known to be unstable.

## Phase 1 — Centralized frontend theme system

**Goal:** Replace hardcoded `indigo-*` and most `gray-*` utility classes with Tailwind v4 semantic theme tokens.

Implementation slices:
1. Update `src/frontend/src/index.css` with theme tokens and component classes.
2. Replace hardcoded color utilities across `src/frontend/src/**/*.tsx` using the guideline mapping.
3. Remove/dead-code-clean `App.css` if it is not imported.
4. Add/adjust tests only where class assertions need token updates.

Verification:
- Search proves no unintended `indigo-` classes remain in TSX.
- Search proves no unintended `gray-` classes remain in TSX except documented dark backgrounds/status exceptions.
- `npm run build --workspace=@welbeing/frontend`
- `npm run test --workspace=@welbeing/frontend`

Commit heading:
- `design-update: centralize frontend theme tokens`

## Phase 2 — Backend image upload foundation

**Goal:** Add local image upload with a storage abstraction ready for S3 later.

Implementation slices:
1. Install backend dependencies: `multer`, `sharp`, `@types/multer`.
2. Add storage types, image validation/processing, local storage adapter, and storage factory.
3. Add upload middleware and protected admin upload route.
4. Serve `/uploads` statically and document env vars without committing secrets.
5. Add backend unit/integration tests for validation and upload behavior.

Verification:
- Focused backend tests for storage/upload.
- `npm run build --workspace=@welbeing/backend`
- `npm run test --workspace=@welbeing/backend`

Commit headings:
- `feat: add local image storage adapter`
- `feat: add admin image upload endpoint`
- `test: cover backend image upload flow`

## Phase 3 — Admin product image upload UI

**Goal:** Let admins upload product images from ProductForm using the backend endpoint.

Implementation slices:
1. Add reusable `ImageUploader` component.
2. Wire image upload into admin ProductForm image fields.
3. Keep URL input/manual image support if current admin flow depends on it.
4. Add frontend tests for upload success/failure UI using mocked fetch.

Verification:
- `npm run build --workspace=@welbeing/frontend`
- `npm run test --workspace=@welbeing/frontend`
- Manual/API smoke if backend is running.

Commit headings:
- `feat: add admin image uploader`
- `test: cover product image upload UI`

## Phase 4 — Cart persistence

**Goal:** Persist cart contents across page refreshes via `localStorage`.

Implementation slices:
1. Add tests for cart initialization from storage, persistence on mutation, and corrupt storage fallback.
2. Implement storage read/write in `CartContext` with SSR-safe/browser-safe guards.
3. Ensure stock/product shape changes do not crash old cart data.

Verification:
- Focused cart tests.
- `npm run test --workspace=@welbeing/frontend`
- `npm run build --workspace=@welbeing/frontend`

Commit heading:
- `feat: persist cart in local storage`

## Phase 5 — Email service with Resend fallback

**Goal:** Replace console-only email behavior with Resend when configured; keep safe logging fallback when not configured.

Implementation slices:
1. Install `resend`.
2. Add email client abstraction/functions for verification, reset, order confirmation/status.
3. Preserve no-key fallback for local dev/tests.
4. Add unit tests for no-key fallback and mocked Resend send path.

Verification:
- Focused backend email tests.
- `npm run build --workspace=@welbeing/backend`
- `npm run test --workspace=@welbeing/backend`

Commit heading:
- `feat: add Resend-backed email service`

## Phase 6 — GST tax calculation

**Goal:** Apply 10% GST for Australian orders and expose tax totals through checkout/order flows.

Implementation slices:
1. Add tax service tests for AU vs non-AU behavior and rounding.
2. Implement tax service.
3. Integrate into order creation totals.
4. Update checkout/order UI displays where needed.

Verification:
- Focused backend order/tax tests.
- Frontend build/test if UI touched.
- Backend build/test.

Commit heading:
- `feat: calculate GST for Australian orders`

## Phase 7 — Reviews system

**Goal:** Implement customer reviews using the existing Prisma `Review` model.

Implementation slices:
1. Backend API: list product reviews, create/update own review, enforce auth and rating validation.
2. Product detail UI: display reviews and allow authenticated users to submit.
3. Admin moderation: list/hide/delete or moderate reviews according to existing admin patterns.
4. Tests for API permissions and frontend review interactions.

Verification:
- Backend focused review tests + full backend tests.
- Frontend focused tests + build.

Commit headings:
- `feat: add product reviews API`
- `feat: add product review UI`
- `feat: add admin review moderation`

## Phase 8 — Error boundaries and code splitting

**Goal:** Prevent white-screen crashes and reduce initial bundle size.

Implementation slices:
1. Add ErrorBoundary component and tests.
2. Wrap app/router with the boundary.
3. Lazy-load admin and other heavy routes via `React.lazy`/`Suspense`.
4. Verify Vite chunk output improves or at least remains valid.

Verification:
- Frontend tests.
- `npm run build --workspace=@welbeing/frontend`

Commit heading:
- `feat: add error boundary and lazy routes`

## Phase 9 — Stripe payment integration

**Goal:** Replace mock-only payment with a test-mode Stripe PaymentIntent/webhook flow.

Implementation slices:
1. Install Stripe backend/frontend packages.
2. Add backend PaymentIntent creation and webhook verification with env-gated behavior.
3. Add frontend Stripe Elements checkout path when configured.
4. Preserve/mock fallback for local dev if keys are absent, clearly labeled non-production.
5. Tests with mocked Stripe SDK and webhook signature handling.

Verification:
- Backend payment tests.
- Frontend checkout tests.
- Backend/frontend builds.
- Manual test-mode card flow only if Stripe env vars are available.

Commit headings:
- `feat: add Stripe payment intent flow`
- `feat: add Stripe checkout UI`
- `test: cover Stripe payment flow`

## Phase sequencing decision

Start with Phase 0, then Phase 1. Defer credential-backed integrations (Resend, Stripe, S3) until the no-secret, testable scaffolding is in place. If a phase exposes a conflicting existing implementation, stop and reassess before changing architecture.
