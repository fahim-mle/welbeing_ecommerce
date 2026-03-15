/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    // Transpile ESM-only packages in node_modules that Jest cannot load as CommonJS.
    // otplib and its @scure/base dependency ship as pure ESM ("type": "module").
    '^.+\\.js$': ['ts-jest', { diagnostics: false }],
  },
  // By default Jest ignores all of node_modules. Override to allow transpilation
  // of the ESM packages pulled in transitively by otplib.
  transformIgnorePatterns: [
    '/node_modules/(?!(otplib|@otplib|@scure|@noble)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Ensure prisma schema exists in an isolated DB before any tests run.
  globalSetup: '<rootDir>/tests/globalSetup.js',
  // Ensure env is set for every test file (dotenv in app.ts won't override existing env).
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  maxWorkers: 1,
};
