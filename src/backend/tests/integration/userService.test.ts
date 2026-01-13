import { userService } from '../../src/services/userService';
import { prisma } from '../../src/lib/prisma';

describe('UserService Integration', () => {
  beforeAll(async () => {
    // Cleanup any existing test data
    await prisma.userIdentity.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.userIdentity.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('createUserWithIdentity', () => {
    it('should create a user and identity successfully', async () => {
      const email = 'test@example.com';
      const firstName = 'Test';
      const lastName = 'User';
      const provider = 'EMAIL';
      const providerId = 'test@example.com';
      const passwordHash = 'hashedpassword123';

      const result = await userService.createUserWithIdentity(
        email,
        firstName,
        lastName,
        provider,
        providerId,
        passwordHash
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.identity).toBeDefined();
      expect(result.identity.provider).toBe(provider);
      expect(result.identity.userId).toBe(result.user.id);
    });

    it('should fail if email is already taken', async () => {
      const email = 'duplicate@example.com';
      const firstName = 'Duplicate';
      const lastName = 'User';
      await userService.createUser(email, firstName, lastName);

      await expect(
        userService.createUserWithIdentity(email, firstName, lastName, 'EMAIL', 'dup-id', 'pass')
      ).rejects.toThrow();
    });
  });

  describe('findIdentity', () => {
    it('should find an identity and include the user', async () => {
      const email = 'identity@example.com';
      const firstName = 'Identity';
      const lastName = 'User';
      const provider = 'GOOGLE';
      const providerId = 'google-id-123';

      const { user, identity } = await userService.createUserWithIdentity(
        email,
        firstName,
        lastName,
        provider,
        providerId
      );

      const found = await userService.findIdentity(provider, providerId);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(identity.id);
      expect(found?.user.id).toBe(user.id);
      expect(found?.user.email).toBe(email);
    });

    it('should return null for non-existent identity', async () => {
      const found = await userService.findIdentity('INVALID', 'id');
      expect(found).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const email = 'findme@example.com';
      const firstName = 'Find';
      const lastName = 'Me';
      await userService.createUser(email, firstName, lastName);

      const user = await userService.findUserByEmail(email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
    });
  });
});
