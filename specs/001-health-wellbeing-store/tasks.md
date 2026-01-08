# Tasks: Health and Wellbeing Ecommerce Store

**Feature Branch**: `001-health-wellbeing-store`
**Status**: Pending

## Phase 1: Setup
*Goal: Initialize project structure and dependencies for Full-Stack TypeScript application.*

- [ ] T001 Initialize React Frontend with Vite and TypeScript (src/frontend)
- [ ] T002 Initialize Express Backend with TypeScript (src/backend)
- [ ] T003 Configure Tailwind CSS for Frontend (src/frontend/tailwind.config.js)
- [ ] T004 Install and Configure Vitest for Frontend testing (src/frontend/vitest.config.ts)
- [ ] T005 Install and Configure Supertest/Jest for Backend testing (src/backend/jest.config.js)
- [ ] T006 [P] Configure shared types workspace or reference strategy (src/backend/src/types/shared.ts)
- [ ] T007 [P] Create concurrent dev runner script (package.json)

## Phase 2: Foundation
*Goal: Database setup and basic server infrastructure.*

- [ ] T008 Initialize Prisma with SQLite (src/backend/prisma/schema.prisma)
- [ ] T009 Define initial Prisma schema including User, UserIdentity, Product, ProductImage models (src/backend/prisma/schema.prisma)
- [ ] T010 [P] Create database seed script for initial Categories and Tags (src/backend/prisma/seed.ts)
- [ ] T011 Run initial migration to create SQLite database (src/backend/prisma/migrations)
- [ ] T012 Set up basic Express app structure with error handling middleware (src/backend/src/app.ts)
- [ ] T013 Create centralized Prisma client instance (src/backend/src/lib/prisma.ts)

## Phase 3: User Story 1 - Browse and Discover Products
*Goal: Users can view products, filter by tags/goals, and see details.*

- [x] T014 [US1] Create Product, Category, and Tag database services with image support (src/backend/src/services/catalogService.ts)
- [x] T015 [US1] Implement GET /products endpoint with filtering logic (src/backend/src/api/products.ts)
- [x] T016 [US1] Implement GET /products/:id endpoint including image list (src/backend/src/api/products.ts)
- [x] T017 [US1] Implement GET /categories and /tags endpoints (src/backend/src/api/metadata.ts)
- [x] T018 [P] [US1] Update seed script with 5-10 sample products and multiple image URLs (src/backend/prisma/seed.ts)
- [x] T019 [US1] Create API client for catalog fetching (src/frontend/src/api/catalog.ts)
- [x] T020 [P] [US1] Create ProductCard component with primary image (src/frontend/src/components/ProductCard.tsx)
- [x] T021 [US1] Implement HomePage with Category/Tag filters (src/frontend/src/pages/Home.tsx)
- [x] T022 [US1] Implement ProductDetailPage with Image Carousel (src/frontend/src/pages/ProductDetail.tsx)
- [x] T023 [P] [US1] Add Unit Tests for ProductCard component (src/frontend/src/components/__tests__/ProductCard.test.tsx)
- [x] T024 [P] [US1] Add Integration Test for Product Listing API (src/backend/tests/integration/products.test.ts)

## Phase 4: User Story 2 - Guest Checkout Flow
*Goal: Guest users can add items to cart and "purchase" them with simulated payment.*

- [ ] T025 [US2] Create Order and OrderItem database services (src/backend/src/services/orderService.ts)
- [ ] T026 [US2] Implement POST /orders endpoint for guest checkout (src/backend/src/api/orders.ts)
- [ ] T027 [US2] Create simple Cart context/provider (src/frontend/src/context/CartContext.tsx)
- [ ] T028 [P] [US2] Create Cart summary component (src/frontend/src/components/CartSummary.tsx)
- [ ] T029 [US2] Implement CheckoutPage with Guest Email, Address, and Payment Placeholder inputs (src/frontend/src/pages/Checkout.tsx)
- [ ] T030 [US2] Add Global Health Disclaimer checkbox to CheckoutPage (src/frontend/src/pages/Checkout.tsx)
- [ ] T031 [US2] Create Order Confirmation page (src/frontend/src/pages/OrderConfirmation.tsx)
- [ ] T032 [P] [US2] Add Integration Test for Guest Order creation (src/backend/tests/integration/orders.test.ts)

## Phase 5: User Story 3 - Admin Product Management
*Goal: Admins can manage catalog via backend API (UI is P2 but required per spec logic).*

- [ ] T033 [US3] Create Admin Auth Middleware (basic token/secret check) (src/backend/src/middleware/adminAuth.ts)
- [ ] T034 [US3] Implement POST/PUT/DELETE /products endpoints with image URL handling (src/backend/src/api/admin/products.ts)
- [ ] T035 [US3] Create Admin Dashboard layout (src/frontend/src/pages/admin/Dashboard.tsx)
- [ ] T036 [US3] Create Product Management Form with multi-image URL input (src/frontend/src/components/admin/ProductForm.tsx)
- [ ] T037 [US3] Implement Product List view with Stock toggle (src/frontend/src/components/admin/ProductList.tsx)
- [ ] T038 [P] [US3] Seed initial Admin user in DB (src/backend/prisma/seed.ts)

## Phase 6: User Story 4 - User Account & Authentication
*Goal: Users can register/login via multi-provider identity system.*

- [ ] T039 [US4] Implement UserService handling UserIdentity linking (src/backend/src/services/userService.ts)
- [ ] T040 [US4] Implement JWT generation and verification utils (src/backend/src/lib/auth.ts)
- [ ] T041 [US4] Implement POST /auth/register and /auth/login endpoints using Identity model (src/backend/src/api/auth.ts)
- [ ] T042 [US4] Create AuthProvider context for frontend state (src/frontend/src/context/AuthContext.tsx)
- [ ] T043 [US4] Create Login and Register pages (src/frontend/src/pages/Auth.tsx)
- [ ] T044 [P] [US4] Create User Profile page showing Order History (src/frontend/src/pages/Profile.tsx)
- [ ] T045 [P] [US4] Update Checkout flow to pre-fill info if logged in (src/frontend/src/pages/Checkout.tsx)

## Phase 7: Polish & Cross-Cutting
*Goal: Final cleanup and UI consistency.*

- [ ] T046 Refine Global Error Handling in Backend (src/backend/src/middleware/errorHandler.ts)
- [ ] T047 Apply consistent Tailwind styling to all forms and buttons (src/frontend/src/index.css)
- [ ] T048 Verify Accessibility (aria-labels) on key interactive elements (src/frontend)
- [ ] T049 Manual Verification: Walkthrough of Guest Checkout flow
- [ ] T050 Manual Verification: Walkthrough of Admin Product Creation

## Dependencies

- **Phase 1 & 2** are BLOCKING for all other phases.
- **Phase 3 (Browsing)** is BLOCKING for Phase 4 (Checkout).
- **Phase 5 (Admin)** and **Phase 6 (Auth)** can be done in parallel after Phase 3.
- **Phase 4 (Checkout)** depends on Phase 3.

## Implementation Strategy

1. **MVP (Phases 1-4)**: Focus on the Guest Checkout flow first. This delivers the core value.
2. **Admin (Phase 5)**: Necessary to manage the store and image URLs.
3. **Auth (Phase 6)**: Adds retention features and multi-provider foundation.

## Parallel Execution

- Frontend components can be built while Backend APIs are being implemented.
- Tests can be written alongside implementation.
