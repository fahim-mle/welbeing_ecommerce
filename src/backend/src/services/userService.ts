import { User, UserIdentity, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';

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
    passwordHash?: string
  ): Promise<UserIdentity> {
    return prisma.userIdentity.create({
      data: {
        userId,
        provider,
        providerId,
        passwordHash,
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
};
