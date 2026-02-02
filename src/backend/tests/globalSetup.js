const path = require('path');
const { execSync } = require('child_process');

module.exports = async () => {
  const backendRoot = path.resolve(__dirname, '..');
  const schemaPath = path.resolve(backendRoot, 'prisma', 'schema.prisma');

  const baseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!baseUrl || (!baseUrl.startsWith('postgresql://') && !baseUrl.startsWith('postgres://'))) {
    throw new Error('Missing TEST_DATABASE_URL/DATABASE_URL for postgres tests. Expected postgresql://...');
  }

  const schemaName = process.env.TEST_DATABASE_SCHEMA || 'jest_test';

  // Ensure a clean test schema for each run.
  // 1) Drop schema if exists
  // 2) Recreate schema
  // 3) Push prisma schema into that schema
  const dbForTest = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}schema=${schemaName}`;

  const env = {
    ...process.env,
    DATABASE_URL: dbForTest,
    NODE_ENV: 'test',
    TEST_DATABASE_SCHEMA: schemaName,
  };

  // Ensure schema exists before tests.
  execSync(`npx prisma db push --force-reset --skip-generate --schema "${schemaPath}"`, {
    stdio: 'inherit',
    env,
    cwd: backendRoot,
  });
};
