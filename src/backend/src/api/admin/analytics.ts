import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { analyticsService } from '../../services/analyticsService';
import { logger } from '../../lib/logger';

const router = Router();

router.use(adminAuth);

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    res.json({ data: stats });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to fetch analytics', { requestId, error });
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

export default router;
