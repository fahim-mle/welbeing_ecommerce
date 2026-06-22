import crypto from 'crypto';
import sharp from 'sharp';
import type { ProcessedImage } from './types';

export const IMAGE_SIZES = {
  thumbnail: { width: 200, height: 200 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
} as const;

export type ImageSizeKey = keyof typeof IMAGE_SIZES;

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateImage(mimetype: string, size: number): void {
  if (!ALLOWED_MIMETYPES.includes(mimetype)) {
    throw new Error(`Unsupported file type: ${mimetype}. Allowed: JPEG, PNG, WebP, AVIF.`);
  }

  if (size <= 0) {
    throw new Error('File is empty.');
  }

  if (size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${size} bytes. Maximum: ${MAX_FILE_SIZE} bytes (10MB).`);
  }
}

export async function processImage(buffer: Buffer, sizeKey: ImageSizeKey): Promise<ProcessedImage> {
  const { width, height } = IMAGE_SIZES[sizeKey];
  const processed = await sharp(buffer)
    .rotate()
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: processed.data,
    width: processed.info.width,
    height: processed.info.height,
    format: 'webp',
  };
}

export function generateImageKey(buffer: Buffer, sizeKey: ImageSizeKey, directory = 'products'): string {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  const safeDirectory = directory.replace(/^\/+|\.\.+/g, '').replace(/[^a-zA-Z0-9/_-]/g, '-');
  return `${safeDirectory}/${hash}-${sizeKey}.webp`;
}
