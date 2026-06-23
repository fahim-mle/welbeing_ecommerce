import { Router, Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { listAdminReviews } from '../../services/reviewService';

const router = Router();

router.use(adminAuth);

const parsePagination = (query: Request['query']) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(50, Math.max(1, Number(query.limit) || 20)),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { reviews, total } = await listAdminReviews(page, limit);
    return res.json({
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
