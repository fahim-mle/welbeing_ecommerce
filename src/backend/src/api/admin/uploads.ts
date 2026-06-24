import { Request, Response, Router } from 'express';
import multer from 'multer';
import { adminAuth } from '../../middleware/adminAuth';
import { uploadImage } from '../../middleware/upload';
import { getStorage } from '../../lib/storage';
import { logger } from '../../lib/logger';

const router = Router();

router.use(adminAuth);

router.post('/images', uploadImage.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    const result = await getStorage().upload({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    }, 'products');

    res.status(201).json(result);
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Error uploading image', { requestId, error });
    res.status(400).json({ message: error.message || 'Image upload failed.' });
  }
});

router.use((error: Error, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError || error.message?.startsWith('Unsupported file type')) {
    res.status(400).json({ message: error.message });
    return;
  }
  next(error);
});

export default router;
