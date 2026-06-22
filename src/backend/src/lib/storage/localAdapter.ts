import fs from 'fs/promises';
import path from 'path';
import type { StorageAdapter, UploadFile, UploadResult } from './types';
import { generateImageKey, processImage, validateImage } from './imageProcessor';

const DEFAULT_UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
const PUBLIC_BASE_URL = process.env.UPLOAD_BASE_URL || '/uploads';

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly uploadDir: string = DEFAULT_UPLOAD_DIR) {}

  async upload(file: UploadFile, directory = 'products'): Promise<UploadResult> {
    validateImage(file.mimetype, file.size);

    const processed = await processImage(file.buffer, 'large');
    const key = generateImageKey(processed.buffer, 'large', directory);
    const fullPath = path.join(this.uploadDir, key);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, processed.buffer);

    return {
      key,
      url: this.getUrl(key),
      size: processed.buffer.length,
      mimetype: 'image/webp',
      width: processed.width,
      height: processed.height,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getUrl(key: string): string {
    return `${PUBLIC_BASE_URL.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }
}
