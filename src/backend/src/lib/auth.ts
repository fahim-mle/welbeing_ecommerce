import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod';
const SALT_ROUNDS = 10;

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
  generateToken(payload: object, expiresIn: string | number = '7d'): string {
    const options: SignOptions = { expiresIn: expiresIn as any }; 
    return jwt.sign(payload, JWT_SECRET, options);
  },

  /**
   * Verify and decode a JWT token.
   * Throws an error if invalid.
   */
  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
  },
};
