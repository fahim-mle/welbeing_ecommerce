# Data Model: Health and Wellbeing Ecommerce Store

**Type**: Relational (SQL)
**Engine**: SQLite (Prisma Schema syntax)

## ER Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--|{ UserIdentity : "identified by"
    Category ||--o{ Product : contains
    Product }o--o{ WellbeingTag : "tagged with"
    Product ||--|{ ProductImage : "has images"
    Order ||--|{ OrderItem : contains
    Product ||--o{ OrderItem : "is item"

    User {
        int id PK
        string email UK
        string role "ENUM: USER, ADMIN"
        datetime created_at
    }

    UserIdentity {
        int id PK
        int user_id FK
        string provider "ENUM: EMAIL, GOOGLE, GITHUB"
        string provider_id "UK per provider (e.g. email or sub)"
        string password_hash "nullable"
        datetime created_at
    }

    Category {
        int id PK
        string name UK
        string description
    }

    Product {
        int id PK
        string name
        string description
        decimal price
        string stock_status "ENUM: IN_STOCK, OUT_OF_STOCK"
        string ingredients
        string usage_instructions
        string benefits
        string safety_disclaimers
        int category_id FK
    }

    ProductImage {
        int id PK
        int product_id FK
        string url
        int display_order
        string alt_text
    }

    WellbeingTag {
        int id PK
        string name
        string type "ENUM: GOAL, FEATURE, NEED"
    }

    Order {
        int id PK
        int user_id FK "nullable (Guest)"
        string guest_email "nullable (if guest)"
        string status "ENUM: PENDING, PAID, SHIPPED"
        decimal total_price
        string shipping_address
        datetime created_at
    }

    OrderItem {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price_at_purchase
    }
```

## Schema Definitions

### Identity & Auth
- **User**: Core account entity. `email` acts as the primary handle.
- **UserIdentity**: Handles authentication.
  - One user can have multiple identities (e.g., Email/Password AND Google).
  - `provider_id` stores the unique handle for that provider (email for EMAIL provider, sub for OAuth).

### Products
- **ProductImage**: Stores image URLs.
  - `url`: Direct link to image resource.
  - `display_order`: Determines carousel sequence.

### Orders
- **guest_email**: String - Captured for guest checkouts
- **user_id**: Nullable Foreign Key - Links to User if logged in