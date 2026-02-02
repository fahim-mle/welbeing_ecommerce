/*
  Warnings:

  - You are about to drop the column `shipping_address` on the `orders` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_order_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_variant_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "price_at_purchase" DECIMAL NOT NULL,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_order_items" ("id", "order_id", "price_at_purchase", "product_id", "quantity") SELECT "id", "order_id", "price_at_purchase", "product_id", "quantity" FROM "order_items";
DROP TABLE "order_items";
ALTER TABLE "new_order_items" RENAME TO "order_items";
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");
CREATE INDEX "order_items_product_variant_id_idx" ON "order_items"("product_variant_id");
CREATE TEMP TABLE "order_address_map" (
    "order_id" INTEGER PRIMARY KEY,
    "address_id" INTEGER NOT NULL
);
INSERT INTO "order_address_map" ("order_id", "address_id")
SELECT "id", (SELECT IFNULL(MAX("id"), 0) FROM "addresses") + ROW_NUMBER() OVER (ORDER BY "id")
FROM "orders"
WHERE "shipping_address" IS NOT NULL;
INSERT INTO "addresses" (
    "id",
    "user_id",
    "label",
    "full_name",
    "phone",
    "street_line_1",
    "street_line_2",
    "city",
    "state",
    "postal_code",
    "country",
    "is_default",
    "created_at",
    "updated_at"
)
SELECT "order_address_map"."address_id",
       "orders"."user_id",
       'Shipping',
       '',
       '',
       "orders"."shipping_address",
       NULL,
       '',
       '',
       '',
       '',
       0,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "orders"
JOIN "order_address_map" ON "order_address_map"."order_id" = "orders"."id"
WHERE "orders"."shipping_address" IS NOT NULL;
CREATE TABLE "new_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "address_id" INTEGER,
    "guest_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "total_price" DECIMAL NOT NULL,
    "shipping_fee" DECIMAL NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shipped_at" DATETIME,
    "delivered_at" DATETIME,
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("created_at", "guest_email", "id", "status", "total_price", "user_id", "address_id")
SELECT "created_at",
       "guest_email",
       "id",
       "status",
       "total_price",
       "user_id",
       (SELECT "address_id" FROM "order_address_map" WHERE "order_id" = "orders"."id")
FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");
CREATE INDEX "orders_address_id_idx" ON "orders"("address_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
