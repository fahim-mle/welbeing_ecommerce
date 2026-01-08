import { Router } from 'express';
import * as catalogService from '../services/catalogService';

const router = Router();

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await catalogService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

router.get('/tags', async (req, res, next) => {
  try {
    const tags = await catalogService.getTags();
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
});

export default router;
