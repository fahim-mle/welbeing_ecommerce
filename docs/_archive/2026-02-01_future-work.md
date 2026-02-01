# Welbeing E-Commerce — Future Work & Scopes (Postponed)

Date: 2026-02-01
Branch used during work: `feature/FF020-frontend-modern-theme-refresh`

This document captures **what’s been done recently** and the **planned next steps** (postponed for now).

---

## What was fixed/added recently

### 1) Product page “Too many requests” (429)
**Problem**: Frequent 429s while browsing/searching products.

**Root causes**:
- Global API rate limit was conservative (`200 / 15 min`).
- Home page search/filtering triggers frequent calls (especially while typing).

**Changes**:
- Backend: increased `apiLimiter.max` in **development** (kept production conservative).
- Frontend: debounced the search query before calling `fetchProducts`.

**Commits**:
- `7a18e77 fix(rate-limit): reduce dev 429s by increasing api limit and debouncing product search`

---

### 2) Missing Add-to-Cart icon on Product Detail
**Change**: Add `ShoppingBag` icon to ProductDetail’s Add-to-Cart button.

**Commit**:
- `d67ef1e ui(product): add icon to Add to Cart button on product detail`

---

### 3) Cart Sidebar / Side Cart (MVP)
**Scope delivered**: A global “drawer” cart (right-side) with overlay.

**Included**:
- Floating cart button showing item count.
- Drawer shows cart items with:
  - quantity +/-
  - remove item
  - subtotal
  - Checkout + View Cart actions
- Header cart icon opens drawer.

**Commits**:
- `4d229a6 fix(cart): correct removeItem behavior for base and variant items`
- `c27da9b feat(cart): add global cart drawer with floating button`

**Not yet implemented** (explicitly deferred):
- coupons, upcoming coupons
- upsells/cross-sells/recommendations inside cart
- shipping calculator
- taxes/fees/discount breakdown
- save-for-later
- cart notifications/toasts
- multiple drawer styles (drawer/slider/column)
- accelerated wallets (PayPal/Apple Pay/Google Pay/Amazon Pay)

---

### 4) Checkout address autocomplete (OpenStreetMap)
**MVP delivered**:
- Backend route `GET /api/addresses/autocomplete?q=...` using Nominatim.
- Frontend component `AddressAutocomplete` with dropdown.
- Selecting an address auto-fills shipping fields (best-effort mapping).

**Hardening delivered**:
- Dedicated per-route rate limiting for autocomplete.
- Redis caching of suggestions (TTL: 1 day).
- Optional country restriction.
- Timeout for upstream calls.
- Accept-Language forwarded.

**Commits**:
- `a798883 feat(checkout): add address autocomplete via OpenStreetMap Nominatim`
- `72e00be chore(addresses): harden autocomplete with rate limit, cache, country filter, and timeout`

**Recommended env vars** (backend):
- `NOMINATIM_USER_AGENT="welbeing_ecommerce (local dev)"`
- `NOMINATIM_EMAIL="<your email>"` (recommended by Nominatim policy)
- `NOMINATIM_COUNTRY_CODES="au"` (optional; comma-separated)

**Further hardening (future)**:
- Frontend: show “rate limited” / “offline” user-friendly errors.
- Add server-side response validation (Zod) for Nominatim payload.
- Add caching “stale-while-revalidate” behavior.
- Optionally host a self-managed geocoder later (Photon/Pelias) if traffic grows.

---

## Deferred: Switch local dev/test DB to Postgres (Option A)

### Current state
- Prisma datasource provider is `sqlite`.
- Migrations currently exist under `src/backend/prisma/migrations/*`.
- Seed assets:
  - `src/backend/prisma/seed.ts`
  - `src/backend/prisma/seed-data.json`

### Goal
- Use **Postgres** locally via Docker with a **persistent volume**.
- Make seeded data "stick" between restarts (no re-seed every time).
- Keep migrations as source of truth.

### Important constraint
Switching Prisma from SQLite to Postgres is **not a trivial toggle**:
- Existing migration SQL is SQLite-flavored and won’t apply cleanly to Postgres.
- We will likely need to regenerate migrations for Postgres.

### Proposed approach (Option A)
1) Add `compose.yaml` to run:
   - postgres (persistent named volume)
   - redis (persistent named volume; already used for caching)
2) Update Prisma datasource in `schema.prisma`:
   - `provider = "postgresql"`
3) Decide how to handle migration history:
   - **Recommended**: generate a fresh baseline migration for Postgres
     - Keep old SQLite migrations archived (e.g., `.docs/legacy-migrations-sqlite/`)
     - Ensure team understands the migration reset.
4) Provide scripts:
   - `npm run db:migrate` against Postgres
   - `npm run db:seed` once
   - optional: `db:reset` for clean rebuild
5) Ensure tests use a dedicated test DB (can be ephemeral or separate schema).

### Data migration possibilities
- If we need to migrate data from existing `dev.db` (SQLite) to Postgres:
  - Option 1: write a one-off migration script (read SQLite via Prisma/SQL, write to Postgres)
  - Option 2: export/import via JSON (leveraging existing seed formats)

**This DB switch is postponed for now.**

---

## Suggested “Agent” roles for future work
(When we resume Welbeing development)

1) **Backend/DB agent**
- Own Postgres docker compose + Prisma provider switch
- Migrations strategy, test DB strategy
- Seed + migration scripts

2) **Frontend UX agent**
- Side cart enhancements (notifications, save-for-later)
- Checkout UX
- Performance fixes and error states

3) **Integrations agent**
- Payments (Stripe + wallets)
- Shipping/taxes integrations

4) **Quality agent**
- E2E tests, CI checks, lint/test rules
- Load testing for rate limits + caching

---

## Quick checklist to resume later
- [ ] Decide country restriction for Nominatim (`NOMINATIM_COUNTRY_CODES`)
- [ ] Confirm Redis is always on in dev (for caching)
- [ ] Implement Postgres compose + Prisma switch plan (Option A)
- [ ] Baseline migration strategy (fresh migrations vs db push)
- [ ] Seed once into persistent Postgres volume
