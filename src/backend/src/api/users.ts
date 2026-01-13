import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { userService } from '../services/userService';
import { validateBody } from '../middleware/validation';
import { updatePasswordSchema, updateProfileSchema } from '../schemas/user';
import { logger } from '../lib/logger';

const router = Router();

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await userService.findUserById(userId);
    const addresses = await userService.listAddresses(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        addresses,
      },
    });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to fetch profile', { requestId, error, userId });
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.put('/me', authenticate, validateBody(updateProfileSchema), async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await userService.updateProfile(userId, req.body);
    res.json({
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to update profile', { requestId, error, userId });
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.put('/me/password', authenticate, validateBody(updatePasswordSchema), async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await userService.updatePassword(userId, req.body.password);
    res.json({ success: true });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to update password', { requestId, error, userId });
    res.status(500).json({ message: 'Failed to update password' });
  }
});

export default router;
