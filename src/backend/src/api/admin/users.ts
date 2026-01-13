import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { validateBody } from '../../middleware/validation';
import { updateUserSchema } from '../../schemas/adminUser';
import { userService } from '../../services/userService';
import { logger } from '../../lib/logger';

const router = Router();

router.use(adminAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    if (!Number.isInteger(page) || page <= 0) {
      return res.status(400).json({ message: 'page must be a positive integer' });
    }

    if (!Number.isInteger(limit) || limit <= 0) {
      return res.status(400).json({ message: 'limit must be a positive integer' });
    }

    const users = await userService.listUsers({ page, limit });
    res.json({ data: users, page, limit });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to fetch users', { requestId, error });
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.patch('/:id', validateBody(updateUserSchema), async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await userService.updateUser(userId, req.body);
    res.json({ data: user });
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    logger.error('Failed to update user', { requestId, error, userId });
    res.status(500).json({ message: 'Failed to update user' });
  }
});

export default router;
