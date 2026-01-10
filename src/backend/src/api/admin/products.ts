import { Router, Request, Response } from 'express';
import * as catalogService from '../../services/catalogService';
import { adminAuth } from '../../middleware/adminAuth';

const router = Router();

// Apply admin auth middleware to all routes in this router
router.use(adminAuth);

// POST /api/admin/products - Create Product
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      categoryId,
      imageUrls = [],
      tagIds = [],
      stockStatus,
      ingredients,
      usageInstructions,
      benefits,
      safetyDisclaimers,
    } = req.body;

    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const product = await catalogService.createProduct({
      name,
      description,
      price: Number(price),
      categoryId: Number(categoryId),
      imageUrls,
      tagIds: tagIds.map((id: any) => Number(id)),
      stockStatus,
      ingredients,
      usageInstructions,
      benefits,
      safetyDisclaimers,
    });

    res.status(201).json(product);
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// PUT /api/admin/products/:id - Update Product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
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
      stockStatus,
      ingredients,
      usageInstructions,
      benefits,
      safetyDisclaimers,
    } = req.body;

    const product = await catalogService.updateProduct(id, {
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
      imageUrls,
      tagIds: tagIds ? tagIds.map((id: any) => Number(id)) : undefined,
      stockStatus,
      ingredients,
      usageInstructions,
      benefits,
      safetyDisclaimers,
    });

    res.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === 'P2025') {
       return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// DELETE /api/admin/products/:id - Delete Product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    await catalogService.deleteProduct(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting product:', error);
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
