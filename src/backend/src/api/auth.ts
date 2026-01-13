import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { auth } from '../lib/auth';
import { logger } from '../lib/logger';

const router = Router();

const maskEmail = (value: unknown) => {
  if (typeof value !== 'string') {
    return 'unknown';
  }

  const [localPart, domain] = value.split('@');
  if (!localPart || !domain) {
    return 'unknown';
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? '*'}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
};

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await auth.hashPassword(password);
    const { user } = await userService.createUserWithIdentity(
      email,
      req.body.firstName || 'User',
      req.body.lastName || 'User',
      'EMAIL',
      email,
      passwordHash
    );

    const token = auth.generateToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Registration failed', { requestId, error, email: maskEmail(req.body?.email) });
    res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const identity = await userService.findIdentity('EMAIL', email);
    
    if (!identity || !identity.passwordHash) {
       // User not found or no password set for this identity
       return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await auth.comparePassword(password, identity.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = identity.user;
    const token = auth.generateToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Login failed', { requestId, error, email: maskEmail(req.body?.email) });
    res.status(500).json({ message: 'Login failed' });
  }
});

export default router;
