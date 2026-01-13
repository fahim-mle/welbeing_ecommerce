import { User, UserIdentity, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { auth } from '../lib/auth';

export const userService = {
  /**
   * Find a user by their email address.
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Find a user by their database ID.
   */
  async findUserById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  /**
   * Create a new user record.
   */
  async createUser(email: string, firstName: string, lastName: string, role: UserRole = 'USER'): Promise<User> {
    return prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role,
      },
    });
  },

  /**
   * Find a user identity by provider and providerId.
   * Includes the associated User object.
   */
  async findIdentity(provider: string, providerId: string) {
    return prisma.userIdentity.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        user: true,
      },
    });
  },

  /**
   * Create a new identity and link it to an existing user.
   */
  async createIdentity(
    userId: number,
    provider: string,
    providerId: string,
    passwordHash?: string,
    options?: {
      isVerified?: boolean;
      verifiedAt?: Date;
    }
  ): Promise<UserIdentity> {
    return prisma.userIdentity.create({
      data: {
        userId,
        provider,
        providerId,
        passwordHash,
        isVerified: options?.isVerified ?? false,
        verifiedAt: options?.verifiedAt,
      },
    });
  },

  /**
   * Transactionally create a User and their initial UserIdentity.
   */
  async createUserWithIdentity(
    email: string,
    firstName: string,
    lastName: string,
    provider: string,
    providerId: string,
    passwordHash?: string,
    role: UserRole = 'USER'
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          role,
        },
      });

      const identity = await tx.userIdentity.create({
        data: {
          userId: user.id,
          provider,
          providerId,
          passwordHash,
        },
      });

      return { user, identity };
    });
  },

  async markIdentityVerified(userId: number, provider: string) {
    await prisma.userIdentity.updateMany({
      where: { userId, provider },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  },

  async createRefreshToken(userId: number, ttlHours = 24 * 7) {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return { token, expiresAt };
  },

  async rotateRefreshToken(existingToken: string, ttlHours = 24 * 7) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: existingToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return null;
    }

    await prisma.refreshToken.delete({ where: { token: existingToken } });
    const next = await this.createRefreshToken(stored.userId, ttlHours);
    return { userId: stored.userId, token: next.token, expiresAt: next.expiresAt };
  },

  async revokeRefreshToken(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  },

  async createEmailVerificationToken(userId: number, ttlHours = 24) {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await prisma.emailVerificationToken.deleteMany({ where: { userId } });
    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return { token, expiresAt };
  },

  async verifyEmailToken(token: string) {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      return null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.userIdentity.updateMany({
        where: { userId: record.userId, provider: 'EMAIL' },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
      await tx.emailVerificationToken.delete({ where: { token } });
    });

    return record.userId;
  },

  async createPasswordResetToken(email: string, ttlHours = 2) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    return { token, expiresAt, user };
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      return null;
    }

    const passwordHash = await auth.hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.userIdentity.updateMany({
        where: { userId: record.userId, provider: 'EMAIL' },
        data: { passwordHash },
      });
      await tx.passwordResetToken.delete({ where: { token } });
    });

    return record.userId;
  },
};
