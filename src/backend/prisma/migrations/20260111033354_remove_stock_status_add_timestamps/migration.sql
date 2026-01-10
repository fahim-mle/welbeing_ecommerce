-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Create new products table with updated schema
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingredients" TEXT,
    "usage_instructions" TEXT,
    "benefits" TEXT,
    "safety_disclaimers" TEXT,
    "category_id" INTEGER NOT NULL,
    CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Copy data from old table, using CURRENT_TIMESTAMP for existing products
INSERT INTO "new_products" (
    "id", "name", "description", "price", "stock_quantity",
    "is_visible", "ingredients", "usage_instructions", "benefits",
    "safety_disclaimers", "category_id", "created_at", "updated_at"
) SELECT
    "id", "name", "description", "price", "stock_quantity",
    "is_visible", "ingredients", "usage_instructions", "benefits",
    "safety_disclaimers", "category_id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "products";

-- Drop old table
DROP TABLE "products";

-- Rename new table to products
ALTER TABLE "new_products" RENAME TO "products";

-- Recreate indexes
CREATE INDEX "products_category_id_idx" ON "products"("category_id");
CREATE INDEX "products_stock_quantity_idx" ON "products"("stock_quantity");
CREATE INDEX "products_is_visible_idx" ON "products"("is_visible");
CREATE INDEX "products_updated_at_idx" ON "products"("updated_at");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
