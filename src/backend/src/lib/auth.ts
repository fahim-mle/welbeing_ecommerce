import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { COOKIE_NAMES } from './cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod';
const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  mfaPending?: boolean;  // Indicates MFA verification is pending
  iat?: number;
  exp?: number;
}

export const auth = {
  /**
   * Hash a plain text password.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Compare a plain text password with a hash.
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate a JWT token.
   */
  generateToken(payload: TokenPayload, expiresIn: string | number = '7d'): string {
    const options: SignOptions = { expiresIn: expiresIn as any };
    return jwt.sign(payload, JWT_SECRET, options);
  },

  /**
   * Verify and decode a JWT token.
   * Throws an error if invalid.
   */
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  },

  decodeAuthorizationHeader(headerValue?: string): TokenPayload | null {
    if (!headerValue || !headerValue.startsWith('Bearer ')) {
      return null;
    }

    const token = headerValue.split(' ')[1];
    if (!token) {
      return null;
    }

    try {
      return this.verifyToken(token);
    } catch {
      // Token verification failed - could be expired, invalid signature, etc.
      // Return null but don't log sensitive details in production
      return null;
    }
  },
};

/**
 * Extract the access token from the httpOnly cookie first,
 * falling back to the Authorization header for backward compatibility.
 */
export const extractAccessToken = (req: Request): string | undefined => {
  const cookieToken = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) return token;
  }

  return undefined;
};
