import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { addressSchema, updateAddressSchema } from '../schemas/address';
import { userService } from '../services/userService';
import { logger } from '../lib/logger';
import { getCache, setCache } from '../lib/redis';

const router = Router();

const autocompleteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/autocomplete', autocompleteLimiter, async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim();
  if (query.length < 4) {
    return res.json({ data: [] });
  }

  // Optional country restriction: comma-separated country codes (e.g. "au", "us").
  const countryCodesEnv = (process.env.NOMINATIM_COUNTRY_CODES || '').trim();

  // Cache by query + country restriction.
  const cacheKey = `addr:auto:${countryCodesEnv}:${query.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    try {
      return res.json({ data: JSON.parse(cached) });
    } catch {
      // ignore cache parse failure
    }
  }

  const requestId = (req as Request & { requestId?: string }).requestId;

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '5');
    url.searchParams.set('q', query);
    if (countryCodesEnv) {
      url.searchParams.set('countrycodes', countryCodesEnv);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        // Nominatim usage policy expects a valid UA.
        'User-Agent': process.env.NOMINATIM_USER_AGENT || 'welbeing-ecommerce-dev',
        ...(process.env.NOMINATIM_EMAIL ? { From: process.env.NOMINATIM_EMAIL } : {}),
        ...(req.headers['accept-language']
          ? { 'Accept-Language': String(req.headers['accept-language']) }
          : {}),
      },
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      logger.warn('Nominatim autocomplete failed', {
        requestId,
        status: response.status,
        query,
      });
      return res.status(502).json({ message: 'Failed to fetch address suggestions' });
    }

    const data = (await response.json()) as any[];

    const mapped = (Array.isArray(data) ? data : [])
      .map((item) => ({
        placeId: item.place_id,
        displayName: item.display_name,
        lat: item.lat,
        lon: item.lon,
        address: item.address,
      }))
      // de-dupe by display name
      .filter((item, index, arr) => arr.findIndex((x) => x.displayName === item.displayName) === index);

    // Cache for 1 day.
    await setCache(cacheKey, JSON.stringify(mapped), 60 * 60 * 24);

    res.json({ data: mapped });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    logger.error('Failed to autocomplete address', { requestId, error, query });
    res.status(isAbort ? 504 : 500).json({ message: 'Failed to autocomplete address' });
  }
});

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
