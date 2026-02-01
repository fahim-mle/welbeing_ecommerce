# Frontend Improvement Task List (Entity/Page Based)

Derived from backend API surface and current frontend gaps. Each item maps UI work to backend endpoints for implementation.

## Storefront Catalog (Home / Product Listing)

- [x] Add category/tag filters to product list (use `GET /api/metadata`, `GET /api/products`).
- [x] Add search input tied to catalog query params (`GET /api/products?search=...`).
- [x] Add pagination controls (page/size) to product list (`GET /api/products` with pagination).
- [x] Add product card badges for stock, discount (use `stockQuantity`, `originalPrice`).
- [x] Add quick-add-to-cart CTA from list view.

## Product Detail Page

- [x] Ensure product detail fetch includes images, tags, category (`GET /api/products/:id`).
- [x] Render variant selection if variants exist (size/color/SKU, `ProductVariant`).
- [x] Add quantity selector with stock bounds.
- [x] Add related products section (backend: use category/tag filters).

## Cart Page

- [x] Create dedicated `/cart` page (full list with subtotal, remove, update qty).
- [x] Hook quantity updates to backend/cart state if applicable.
- [x] Add estimate totals (shipping/tax) based on backend order pricing logic.
- [x] Add CTA to checkout (redirect to `/checkout`).

## Checkout Page

- [x] Allow selecting from saved addresses for logged-in users (`GET /api/addresses`).
- [x] Add address creation inline (create new address `POST /api/addresses`).
- [x] Validate checkout form fields and show inline errors.
- [x] Surface payment placeholder status (until real gateway).
- [x] Add success UI that links to order detail (`GET /api/orders/:id`).

## Order Confirmation Page

- [x] Create dedicated order confirmation page.
- [x] Fetch and show full order summary (`GET /api/orders/:id`).
- [x] Display delivery address, payment status, order status history.

## User Profile / Account

- [x] Create `/profile` layout with tabs: Overview, Orders, Addresses, Security.
- [x] Profile overview: show name, email, role (`GET /api/me`).
- [x] Edit profile form (`PUT /api/me`).
- [x] Change password form (`PUT /api/me/password`).

## Address Book

- [x] Address list view (`GET /api/addresses`).
- [ ] Add new address (`POST /api/addresses`).
- [ ] Edit address (`PUT /api/addresses/:id`).
- [ ] Delete address (`DELETE /api/addresses/:id`).

## Order History

- [x] Orders list with pagination (`GET /api/orders`).
- [x] Order detail page (`GET /api/orders/:id`) with ownership enforcement.
- [x] Display order status history and payment data.
- [x] Add cancel order action if backend supports (`PATCH /api/orders/:id/cancel`).

## Authentication

- [x] Email verification page (`GET /api/auth/verify-email/:token`).
- [x] Forgot password page (`POST /api/auth/forgot-password`).
- [x] Reset password page (`POST /api/auth/reset-password`).
- [x] Improve auth state persistence (refresh token flow) if required by backend.

## Admin Dashboard (Shell)

- [x] Create admin layout with navigation: Orders, Products, Catalog, Users, Analytics.
- [x] Gate all routes by role (admin only).

## Admin Orders

- [x] Orders list with filters and pagination (`GET /api/admin/orders`).
- [x] Admin order detail page (items, shipping, payment) (`GET /api/admin/orders/:id`).
- [x] Status update workflow (`PATCH /api/admin/orders/:id/status`).

## Admin Products

- [x] Products list (`GET /api/admin/products`).
- [x] Create product form (`POST /api/admin/products`).
- [x] Edit product form (`PUT /api/admin/products/:id`).
- [x] Upload/attach product images (`POST /api/admin/products/:id/images`).
- [x] Manage product variants and inventory (if backend supports variant endpoints).

## Admin Catalog (Categories/Tags)

- [x] Category list/create/update/delete (`GET/POST/PUT/DELETE /api/admin/catalog/categories`).
- [x] Tag list/create/update/delete (`GET/POST/PUT/DELETE /api/admin/catalog/tags`).
- [x] Prevent deletion when linked to products (show API error).

## Admin Users

- [ ] Users list (`GET /api/admin/users`).
- [ ] Update user role / status (`PATCH /api/admin/users/:id`).
- [ ] Deactivate user workflow (if backend supports).

## Admin Analytics

- [ ] Analytics dashboard (`GET /api/admin/analytics`).
- [ ] Sales trends chart (orders by day).
- [ ] Top products summary (by revenue/quantity).

## Shared UX / UI Infrastructure

- [ ] Centralized API client with auth headers, error handling.
- [ ] Global loading/error states (toasts or banners).
- [ ] Empty states for lists (products, orders, addresses).
- [ ] Consistent pagination component.
- [ ] Role-based route guards.
