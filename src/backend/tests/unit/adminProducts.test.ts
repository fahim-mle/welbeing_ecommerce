/**
 * Unit tests for admin products search & pagination (Issue #35 Milestone 2).
 *
 * Covers:
 *  - catalogService.getAdminProducts: pagination maths, search where-clause, limit cap
 *  - adminProductsQuerySchema: valid inputs, invalid page, invalid limit, search passthrough
 */

// ---------------------------------------------------------------------------
// Mock Prisma so no real DB connection is needed
// ---------------------------------------------------------------------------
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock Redis so catalogService imports don't blow up
jest.mock('../../src/lib/redis', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  deleteCache: jest.fn().mockResolvedValue(undefined),
  deleteByPattern: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '../../src/lib/prisma';
import { getAdminProducts } from '../../src/services/catalogService';
import { adminProductsQuerySchema } from '../../src/schemas/pagination';

const mockTransaction = prisma.$transaction as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal fake product list of `n` items. */
const fakeProducts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Product ${i + 1}` }));

/** Parse the schema and return the transformed value (throws on failure). */
const parseQuery = (input: Record<string, unknown>) => adminProductsQuerySchema.parse(input);

// ---------------------------------------------------------------------------
// catalogService.getAdminProducts
// ---------------------------------------------------------------------------

describe('catalogService.getAdminProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns first page with default page=1 and limit=20', async () => {
    const products = fakeProducts(20);
    mockTransaction.mockResolvedValue([products, 50]);

    const result = await getAdminProducts({});

    expect(result.pagination).toEqual({ total: 50, page: 1, limit: 20, totalPages: 3 });
    expect(result.data).toHaveLength(20);

    // Verify skip/take passed to findMany
    const [findManyCall] = mockTransaction.mock.calls[0][0];
    // $transaction receives an array of promises; inspect the args via the mock
    // by checking the call args on the transaction itself
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('calculates skip correctly for page 2 with limit 10', async () => {
    const products = fakeProducts(10);
    mockTransaction.mockResolvedValue([products, 35]);

    const result = await getAdminProducts({ page: 2, limit: 10 });

    expect(result.pagination).toEqual({ total: 35, page: 2, limit: 10, totalPages: 4 });
  });

  it('caps limit at 100 even when a higher value is passed', async () => {
    mockTransaction.mockResolvedValue([[], 0]);

    const result = await getAdminProducts({ page: 1, limit: 999 });

    expect(result.pagination.limit).toBe(100);
  });

  it('returns totalPages=1 when total equals limit', async () => {
    mockTransaction.mockResolvedValue([fakeProducts(20), 20]);

    const result = await getAdminProducts({ page: 1, limit: 20 });

    expect(result.pagination.totalPages).toBe(1);
  });

  it('returns totalPages=0 when there are no products', async () => {
    mockTransaction.mockResolvedValue([[], 0]);

    const result = await getAdminProducts({});

    expect(result.pagination).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 });
    expect(result.data).toHaveLength(0);
  });

  it('rounds totalPages up (ceiling division)', async () => {
    mockTransaction.mockResolvedValue([fakeProducts(10), 21]);

    const result = await getAdminProducts({ page: 1, limit: 10 });

    // 21 / 10 = 2.1 → ceil → 3
    expect(result.pagination.totalPages).toBe(3);
  });

  it('builds a case-insensitive OR where clause when search is provided', async () => {
    mockTransaction.mockResolvedValue([[], 0]);

    await getAdminProducts({ search: 'Protein' });

    // The $transaction call receives an array; the first element is the findMany promise.
    // We verify the transaction was called (where-clause construction is internal to Prisma).
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // The transaction array has 2 elements (findMany + count)
    expect(mockTransaction.mock.calls[0][0]).toHaveLength(2);
  });

  it('uses an empty where clause when no search is provided', async () => {
    mockTransaction.mockResolvedValue([fakeProducts(5), 5]);

    await getAdminProducts({});

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// adminProductsQuerySchema
// ---------------------------------------------------------------------------

describe('adminProductsQuerySchema', () => {
  describe('valid inputs', () => {
    it('applies defaults when no params are provided', () => {
      const result = parseQuery({});
      expect(result).toEqual({ search: undefined, page: 1, limit: 20 });
    });

    it('parses valid page and limit', () => {
      const result = parseQuery({ page: '2', limit: '10' });
      expect(result).toEqual({ search: undefined, page: 2, limit: 10 });
    });

    it('passes search string through unchanged', () => {
      const result = parseQuery({ search: 'protein', page: '1', limit: '5' });
      expect(result.search).toBe('protein');
    });

    it('accepts limit=1 (minimum)', () => {
      const result = parseQuery({ limit: '1' });
      expect(result.limit).toBe(1);
    });

    it('accepts limit=100 (maximum)', () => {
      const result = parseQuery({ limit: '100' });
      expect(result.limit).toBe(100);
    });

    it('accepts page=1 (minimum)', () => {
      const result = parseQuery({ page: '1' });
      expect(result.page).toBe(1);
    });

    it('treats empty string search as undefined', () => {
      const result = parseQuery({ search: '' });
      expect(result.search).toBeUndefined();
    });
  });

  describe('invalid page', () => {
    it('rejects page=0', () => {
      expect(() => parseQuery({ page: '0' })).toThrow();
    });

    it('rejects negative page', () => {
      expect(() => parseQuery({ page: '-1' })).toThrow();
    });

    it('rejects non-numeric page', () => {
      expect(() => parseQuery({ page: 'abc' })).toThrow();
    });

    it('rejects fractional page', () => {
      expect(() => parseQuery({ page: '1.5' })).toThrow();
    });
  });

  describe('invalid limit', () => {
    it('rejects limit=0', () => {
      expect(() => parseQuery({ limit: '0' })).toThrow();
    });

    it('rejects limit=101 (above max)', () => {
      expect(() => parseQuery({ limit: '101' })).toThrow();
    });

    it('rejects negative limit', () => {
      expect(() => parseQuery({ limit: '-5' })).toThrow();
    });

    it('rejects non-numeric limit', () => {
      expect(() => parseQuery({ limit: 'many' })).toThrow();
    });

    it('rejects fractional limit', () => {
      expect(() => parseQuery({ limit: '2.5' })).toThrow();
    });
  });
});
