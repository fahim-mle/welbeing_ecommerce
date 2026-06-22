import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { LocalStorageAdapter } from '../../src/lib/storage/localAdapter';
import { validateImage } from '../../src/lib/storage/imageProcessor';

describe('image storage utilities', () => {
  let tinyPng: Buffer;

  beforeAll(async () => {
    tinyPng = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).png().toBuffer();
  });

  it('rejects unsupported image mimetypes', () => {
    expect(() => validateImage('text/plain', 10)).toThrow(/Unsupported file type/);
  });

  it('processes and stores uploaded images as webp files', async () => {
    const uploadDir = path.join(process.cwd(), 'tmp', `storage-test-${Date.now()}`);
    const adapter = new LocalStorageAdapter(uploadDir);

    try {
      const result = await adapter.upload({
        buffer: tinyPng,
        originalName: 'pixel.png',
        mimetype: 'image/png',
        size: tinyPng.length,
      }, 'products');

      expect(result.key).toMatch(/^products\/[a-f0-9]{16}-large\.webp$/);
      expect(result.url).toBe(`/uploads/${result.key}`);
      expect(result.mimetype).toBe('image/webp');
      expect(result.size).toBeGreaterThan(0);
      await expect(fs.access(path.join(uploadDir, result.key))).resolves.toBeUndefined();
    } finally {
      await fs.rm(uploadDir, { recursive: true, force: true });
    }
  });
});
