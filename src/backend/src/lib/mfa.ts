import {
  generateSecret,
  generateURI,
  verifySync,
  NobleCryptoPlugin,
  ScureBase32Plugin,
} from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';

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
 * Each code is 8 characters (alphanumeric, uppercase) — easy to type,
 * sufficient entropy (~37 bits after stripping non-alphanumeric chars).
 * @param count - Number of codes to generate (default: 10)
 * @returns Array of plaintext backup codes
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // 6 random bytes → base64 → strip non-alphanumeric → uppercase → 8 chars.
    const code = crypto
      .randomBytes(6)
      .toString('base64')
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 8);
    codes.push(code);
  }
  return codes;
};

/**
 * Hash a backup code for storage using SHA-256.
 * Never store plaintext backup codes.
 */
export const hashBackupCode = (code: string): string => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

/**
 * Verify a backup code against its stored hash.
 */
export const verifyBackupCode = (code: string, hash: string): boolean => {
  return hashBackupCode(code) === hash;
};
