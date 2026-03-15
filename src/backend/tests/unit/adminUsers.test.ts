/**
 * Unit tests for admin users search, filters & pagination (Issue #35 Milestone 3).
 *
 * Covers:
 *  - userService.getAdminUsers: pagination maths, search where-clause, filter combinations, limit cap
 *  - adminUsersQuerySchema: valid inputs, filter parsing, invalid page/limit, mfaEnabled transform
 */

// ---------------------------------------------------------------------------
// Mock Prisma so no real DB connection is needed
// ---------------------------------------------------------------------------
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock auth lib (imported transitively by userService)
jest.mock('../../src/lib/auth', () => ({
  auth: {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    generateToken: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

import { prisma } from '../../src/lib/prisma';
import { userService } from '../../src/services/userService';
import { adminUsersQuerySchema } from '../../src/schemas/pagination';

const mockTransaction = prisma.$transaction as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal fake user list of `n` items. */
const fakeUsers = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    email: `user${i + 1}@example.com`,
    firstName: `First${i + 1}`,
    lastName: `Last${i + 1}`,
    phone: null,
    role: 'USER',
    isActive: true,
    mfaEnabled: false,
    createdAt: new Date(),
  }));

/** Parse the schema and return the transformed value (throws on failure). */
const parseQuery = (input: Record<string, unknown>) => adminUsersQuerySchema.parse(input);

// ---------------------------------------------------------------------------
// userService.getAdminUsers
// ---------------------------------------------------------------------------

describe('userService.getAdminUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns first page with default page=1 and limit=20', async () => {
    const users = fakeUsers(20);
    // $transaction resolves [total, data] — note: count comes first in the service
    mockTransaction.mockResolvedValue([50, users]);

    const result = await userService.getAdminUsers({});

    expect(result.pagination).toEqual({ total: 50, page: 1, limit: 20, totalPages: 3 });
    expect(result.data).toHaveLength(20);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('calculates skip correctly for page 2 with limit 10', async () => {
    const users = fakeUsers(10);
    mockTransaction.mockResolvedValue([35, users]);

    const result = await userService.getAdminUsers({ page: 2, limit: 10 });

    expect(result.pagination).toEqual({ total: 35, page: 2, limit: 10, totalPages: 4 });
  });

  it('caps limit at 100 even when a higher value is passed', async () => {
    mockTransaction.mockResolvedValue([0, []]);

    const result = await userService.getAdminUsers({ page: 1, limit: 999 });

    expect(result.pagination.limit).toBe(100);
  });

  it('returns totalPages=1 when total equals limit', async () => {
    mockTransaction.mockResolvedValue([20, fakeUsers(20)]);

    const result = await userService.getAdminUsers({ page: 1, limit: 20 });

    expect(result.pagination.totalPages).toBe(1);
  });

  it('returns totalPages=0 when there are no users', async () => {
    mockTransaction.mockResolvedValue([0, []]);

    const result = await userService.getAdminUsers({});

    expect(result.pagination).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 });
    expect(result.data).toHaveLength(0);
  });

  it('rounds totalPages up (ceiling division)', async () => {
    mockTransaction.mockResolvedValue([21, fakeUsers(10)]);

    const result = await userService.getAdminUsers({ page: 1, limit: 10 });

    // 21 / 10 = 2.1 → ceil → 3
    expect(result.pagination.totalPages).toBe(3);
  });

  it('calls $transaction once when search is provided', async () => {
    mockTransaction.mockResolvedValue([0, []]);

    await userService.getAdminUsers({ search: 'john' });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // Transaction receives an array of two operations (count + findMany)
    expect(mockTransaction.mock.calls[0][0]).toHaveLength(2);
  });

  it('calls $transaction once when role filter is provided', async () => {
    mockTransaction.mockResolvedValue([0, []]);

    await userService.getAdminUsers({ role: 'ADMIN' });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('calls $transaction once when status=active filter is provided', async () => {
    mockTransaction.mockResolvedValue([0, []]);

    await userService.getAdminUsers({ status: 'active' });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('calls $transaction once when status=inactive filter is provided', async () => {
    mockTransaction.mockResolvedValue([0, []]);

    await userService.getAdminUsers({ status: 'inactive' });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('calls $transaction once when mfaEnabled=true filter is provided', async () => {
    mockTransaction.mockResolvedValue([0, []]);

    await userService.getAdminUsers({ mfaEnabled: true });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('calls $transaction once when mfaEnabled=false filter is provided', async () => {
    mockTransaction.mockResolvedValue([0, []]);

    await userService.getAdminUsers({ mfaEnabled: false });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('calls $transaction once when all filters are combined', async () => {
    mockTransaction.mockResolvedValue([0, []]);

    await userService.getAdminUsers({
      search: 'john',
      role: 'ADMIN',
      status: 'active',
      mfaEnabled: true,
      page: 2,
      limit: 10,
    });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('uses an empty where clause when no filters are provided', async () => {
    mockTransaction.mockResolvedValue([5, fakeUsers(5)]);

    await userService.getAdminUsers({});

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// adminUsersQuerySchema
// ---------------------------------------------------------------------------

describe('adminUsersQuerySchema', () => {
  describe('valid inputs', () => {
    it('applies defaults when no params are provided', () => {
      const result = parseQuery({});
      expect(result).toEqual({
        search: undefined,
        role: undefined,
        status: undefined,
        mfaEnabled: undefined,
        page: 1,
        limit: 20,
      });
    });

    it('parses valid page and limit', () => {
      const result = parseQuery({ page: '2', limit: '10' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('passes search string through unchanged', () => {
      const result = parseQuery({ search: 'john', page: '1', limit: '5' });
      expect(result.search).toBe('john');
    });

    it('treats empty string search as undefined', () => {
      const result = parseQuery({ search: '' });
      expect(result.search).toBeUndefined();
    });

    it('accepts role=USER', () => {
      const result = parseQuery({ role: 'USER' });
      expect(result.role).toBe('USER');
    });

    it('accepts role=ADMIN', () => {
      const result = parseQuery({ role: 'ADMIN' });
      expect(result.role).toBe('ADMIN');
    });

    it('accepts status=active', () => {
      const result = parseQuery({ status: 'active' });
      expect(result.status).toBe('active');
    });

    it('accepts status=inactive', () => {
      const result = parseQuery({ status: 'inactive' });
      expect(result.status).toBe('inactive');
    });

    it('transforms mfaEnabled="true" to boolean true', () => {
      const result = parseQuery({ mfaEnabled: 'true' });
      expect(result.mfaEnabled).toBe(true);
    });

    it('transforms mfaEnabled="false" to boolean false', () => {
      const result = parseQuery({ mfaEnabled: 'false' });
      expect(result.mfaEnabled).toBe(false);
    });

    it('leaves mfaEnabled as undefined when omitted', () => {
      const result = parseQuery({});
      expect(result.mfaEnabled).toBeUndefined();
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

    it('parses all filters together', () => {
      const result = parseQuery({
        search: 'jane',
        role: 'ADMIN',
        status: 'inactive',
        mfaEnabled: 'true',
        page: '3',
        limit: '50',
      });
      expect(result).toEqual({
        search: 'jane',
        role: 'ADMIN',
        status: 'inactive',
        mfaEnabled: true,
        page: 3,
        limit: 50,
      });
    });
  });

  describe('invalid role', () => {
    it('rejects an unknown role value', () => {
      expect(() => parseQuery({ role: 'SUPERADMIN' })).toThrow();
    });
  });

  describe('invalid status', () => {
    it('rejects an unknown status value', () => {
      expect(() => parseQuery({ status: 'banned' })).toThrow();
    });
  });

  describe('invalid mfaEnabled', () => {
    it('rejects a non-boolean string for mfaEnabled', () => {
      expect(() => parseQuery({ mfaEnabled: 'yes' })).toThrow();
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
