import path from 'path';

// Ensure tests always use a dedicated sqlite DB with a stable absolute path.
// This avoids coupling tests to local dev DB state.
const dbPath = path.resolve(__dirname, '..', 'prisma', 'jest_test.db');
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.NODE_ENV = 'test';
