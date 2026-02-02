const path = require('path');
const { execSync } = require('child_process');

module.exports = async () => {
  const backendRoot = __dirname; // tests/
  const dbPath = path.resolve(backendRoot, '..', 'prisma', 'jest_test.db');
  const schemaPath = path.resolve(backendRoot, '..', 'prisma', 'schema.prisma');

  // Use absolute file: URL so Prisma doesn't depend on cwd.
  const env = {
    ...process.env,
    DATABASE_URL: `file:${dbPath}`,
    NODE_ENV: 'test',
  };

  // Ensure schema exists before tests.
  execSync(`npx prisma db push --force-reset --skip-generate --schema "${schemaPath}"`, {
    stdio: 'inherit',
    env,
    cwd: path.resolve(backendRoot, '..'),
  });
};
