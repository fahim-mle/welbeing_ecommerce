import { Router } from 'express';
import * as catalogService from '../services/catalogService';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const categoryId = req.query.category ? Number(req.query.category) : undefined;
    const tagId = req.query.tag ? Number(req.query.tag) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const products = await catalogService.getProducts({ categoryId, tagId, search });
    res.json({ success: true, data: products });
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
