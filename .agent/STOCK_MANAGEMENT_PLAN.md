# Stock Management Implementation Plan - Execution Tracker

**Branch:** `phase/001/phase-1-stock-management`
**Base Branch:** `001-health-wellbeing-store`
**Started:** 2026-01-11

---

## Overview

This plan implements comprehensive stock management improvements including:
- Remove `stockStatus` field (quantity-based stock management)
- Add timestamps to Product table
- Implement optimistic locking for high concurrency
- Add database indexes for performance
- Update frontend with collapsible wellbeing sections
- Display safety disclaimers on product pages

---

## Phase 1: Database Schema Foundation

### 1.1 Create Planning Document [COMPLETED]
- [x] Created this execution tracker
- [x] Review git version control strategy

### 1.2 Create Phase Branch [COMPLETED]
- [x] Create branch `phase/001/phase-1-stock-management` from `001-health-wellbeing-store`
- [x] Switch to new branch

### 1.3 Update Prisma Schema [COMPLETED]
- [x] Remove `stockStatus` field from Product model
- [x] Add `createdAt` DateTime field with default `now()`
- [x] Add `updatedAt` DateTime field with `@updatedAt` decorator
- [x] Add `@@index([categoryId])`
- [x] Add `@@index([stockQuantity])`
- [x] Add `@@index([isVisible])`
- [x] Add `@@index([updatedAt])`

### 1.4 Generate Migration [COMPLETED]
- [x] Run `npm run db:migrate` to generate migration
- [x] Review generated migration SQL
- [x] Verify migration uses CURRENT_TIMESTAMP for existing products

### 1.5 Update Seed Data
- [x] Remove `stockStatus` from seed.ts product creation
- [x] Keep `stockQuantity` only
- [ ] Run `npm run db:seed` to verify

### 1.6 Verify Migration [COMPLETED]
- [x] Backup database: `cp prisma/dev.db prisma/dev.db.backup`
- [x] Run migration
- [x] Verify `stockStatus` column removed
- [x] Verify `createdAt`/`updatedAt` populated
- [x] Verify indexes created
- [x] Test existing functionality

**Commit:** `feat(schema): remove stockStatus, add timestamps and indexes`

---

## Phase 2: Backend Logic Updates

### 2.1 Update catalogService.ts [COMPLETED]
- [x] Update `getProducts()` filter: replace `stockStatus = 'IN_STOCK'` with `stockQuantity = { gt: 0 }`
- [x] Update `createProduct()`: remove `stockStatus` parameter and assignment
- [x] Update `updateProduct()`: remove `stockStatus` from update data

### 2.2 Implement Optimistic Locking in orderService.ts [COMPLETED]
- [x] Wrap `createOrder()` in `prisma.$transaction`
- [x] Add stock validation: `stockQuantity <= 0` check
- [x] Add sufficient stock validation: `stockQuantity < item.quantity` check
- [x] Implement stock decrement with optimistic locking using `updatedAt`
- [x] Handle concurrent modification errors with clear message
- [x] Add `OrderValidationError` for lock failures

### 2.3 Update Admin API Routes [COMPLETED]
- [x] Remove `stockStatus` from POST request body extraction
- [x] Remove `stockStatus` from PUT request body extraction
- [x] Add validation: `stockQuantity >= 0`
- [x] Add validation: `price > 0`

### 2.4 Update TypeScript Interfaces [COMPLETED]
- [x] Update `Product` interface in `src/frontend/src/api/catalog.ts`
- [x] Remove `stockStatus` field
- [x] Add `createdAt: string`
- [x] Add `updatedAt: string`

**Commits:**
- `feat(catalog): remove stockStatus, implement quantity-based stock filtering`
- `feat(orders): implement optimistic locking for inventory management`
- `fix(admin): remove stockStatus from admin API, add validation for stockQuantity and price`

---

## Phase 3: Frontend UI Updates [COMPLETED]
- [x] Update ProductForm - remove stockStatus dropdown
- [x] Update ProductCard - update stock display to quantity
- [x] Update ProductDetail - show stock quantity, disable button at 0
- [x] Add safety disclaimer section (always visible)
- [x] Create `WellbeingCollapsible` component
- [x] Add collapsible ingredients section
- [x] Add collapsible usage instructions section
- [x] Add collapsible benefits section
- [x] Add required icon imports

**Commits:**
- `fe(product): update stock display to use quantity`
- `fe(admin): remove stockStatus from product form`
- `fe(product): add safety disclaimer and collapsible wellbeing sections, update stock to quantity-based`
- `fe(product): update stock display to use quantity`
- `fe(admin): remove stockStatus from product form`
- `fe(product): add safety disclaimer and collapsible wellbeing sections, update stock to quantity-based`

**Phase 1 COMPLETE - Ready for Merge**

All backend and frontend changes for stock management have been implemented and committed.

**Commits:**
- `fe(admin): remove stockStatus from product form`
- `fe(product): update stock display to use quantity`
- `fe(product): add collapsible wellbeing sections and safety disclaimer`

---

## Phase 4: Testing & Validation

### 4.1 Backend Tests
- [ ] Create `tests/integration/stockManagement.test.ts`
- [ ] Test stock decrement on order creation
- [ ] Test insufficient stock error
- [ ] Test out of stock error (quantity = 0)
- [ ] Test concurrent order handling
- [ ] Test optimistic lock failure
- [ ] Test stock unaffected on order failure

### 4.2 Update Existing Tests
- [ ] Update `tests/integration/orders.test.ts`
- [ ] Update `tests/integration/adminProducts.test.ts`
- [ ] Remove all `stockStatus` references
- [ ] Add `createdAt`/`updatedAt` to mock data

### 4.3 Frontend Tests
- [ ] Update `components/__tests__/ProductCard.test.tsx`
- [ ] Create `pages/__tests__/ProductDetail.test.tsx`
- [ ] Test out of stock badge when quantity = 0
- [ ] Test in stock with available count
- [ ] Test safety disclaimer display
- [ ] Test collapsible sections expand/collapse

### 4.4 Performance Tests
- [ ] Create query performance benchmarks
- [ ] Verify index usage on category filter
- [ ] Verify index usage on stockQuantity filter
- [ ] Test with 1000 products

### 4.5 End-to-End Tests
- [ ] Test order creation flow with stock decrement
- [ ] Test product management flow
- [ ] Test concurrent ordering scenario

**Commits:**
- `test(backend): add stock management integration tests`
- `test(backend): update existing tests for schema changes`
- `test(frontend): add ProductDetail component tests`
- `test(perf): add query performance benchmarks`

---

## Phase 5: Merge & Cleanup

### 5.1 Final Verification
- [ ] Run all backend tests: `cd src/backend && npm test`
- [ ] Run all frontend tests: `cd src/frontend && npm test`
- [ ] Run linters: `npm run lint`
- [ ] Manual testing of full order flow
- [ ] Manual testing of admin product management

### 5.2 Merge to Feature Branch
- [ ] Switch to `001-health-wellbeing-store`
- [ ] Merge `phase/001/phase-1-stock-management` (non-fast-forward)
- [ ] Resolve any conflicts
- [ ] Verify merge succeeded

### 5.3 Cleanup
- [ ] Delete phase branch: `git branch -D phase/001/phase-1-stock-management`
- [ ] Remove temporary database backup
- [ ] Archive this planning document

---

## Risk Mitigation

### Database Migration Risks
- **Risk**: Data loss during column drop
- **Mitigation**: Migration creates new table, copies data, then swaps
- **Fallback**: Restore from `dev.db.backup`

### Concurrency Risks
- **Risk**: Race conditions on order creation
- **Mitigation**: Optimistic locking with `updatedAt` check
- **Fallback**: User can retry order with clear error message

### Breaking Changes
- **Risk**: Frontend/backend type mismatches
- **Mitigation**: Update TypeScript interfaces immediately after schema change
- **Fallback**: TypeScript compiler will catch mismatches

---

## Notes

- All work on `phase/001/phase-1-stock-management` branch
- Merged to `001-health-wellbeing-store` after completion
- Never commit directly to feature branch
- Follow conventional commit format: `feat(scope): description`
- Delete task branches after merge
