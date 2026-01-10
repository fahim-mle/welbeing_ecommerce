import { auth } from '../../src/lib/auth';

describe('Auth Library', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'password123';
      const hash = await auth.hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should compare a valid password correctly', async () => {
      const password = 'password123';
      const hash = await auth.hashPassword(password);
      const isValid = await auth.comparePassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should fail comparison for invalid password', async () => {
      const password = 'password123';
      const hash = await auth.hashPassword(password);
      const isValid = await auth.comparePassword('wrongpassword', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT', () => {
    it('should generate and verify a token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = auth.generateToken(payload);
      
      const decoded = auth.verifyToken(token) as any;
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw on invalid token', () => {
      expect(() => {
        auth.verifyToken('invalid-token');
      }).toThrow();
    });
  });
});
