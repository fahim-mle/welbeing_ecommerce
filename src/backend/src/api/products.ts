import { Router } from 'express';
import * as catalogService from '../services/catalogService';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const categoryId = req.query.category ? Number(req.query.category) : undefined;
    const tagId = req.query.tag ? Number(req.query.tag) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    if (!Number.isInteger(page) || page <= 0) {
      res.status(400).json({ success: false, error: 'page must be a positive integer' });
      return;
    }

    if (!Number.isInteger(limit) || limit <= 0) {
      res.status(400).json({ success: false, error: 'limit must be a positive integer' });
      return;
    }

    const products = await catalogService.getProducts({ categoryId, tagId, search, page, limit });
    res.json({ success: true, data: products, page, limit });
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
