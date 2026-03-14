-- Rename `code` column to `code_hash` and drop the unique index.
-- Rationale: backup codes are now hashed with bcrypt (which embeds a random
-- salt), so two identical plaintext codes produce different hashes. A unique
-- constraint on the hash column is therefore meaningless and would prevent
-- per-code salting. Lookups are done by userId, covered by the existing index.

-- Drop the unique index on the old column name
DROP INDEX IF EXISTS "mfa_backup_codes_code_key";

-- Rename the column
ALTER TABLE "mfa_backup_codes" RENAME COLUMN "code" TO "code_hash";
