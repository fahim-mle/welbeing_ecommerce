import {
  generateSecret,
  generateURI,
  verifySync,
  NobleCryptoPlugin,
  ScureBase32Plugin,
} from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Shared plugin instances — NobleCryptoPlugin is pure-JS (no Node crypto dep),
// ScureBase32Plugin handles RFC 4648 base32 encoding required by authenticator apps.
const cryptoPlugin = new NobleCryptoPlugin();
const base32Plugin = new ScureBase32Plugin();

/**
 * Generate a new TOTP secret for a user.
 * Returns a base32-encoded secret string.
 */
export const generateTotpSecret = (): string => {
  return generateSecret({ crypto: cryptoPlugin, base32: base32Plugin });
};

/**
 * Generate a QR code data URL for TOTP enrollment.
 * @param email  - User's email (used as the OTP label)
 * @param secret - TOTP secret (base32)
 * @param issuer - App name shown in authenticator apps (default: "Welbeing Store")
 */
export const generateQrCode = async (
  email: string,
  secret: string,
  issuer: string = 'Welbeing Store',
): Promise<string> => {
  const otpauth = generateURI({ issuer, label: email, secret });
  return qrcode.toDataURL(otpauth);
};

/**
 * Verify a TOTP code against a secret.
 * Accepts a ±30 s clock-drift window (one period either side) to handle
 * minor time skew between the user's device and the server.
 * @param token  - 6-digit TOTP code from user
 * @param secret - TOTP secret (base32)
 * @returns true if valid, false otherwise
 */
export const verifyTotpToken = (token: string, secret: string): boolean => {
  try {
    const result = verifySync({
      token,
      secret,
      crypto: cryptoPlugin,
      base32: base32Plugin,
      epochTolerance: 30,
    });
    return result.valid;
  } catch {
    return false;
  }
};

/**
 * Generate N cryptographically secure backup codes.
 * Each code is exactly 8 characters drawn from A-Z and 0-9 (36 chars),
 * giving ~41 bits of entropy per code. Using direct character-set sampling
 * (rather than base64 + strip) guarantees a fixed length on every call.
 * @param count - Number of codes to generate (default: 10)
 * @returns Array of plaintext backup codes
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < count; i++) {
    let code = '';
    const randomBytes = crypto.randomBytes(8);
    for (let j = 0; j < 8; j++) {
      // Modulo bias is negligible here: 256 % 36 = 4 biased values out of 256.
      code += chars[randomBytes[j] % chars.length];
    }
    codes.push(code);
  }
  return codes;
};

/**
 * Hash a backup code for storage using bcrypt (10 rounds).
 * bcrypt is intentionally slow, making offline brute-force attacks infeasible
 * even if the database is compromised. SHA-256 was previously used but is
 * too fast for this purpose.
 * Never store plaintext backup codes.
 */
export const hashBackupCode = async (code: string): Promise<string> => {
  return await bcrypt.hash(code, 10);
};

/**
 * Verify a backup code against its stored bcrypt hash.
 *
 * bcrypt.compare() is implemented with a constant-time comparison internally,
 * preventing timing attacks. Do NOT replace this with a plain string equality
 * check (===) or crypto.timingSafeEqual on the hash strings — bcrypt hashes
 * are non-deterministic (each call embeds a fresh random salt), so the only
 * correct comparison is bcrypt.compare against the original plaintext.
 */
export const verifyBackupCode = async (code: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(code, hash);
};
