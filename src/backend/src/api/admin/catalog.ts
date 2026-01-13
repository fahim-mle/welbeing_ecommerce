import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { validateBody } from '../../middleware/validation';
import {
  categorySchema,
  tagSchema,
  updateCategorySchema,
  updateTagSchema,
} from '../../schemas/catalog';
import * as catalogService from '../../services/catalogService';
import { logger } from '../../lib/logger';

const router = Router();

router.use(adminAuth);

router.post('/categories', validateBody(categorySchema), async (req: Request, res: Response) => {
  try {
    const { name, description, parentId } = req.body;
    const category = await catalogService.createCategory({
      name,
      description,
      parentId: parentId !== undefined ? Number(parentId) : undefined,
    });
    res.status(201).json({ data: category });
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to create category', { requestId, error });
    res.status(500).json({ message: 'Failed to create category' });
  }
});

router.put('/categories/:id', validateBody(updateCategorySchema), async (req: Request, res: Response) => {
  const categoryId = Number(req.params.id);
  if (Number.isNaN(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  try {
    const { name, description, parentId } = req.body;
    const category = await catalogService.updateCategory(categoryId, {
      name,
      description,
      parentId: parentId === null ? null : parentId !== undefined ? Number(parentId) : undefined,
    });
    res.json({ data: category });
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Category not found' });
    }
    logger.error('Failed to update category', { requestId, error, categoryId });
    res.status(500).json({ message: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
  const categoryId = Number(req.params.id);
  if (Number.isNaN(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  try {
    await catalogService.deleteCategory(categoryId);
    res.status(204).send();
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to delete category', { requestId, error, categoryId });
    res.status(500).json({ message: error.message || 'Failed to delete category' });
  }
});

router.post('/tags', validateBody(tagSchema), async (req: Request, res: Response) => {
  try {
    const tag = await catalogService.createTag(req.body);
    res.status(201).json({ data: tag });
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to create tag', { requestId, error });
    res.status(500).json({ message: 'Failed to create tag' });
  }
});

router.put('/tags/:id', validateBody(updateTagSchema), async (req: Request, res: Response) => {
  const tagId = Number(req.params.id);
  if (Number.isNaN(tagId)) {
    return res.status(400).json({ message: 'Invalid tag ID' });
  }

  try {
    const tag = await catalogService.updateTag(tagId, req.body);
    res.json({ data: tag });
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Tag not found' });
    }
    logger.error('Failed to update tag', { requestId, error, tagId });
    res.status(500).json({ message: 'Failed to update tag' });
  }
});

router.delete('/tags/:id', async (req: Request, res: Response) => {
  const tagId = Number(req.params.id);
  if (Number.isNaN(tagId)) {
    return res.status(400).json({ message: 'Invalid tag ID' });
  }

  try {
    await catalogService.deleteTag(tagId);
    res.status(204).send();
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to delete tag', { requestId, error, tagId });
    res.status(500).json({ message: 'Failed to delete tag' });
  }
});

export default router;
