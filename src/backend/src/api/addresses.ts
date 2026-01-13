import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { addressSchema, updateAddressSchema } from '../schemas/address';
import { userService } from '../services/userService';
import { logger } from '../lib/logger';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const addresses = await userService.listAddresses(userId);
    res.json({ data: addresses });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to fetch addresses', { requestId, error, userId });
    res.status(500).json({ message: 'Failed to fetch addresses' });
  }
});

router.post('/', authenticate, validateBody(addressSchema), async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const address = await userService.createAddress(userId, req.body);
    res.status(201).json({ data: address });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to create address', { requestId, error, userId });
    res.status(500).json({ message: 'Failed to create address' });
  }
});

router.put('/:id', authenticate, validateBody(updateAddressSchema), async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.userId;
  const addressId = Number(req.params.id);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (Number.isNaN(addressId)) {
    return res.status(400).json({ message: 'Invalid address ID' });
  }

  try {
    const address = await userService.updateAddress(userId, addressId, req.body);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.json({ data: address });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to update address', { requestId, error, userId, addressId });
    res.status(500).json({ message: 'Failed to update address' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.userId;
  const addressId = Number(req.params.id);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (Number.isNaN(addressId)) {
    return res.status(400).json({ message: 'Invalid address ID' });
  }

  try {
    const deleted = await userService.deleteAddress(userId, addressId);
    if (!deleted) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.status(204).send();
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Failed to delete address', { requestId, error, userId, addressId });
    res.status(500).json({ message: 'Failed to delete address' });
  }
});

export default router;
