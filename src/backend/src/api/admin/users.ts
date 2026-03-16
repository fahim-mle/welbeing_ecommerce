import { Router, Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { validateBody, validateQuery } from '../../middleware/validation';
import { updateUserSchema } from '../../schemas/adminUser';
import { adminUsersQuerySchema, AdminUsersQuery } from '../../schemas/pagination';
import { userService } from '../../services/userService';
import { logger } from '../../lib/logger';

const router = Router();

router.use(adminAuth);

// GET /api/admin/users - List users with search, filters, and pagination
router.get('/', validateQuery(adminUsersQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, role, status, mfaEnabled, page, limit } = req.query as unknown as AdminUsersQuery;

    const result = await userService.getAdminUsers({ search, role, status, mfaEnabled, page, limit });

    res.json({ success: true, ...result });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to fetch users', { requestId, error });
    next(error);
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
