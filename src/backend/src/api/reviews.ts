import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { reviewBodySchema } from '../schemas/reviews';
import {
  createOrUpdateProductReview,
  deleteReview,
  listProductReviews,
  updateOwnReview,
} from '../services/reviewService';

const router = Router();

const parseId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const parsePagination = (query: Request['query']) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(50, Math.max(1, Number(query.limit) || 20)),
});

export const productReviewsRouter = Router({ mergeParams: true });

productReviewsRouter.get('/:id/reviews', async (req: Request, res: Response, next: NextFunction) => {
  const productId = parseId(req.params.id);
  if (!productId) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const { page, limit } = parsePagination(req.query);
    const { reviews, summary } = await listProductReviews(productId, page, limit);
    return res.json({
      success: true,
      data: reviews,
      summary,
      pagination: {
        page,
        limit,
        total: summary.totalReviews,
        totalPages: Math.ceil(summary.totalReviews / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
});

productReviewsRouter.post(
  '/:id/reviews',
  authenticate,
  validateBody(reviewBodySchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const productId = parseId(req.params.id);
    if (!productId) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    try {
      const result = await createOrUpdateProductReview(productId, req.user!.userId, req.body);
      if (!result.review) {
        return res.status(result.status).json({ message: 'Product not found' });
      }
      return res.status(result.status).json({ success: true, data: result.review });
    } catch (error) {
      return next(error);
    }
  },
);

router.put(
  '/:id',
  authenticate,
  validateBody(reviewBodySchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const reviewId = parseId(req.params.id);
    if (!reviewId) {
      return res.status(400).json({ message: 'Invalid review ID' });
    }

    try {
      const result = await updateOwnReview(reviewId, req.user!.userId, req.body);
      if (!result.review) {
        return res.status(result.status).json({ message: result.status === 403 ? 'Forbidden' : 'Review not found' });
      }
      return res.json({ success: true, data: result.review });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const reviewId = parseId(req.params.id);
  if (!reviewId) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  try {
    const status = await deleteReview(reviewId, req.user!.userId, req.user!.role);
    if (status !== 204) {
      return res.status(status).json({ message: status === 403 ? 'Forbidden' : 'Review not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
