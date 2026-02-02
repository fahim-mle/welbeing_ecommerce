import path from 'path';

// Ensure tests always use a dedicated Postgres schema with a stable connection string.
// This avoids coupling tests to local dev data.
//
// We keep the same DB but use a separate schema so we can reset safely.
const baseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!baseUrl || (!baseUrl.startsWith('postgresql://') && !baseUrl.startsWith('postgres://'))) {
  throw new Error(
    'Missing TEST_DATABASE_URL/DATABASE_URL for postgres tests. Expected postgresql://...'
  );
}

process.env.TEST_DATABASE_SCHEMA = process.env.TEST_DATABASE_SCHEMA || 'jest_test';
process.env.NODE_ENV = 'test';

// Note: schema is added in Prisma connection string in globalSetup.
