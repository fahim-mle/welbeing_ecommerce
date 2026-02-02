import { PrismaClient } from '@prisma/client';
import path from 'path';

// Normalize sqlite relative DB paths so running from workspace root vs package dir behaves the same.
// Prisma resolves `file:./...` relative to process.cwd(), which is not guaranteed in a monorepo.
const normalizeDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  // Only normalize sqlite file urls.
  if (!url.startsWith('file:./')) return;

  const relPath = url.slice('file:'.length); // includes leading './'
  // __dirname is `src/backend/src/lib`, so go up to `src/backend/`.
  const backendRoot = path.resolve(__dirname, '..', '..');
  const absPath = path.resolve(backendRoot, relPath);
  process.env.DATABASE_URL = `file:${absPath}`;
};

normalizeDatabaseUrl();

const prismaGlobal = global as typeof global & {
  prisma?: PrismaClient;
};

export const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma;
}
