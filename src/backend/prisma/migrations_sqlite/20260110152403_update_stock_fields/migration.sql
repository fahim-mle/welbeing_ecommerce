-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "stock_status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "ingredients" TEXT,
    "usage_instructions" TEXT,
    "benefits" TEXT,
    "safety_disclaimers" TEXT,
    "category_id" INTEGER NOT NULL,
    CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_products" ("benefits", "category_id", "description", "id", "ingredients", "name", "price", "safety_disclaimers", "stock_status", "usage_instructions") SELECT "benefits", "category_id", "description", "id", "ingredients", "name", "price", "safety_disclaimers", "stock_status", "usage_instructions" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
