# Prisma schema file

// learn more about it in the docs: <https://pris.ly/d/prisma-schema>

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  role      String   @default("USER") // ENUM: USER, ADMIN
  createdAt DateTime @default(now()) @map("created_at")

  orders     Order[]
  identities UserIdentity[]

  @@map("users")
}

model UserIdentity {
  id           Int      @id @default(autoincrement())
  userId       Int      @map("user_id")
  provider     String   // ENUM: EMAIL, GOOGLE, GITHUB
  providerId   String   @map("provider_id") // UK per provider
  passwordHash String?  @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@unique([provider, providerId])
  @@map("user_identities")
}

model Category {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  description String?

  products Product[]

  @@map("categories")
}

model Product {
  id                Int     @id @default(autoincrement())
  name              String
  description       String
  price             Decimal
  stockQuantity     Int     @default(0) @map("stock_quantity")
  isVisible         Boolean @default(true) @map("is_visible")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  ingredients       String?
  usageInstructions String? @map("usage_instructions")
  benefits          String?
  safetyDisclaimers String? @map("safety_disclaimers")
  categoryId        Int     @map("category_id")

  category     Category       @relation(fields: [categoryId], references: [id])
  images       ProductImage[]
  tags         WellbeingTag[]
  orderItems   OrderItem[]

  @@map("products")
  @@index([categoryId])
  @@index([stockQuantity])
  @@index([isVisible])
  @@index([updatedAt])
}

model ProductImage {
  id           Int    @id @default(autoincrement())
  productId    Int    @map("product_id")
  url          String
  displayOrder Int    @default(0) @map("display_order")
  altText      String? @map("alt_text")

  product Product @relation(fields: [productId], references: [id])

  @@map("product_images")
}

model WellbeingTag {
  id   Int    @id @default(autoincrement())
  name String
  type String // ENUM: GOAL, FEATURE, NEED

  products Product[]

  @@map("wellbeing_tags")
}

model Order {
  id              Int      @id @default(autoincrement())
  userId          Int?     @map("user_id")
  guestEmail      String?  @map("guest_email")
  status          String   @default("PENDING") // ENUM: PENDING, PAID, SHIPPED
  totalPrice      Decimal  @map("total_price")
  shippingAddress String   @map("shipping_address")
  createdAt       DateTime @default(now()) @map("created_at")

  user       User?       @relation(fields: [userId], references: [id])
  items      OrderItem[]

  @@map("orders")
}

model OrderItem {
  id              Int     @id @default(autoincrement())
  orderId         Int     @map("order_id")
  productId       Int     @map("product_id")
  quantity        Int
  priceAtPurchase Decimal @map("price_at_purchase")

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}
