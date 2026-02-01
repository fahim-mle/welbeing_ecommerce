# Improvement Plan Task List (DB → Essential Features)

Derived from the “Database Design & Data Modeling” through “Essential Feature Enhancements (Server-Side)” sections.

## Database Design & Data Modeling

- [x] User profile fields and Address model for multi-address support (first/last name, structured addresses).
- [x] Order schema enhancements (payment status/method, shipping fee, tax amount, shipped/delivered timestamps, status history).
- [x] Payment record model linked to orders.
- [x] Enums for roles/statuses/tag types.
- [x] Product variants and SKU-based inventory fields (stockQuantity, reorderLevel).
- [x] Pricing metadata (originalPrice) and product images/tags/categories.
- [x] Shipping carrier/shipper table or carrier field on orders.
- [x] Hierarchical categories (parent/child relationships).
- [x] Product reviews/ratings table.
- [x] General audit log table beyond order status history.

## Backend Architecture & Code Organization

- [x] Centralized error handling with typed errors and structured logs.
- [x] Pagination on product/order lists.
- [x] Redis caching for public catalog reads (products, categories, tags).
- [x] Request ID tracing for logs.
- [x] Health check endpoint (`/api/health`) with monitoring hooks.
- [x] Expand request validation coverage (beyond orders, e.g., admin products/auth).
- [x] Refresh token flow (short-lived access tokens + refresh tokens).
- [x] Email verification flow for new accounts.
- [x] Password reset flow with expiring tokens.
- [x] Social login (Google/GitHub OAuth) via `UserIdentity` providers.
- [x] Rate limiting for auth and heavy endpoints.
- [x] Standardize naming conventions across modules (if refactors are needed).
- [ ] Production process manager / scaling guidance (PM2/Docker).

## Essential Feature Enhancements (Server-Side)

- [ ] Real payment gateway integration (Stripe/PayPal/etc) with server-side confirmation.
- [x] Order confirmation emails on successful checkout.
- [x] Admin status updates trigger user notifications (email).
- [x] Order cancellation endpoint with stock restoration logic.
- [x] Guest order → registered account linking by email.
- [x] User profile endpoints (`GET /api/me`, update profile/password).
- [x] Saved address CRUD endpoints for authenticated users.
- [x] User order detail endpoint (`GET /api/orders/:id`) with ownership enforcement.
- [x] Admin category/tag management endpoints.
- [x] Admin user management endpoints (list/update role/deactivate).
- [x] Analytics endpoints for sales and product trends.

## Localization and Multi-Region Support

- [ ] Multi-currency pricing strategy (conversion or per-currency pricing).
- [ ] Store order currency and exchange rate for transactions.
- [ ] User locale/timezone preference handling for date display.
- [ ] Internationalized product content support (translations).

## Privacy & Compliance

- [ ] Account deletion/anonymization workflow (GDPR “right to be forgotten”).

## Infrastructure & Operations

- [ ] Real email provider integration (SendGrid/SMTP) for transactional emails.
- [ ] Containerization for backend (Dockerfile/docker-compose).
- [ ] CI/CD pipeline for backend tests.
- [ ] Load testing scripts for critical endpoints (checkout/search).

## Notes

- Items marked complete are based on current repo changes in this session.
- Pending tasks may require new endpoints, schema changes, or third-party integrations.
