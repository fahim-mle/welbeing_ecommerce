import { Request, Response, Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import * as catalogService from '../../services/catalogService';
import { logger } from '../../lib/logger';
import { validateBody, validateQuery } from '../../middleware/validation';
import { createProductSchema, updateProductSchema } from '../../schemas/products';
import { adminProductsQuerySchema } from '../../schemas/pagination';

const router = Router();

// Apply admin auth middleware to all routes in this router
router.use(adminAuth);

// GET /api/admin/products - List all products with search and pagination
router.get('/', validateQuery(adminProductsQuerySchema), async (req: Request, res: Response) => {
  try {
    const { search, page, limit } = req.query as unknown as { search?: string; page: number; limit: number };
    const result = await catalogService.getAdminProducts({ search, page, limit });
    res.json({ success: true, ...result });
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Error fetching admin products', { requestId, error });
    res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
});

// POST /api/admin/products - Create Product
router.post('/', validateBody(createProductSchema), async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      categoryId,
      imageUrls = [],
      tagIds = [],
      stockQuantity,
      isVisible,
      ingredients,
      usageInstructions,
      benefits,
      safetyDisclaimers,
    } = req.body;

    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    if (stockQuantity !== undefined && Number(stockQuantity) < 0) {
      return res.status(400).json({ message: 'Stock quantity cannot be negative' });
    }

    const product = await catalogService.createProduct({
      name,
      description,
      price: Number(price),
      categoryId: Number(categoryId),
      imageUrls,
      tagIds: tagIds.map((id: any) => Number(id)),
      stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
      isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
      ingredients,
      usageInstructions,
      benefits,
      safetyDisclaimers,
    });

    res.status(201).json(product);
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Error creating product', { requestId, error });
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// PUT /api/admin/products/:id - Update Product
router.put('/:id', validateBody(updateProductSchema), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const {
      name,
      description,
      price,
      categoryId,
      imageUrls,
      tagIds,
      stockQuantity,
      isVisible,
      ingredients,
      usageInstructions,

      benefits,
      safetyDisclaimers,
    } = req.body;

    if ('stockStatus' in req.body) {
      return res.status(400).json({ message: 'stockStatus is deprecated. Use stockQuantity instead.' });
    }

    const product = await catalogService.updateProduct(id, {
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
      imageUrls,
      tagIds: tagIds ? tagIds.map((id: any) => Number(id)) : undefined,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
      isVisible: isVisible !== undefined ? Boolean(isVisible) : undefined,
      ingredients,
      usageInstructions,
      benefits,
      safetyDisclaimers,
    });

    res.json(product);
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Error updating product', { requestId, error, productId: id });
    if (error.code === 'P2025') {
       return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// DELETE /api/admin/products/:id - Delete Product
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    await catalogService.deleteProduct(id);
    res.status(204).send();
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Error deleting product', { requestId, error, productId: id });
     if (error.message === 'Product not found' || error.code === 'P2025') {
       return res.status(404).json({ message: 'Product not found' });
    }
    if (error.message === 'Cannot delete product that has been ordered.') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

export default router;
