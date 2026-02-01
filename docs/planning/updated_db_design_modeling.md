# Database Design & Data Modeling (Proposed Extensions)

This document outlines **missing tables**, **required table updates**, and **relationships** to evolve the current schema into an industry-grade, future-proof e‑commerce backend.

---

## 1. New Tables Required (with Data Model)

### 1.1 Address

Used for reusable, structured shipping/billing addresses.

**Fields**

* id (PK)
* userId (FK → User.id, nullable for guest reuse if needed)
* label (string, e.g. Home, Work)
* fullName (string)
* phone (string)
* streetLine1 (string)
* streetLine2 (string, nullable)
* city (string)
* state (string)
* postalCode (string)
* country (string, ISO code)
* isDefault (boolean)
* createdAt (datetime)
* updatedAt (datetime)

---

### 1.2 Payment

Stores payment provider metadata and transaction lifecycle.

**Fields**

* id (PK)
* orderId (FK → Order.id, unique)
* provider (enum: STRIPE, PAYPAL, COD, MOCK)
* transactionId (string)
* amount (decimal)
* currency (string, ISO 4217)
* status (enum: INITIATED, SUCCESS, FAILED, REFUNDED)
* createdAt (datetime)

---

### 1.3 ProductVariant

Supports SKUs, options (size, color), and future catalog expansion.

**Fields**

* id (PK)
* productId (FK → Product.id)
* sku (string, unique)
* price (decimal)
* stockQuantity (int)
* optionValues (JSON: { size, color, etc. })
* isActive (boolean)
* createdAt (datetime)
* updatedAt (datetime)

---

### 1.4 InventoryLog (optional but recommended)

Tracks stock changes for audit/debugging.

**Fields**

* id (PK)
* productId or productVariantId (FK)
* changeType (enum: ORDER, RESTOCK, ADJUSTMENT)
* quantityDelta (int)
* referenceId (string, e.g. orderId)
* createdAt (datetime)

---

### 1.5 OrderStatusHistory (optional, future-proofing)

Tracks order lifecycle changes.

**Fields**

* id (PK)
* orderId (FK → Order.id)
* fromStatus (enum)
* toStatus (enum)
* changedBy (enum: SYSTEM, USER, ADMIN)
* createdAt (datetime)

---

## 2. Existing Tables Requiring Updates

### User

**Add**

* firstName (string)
* lastName (string)
* phone (string, nullable)
* isActive (boolean, default true)
* lastLoginAt (datetime)

**Change**

* role → enum (USER, ADMIN)

---

### UserIdentity

**Add**

* isVerified (boolean)
* verifiedAt (datetime)

---

### Product

**Add**

* sku (string, nullable if variants exist)
* msrp / originalPrice (decimal)
* reorderLevel (int)

**Consider**

* Move stockQuantity → ProductVariant when variants are active

---

### WellbeingTag

**Change**

* type → enum (GOAL, FEATURE, NEED)

---

### Order

**Add**

* paymentStatus (enum: PENDING, PAID, FAILED, REFUNDED)
* paymentMethod (enum)
* currency (string)
* shippingFee (decimal)
* taxAmount (decimal)
* updatedAt (datetime)
* shippedAt (datetime)
* deliveredAt (datetime)

**Change**

* status → enum (PENDING, PAID, SHIPPED, DELIVERED, CANCELLED)
* shippingAddress → addressId (FK → Address.id) OR embedded structured fields

---

### OrderItem

**Add**

* productVariantId (FK → ProductVariant.id, nullable)

---

## 3. Relationships Overview

* User → Address (1:N)

* User → Order (1:N)

* User → UserIdentity (1:N)

* Category → Product (1:N)

* Product → ProductVariant (1:N)

* Product → ProductImage (1:N)

* Product ↔ WellbeingTag (M:N)

* Order → OrderItem (1:N)

* Order → Payment (1:1)

* Order → OrderStatusHistory (1:N)

* OrderItem → ProductVariant (N:1)

* Product/ProductVariant → InventoryLog (1:N)

---

## Design Goal Summary

* No breaking schema changes later
* Clean separation of **catalog**, **orders**, **payments**, **users**
* Supports payments, localization, variants, analytics, and admin tooling
* All additions are **forward-compatible** and can be phased in
