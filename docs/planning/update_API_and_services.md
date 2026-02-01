# Backend Architecture & Code Organization – Improvement Guideline

## Objective

Make the backend production-grade, scalable, and change-tolerant, while keeping refactors localized as the schema and APIs evolve.

## 1. Architectural Principles (Non-Negotiable)

### 1.1 Clear Layer Ownership

Each layer has one job only:

#### Routes (Controllers)

- HTTP parsing only
- Auth middleware usage
- No business logic

#### Services

- Business rules
- Cross-table logic
- Transactions

#### Data Access (Prisma)

- No business rules
- No validation assumptions

#### Lib / Utils

- Stateless helpers only

#### Rules

- ❌ No Prisma calls in routes
- ❌ No HTTP logic in services

### 1.2 Domain-Driven Modular Structure

#### Current direction (good)

- `/api`
- `/services`
- `/middleware`
- `/lib`

#### Recommended refinement (scales better)

```folder_structure
src/
 ├─ api/
 │   ├─ auth/
 │   ├─ users/
 │   ├─ addresses/
 │   ├─ products/
 │   ├─ orders/
 │   ├─ payments/
 │   └─ admin/
 │
 ├─ services/
 │   ├─ auth.service.ts
 │   ├─ user.service.ts
 │   ├─ address.service.ts
 │   ├─ product.service.ts
 │   ├─ order.service.ts
 │   └─ payment.service.ts
 │
 ├─ domain/
 │   ├─ enums.ts
 │   ├─ errors.ts
 │   └─ types.ts
 │
 ├─ middleware/
 ├─ lib/
 └─ prisma/
```

#### Rule

- If a file grows beyond ~300 lines → split by responsibility.

## 2. Service Design Rules (Critical)

### 2.1 One Service = One Domain

#### Examples

- `OrderService` owns: order creation, stock deduction, status transitions
- `PaymentService` owns: payment records, payment status
- `ProductService` owns: stock logic, visibility rules

#### Rules SDR

- ❌ Services calling other services directly
- ✅ Orchestrator service if needed (e.g. `CheckoutService`)

### 2.2 Transactions Live in Services

All multi-step DB writes must be wrapped in Prisma transactions:

- Order + OrderItems
- Payment + Order status

Controllers never open transactions.

## 3. Error Handling Strategy

### 3.1 Typed Errors

Create domain-specific errors:

- `ValidationError`
- `AuthorizationError`
- `NotFoundError`
- `BusinessRuleError`

Services throw, middleware translates to HTTP.

### 3.2 Global Error Middleware

#### Responsibilities

- Map error → HTTP status
- Mask internal errors
- Log stack traces

#### Rule 3.2

- ❌ Never return raw Prisma errors to client

## 4. Authentication & Authorization

### 4.1 Auth is Middleware-Only

- JWT verification
- Role checks
- Ownership checks (e.g. order belongs to user)

Services assume: “Caller is authorized unless explicitly checked.”

### 4.2 Role Logic

- Roles are enums (`USER`, `ADMIN`)
- Admin routes are path-scoped (`/api/admin/*`) and middleware-protected

## 5. Validation Strategy

### 5.1 API Boundary Validation

Validate:

- required fields
- enums
- basic formats

Use schema validation (Zod / Joi).

### 5.2 Service-Level Validation

Validate:

- foreign key existence
- ownership
- business rules

#### Rule 5.2

- ❌ Don’t rely on DB constraints for UX validation

## 6. Performance & Scalability Prep

### 6.1 Pagination Everywhere

- Products
- Orders
- Admin lists

Never return unbounded collections.

### 6.2 Caching Strategy (Read-Heavy)

#### Candidates

- Categories
- Tags
- Public product lists

#### Rules 6.2

- Cache at service level
- Invalidate on write

## 7. Logging & Observability

### Logging

Replace `console.log` with structured logger.

Include:

- `requestId`
- `userId` (if available)
- service name

### Health Checks

`/api/health`

- No DB writes
- Used by uptime monitors

## 8. Naming & Consistency Rules

### Files

- camelCase consistently
- Service files: `*.service.ts`
- Route files: `*.routes.ts`

### API URLs

- Nouns, plural
- No verbs
- Versionable (`/api/v1/...` ready)

## 9. Testing Alignment

### What to Test

- Services (business logic)
- Critical flows: order creation, payment confirmation, stock handling

### What NOT to Over-Test

- Prisma itself
- Simple DTO mapping

## 10. Refactor Safety Rule

Any change must:

- Compile
- Pass seed
- Pass service tests
- Match Swagger

If step 2 fails → schema or seed is wrong
If step 3 fails → service logic is wrong
If step 4 fails → API contract drift

## Summary Anchor

- Schema defines reality
- Services enforce rules
- APIs expose intent
- Architecture prevents chaos
