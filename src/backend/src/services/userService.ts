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

  async updateProfile(userId: number, data: { firstName?: string; lastName?: string; phone?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    });
  },

  async updatePassword(userId: number, password: string) {
    const passwordHash = await auth.hashPassword(password);
    await prisma.userIdentity.updateMany({
      where: { userId, provider: 'EMAIL' },
      data: { passwordHash },
    });
  },

  /**
   * Check whether MFA is enabled for a given user.
   * Returns false if the user does not exist.
   */
  async isMfaEnabled(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });
    return user?.mfaEnabled ?? false;
  },

  async linkGuestOrders(email: string, userId: number) {
    await prisma.order.updateMany({
      where: {
        guestEmail: email,
        userId: null,
      },
      data: {
        userId,
        guestEmail: null,
      },
    });
  },

  async listUsers(options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    return prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateUser(userId: number, data: { role?: UserRole; isActive?: boolean }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        role: data.role,
        isActive: data.isActive,
      },
    });
  },

  async listAddresses(userId: number) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createAddress(userId: number, data: {
    label: string;
    fullName: string;
    phone: string;
    streetLine1: string;
    streetLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
  }) {
    return prisma.address.create({
      data: {
        userId,
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        streetLine1: data.streetLine1,
        streetLine2: data.streetLine2 ?? null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault ?? false,
      },
    });
  },

  async updateAddress(userId: number, addressId: number, data: {
    label?: string;
    fullName?: string;
    phone?: string;
    streetLine1?: string;
    streetLine2?: string | null;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  }) {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      return null;
    }

    return prisma.address.update({
      where: { id: addressId },
      data: {
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        streetLine1: data.streetLine1,
        streetLine2: data.streetLine2 === undefined ? undefined : data.streetLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault,
      },
    });
  },

  async deleteAddress(userId: number, addressId: number) {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      return false;
    }

    await prisma.address.delete({ where: { id: addressId } });
    return true;
  },
};
