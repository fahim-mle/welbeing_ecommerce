import { Router } from 'express';
import * as catalogService from '../services/catalogService';
import { validateQuery } from '../middleware/validation';
import { productListQuerySchema } from '../schemas/products';

const router = Router();

router.get('/', validateQuery(productListQuerySchema), async (req, res, next) => {
  try {
    const { category, tag, search, page, limit } = req.query as unknown as {
      category?: number;
      tag?: number;
      search?: string;
      page: number;
      limit: number;
    };

    const { products, total } = await catalogService.getProducts({
      categoryId: category,
      tagId: tag,
      search,
      page,
      limit,
    });
    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid ID' });
      return;
    }

    const product = await catalogService.getProductById(id);
    if (!product) {
       res.status(404).json({ success: false, error: 'Product not found' });
       return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

export default router;
