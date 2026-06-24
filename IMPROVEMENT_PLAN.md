# Welbeing E-Commerce: Detailed Improvement Plan

**Project:** `welbeing_ecommerce` (branch `001-health-wellbeing-store`)
**Author:** al_biruni
**Date:** 2026-06-18 AEST
**Target:** Turing (AI coding agent)

---

## Critical Context for Turing

Before starting ANY phase, you MUST:

1. **Read `AGENTS.md`** at the project root for code conventions
2. **Run `npm run install:all`** to ensure dependencies are installed
3. **Create a new branch** from `001-health-wellbeing-store` for each phase:
   ```bash
   git checkout 001-health-wellbeing-store
   git pull origin 001-health-wellbeing-store
   git checkout -b feature/phaseN-description
   ```
4. **Run lint and tests after every phase:**
   ```bash
   npm run lint --workspace=@welbeing/frontend
   npm run test --workspace=@welbeing/frontend
   npm run lint --workspace=@welbeing/backend
   npm run test --workspace=@welbeing/backend
   ```
5. **Commit after each sub-task** within a phase, not just at the end.

**Tech stack facts you must respect:**
- **Tailwind CSS v4** (CSS-based config via `@theme` in `src/frontend/src/index.css`, NOT the old JS config). The `tailwind.config.js` file is essentially empty — the real config is in the CSS file.
- **Prisma 6** with PostgreSQL. All DB changes go through migrations: `npx prisma migrate dev --name <descriptive_name>`
- **Zod v4** for validation. All schemas in `src/backend/src/schemas/`.
- **React 19** with Context API for state (no Redux).
- Color accent is currently `indigo`. Neutral is `gray`. These are hardcoded 500+ times across all `.tsx` files.

---

# Phase 1: Centralized Theme System

## Goal

Replace all hardcoded color utilities (`bg-indigo-600`, `text-gray-900`, etc.) with semantic theme tokens (`bg-primary`, `text-primary`, `text-surface`, etc.) so that changing the primary and secondary color values in ONE file updates the entire site.

## Why

The current code has `indigo-600` used 28+ times as text color, `bg-indigo-600` 9 times, `ring-indigo-500` 18 times, plus hundreds of `gray-*` utility classes spread across 18+ component files. Changing the brand color requires finding and replacing in every file. A centralized theme means one place to change everything.

## Step 1.1: Define Theme Tokens in `index.css`

**File:** `src/frontend/src/index.css`

Replace the entire `@theme` block and the `@layer base` and `@layer components` sections with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* ============================================= */
  /*  BRAND COLORS — Change these to re-skin       */
  /*  the entire site. Only edit values here.      */
  /* ============================================= */

  /* Primary brand color (buttons, links, accents) */
  --color-primary-50:  #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;

  /* Secondary brand color (highlights, badges) */
  --color-secondary-50:  #fdf4ff;
  --color-secondary-100: #fae8ff;
  --color-secondary-200: #f5d0fe;
  --color-secondary-300: #f0abfc;
  --color-secondary-400: #e879f9;
  --color-secondary-500: #d946ef;
  --color-secondary-600: #c026d3;
  --color-secondary-700: #a21caf;
  --color-secondary-800: #86198f;
  --color-secondary-900: #701a75;

  /* Neutral / surface palette (backgrounds, text, borders) */
  --color-surface:       #ffffff;   /* card backgrounds */
  --color-surface-alt:   #f9fafb;   /* page background */
  --color-surface-dark:  #374151;   /* dark sections */
  --color-text-primary:   #111827;   /* headings, body text */
  --color-text-secondary: #6b7280;   /* labels, captions */
  --color-text-muted:     #9ca3af;   /* placeholders */
  --color-border-default: #e5e7eb;
  --color-border-focus:   #6366f1;

  /* Status colors (keep semantic — don't rebrand these) */
  --color-danger-50:  #fef2f2;
  --color-danger-100: #fee2e2;
  --color-danger-500: #ef4444;
  --color-danger-600: #dc2626;
  --color-danger-700: #b91c1c;

  --color-success-50:  #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-success-700: #15803d;

  --color-warning-50:  #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
}
```

Tailwind v4 auto-generates utility classes from `@theme` variables. The naming convention `--color-primary-600` generates utilities like `bg-primary-600`, `text-primary-600`, `border-primary-600`, `ring-primary-600`, `from-primary-600`, etc.

For the surface/text tokens (which use single names, not numbered shades), Tailwind v4 generates: `bg-surface`, `text-text-primary`, `border-border-default`, etc.

## Step 1.2: Update Component Classes in `index.css`

Still in `src/frontend/src/index.css`, replace the `@layer components` section:

```css
@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200;
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center px-4 py-2 border border-border-default rounded-lg shadow-sm text-sm font-medium text-text-primary bg-surface hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200;
  }

  .btn-danger {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 transition-all duration-200;
  }

  .btn-ghost {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-text-primary hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200;
  }

  .form-input {
    @apply w-full rounded-lg border border-border-default px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200;
  }

  .form-label {
    @apply block text-sm font-medium text-text-primary mb-1;
  }
}
```

And update the `@layer base` section:

```css
@layer base {
  body {
    @apply antialiased bg-surface-alt;
    font-family: var(--font-sans);
    color: var(--color-text-primary);
  }
}
```

## Step 1.3: Mass Replace Hardcoded Colors Across All Components

This is the critical step. You must replace every hardcoded color utility class with the theme equivalent across ALL `.tsx` files in `src/frontend/src/`.

**Run this find-and-replace mapping. Use exact string matching. Process in this order to avoid double-replacements:**

### Indigo → Primary (brand accent)

| Find (exact) | Replace with |
|---------------|-------------|
| `bg-indigo-50` | `bg-primary-50` |
| `bg-indigo-100` | `bg-primary-100` |
| `bg-indigo-600` | `bg-primary-600` |
| `bg-indigo-700` | `bg-primary-700` |
| `text-indigo-600` | `text-primary-600` |
| `text-indigo-700` | `text-primary-700` |
| `text-indigo-800` | `text-primary-800` |
| `text-indigo-900` | `text-primary-900` |
| `border-indigo-500` | `border-primary-500` |
| `ring-indigo-500` | `ring-primary-500` |
| `focus:border-indigo-500` | `focus:border-primary-500` |
| `focus:ring-indigo-500` | `focus:ring-primary-500` |

### Gray → Surface/Text/Border tokens

| Find (exact) | Replace with |
|---------------|-------------|
| `bg-gray-50` | `bg-surface-alt` |
| `bg-gray-100` | `bg-surface-alt` |
| `bg-gray-200` | `bg-border-default` |
| `bg-white` | `bg-surface` |
| `text-gray-900` | `text-text-primary` |
| `text-gray-700` | `text-text-primary` |
| `text-gray-600` | `text-text-secondary` |
| `text-gray-500` | `text-text-secondary` |
| `text-gray-400` | `text-text-muted` |
| `border-gray-100` | `border-border-default` |
| `border-gray-200` | `border-border-default` |
| `border-gray-300` | `border-border-default` |
| `ring-gray-300` | `ring-border-default` |
| `focus:border-gray-300` | `focus:border-border-default` |
| `focus:ring-gray-500` | `focus:ring-primary-500` |

### Red → Danger (status)

| Find (exact) | Replace with |
|---------------|-------------|
| `bg-red-50` | `bg-danger-50` |
| `bg-red-100` | `bg-danger-100` |
| `bg-red-600` | `bg-danger-600` |
| `text-red-600` | `text-danger-600` |
| `text-red-700` | `text-danger-700` |
| `text-red-800` | `text-danger-700` |
| `border-red-200` | `border-danger-100` |

### Green → Success (status)

| Find (exact) | Replace with |
|---------------|-------------|
| `bg-green-50` | `bg-success-50` |
| `bg-green-100` | `bg-success-100` |
| `text-green-600` | `text-success-600` |
| `text-green-700` | `text-success-700` |
| `text-green-800` | `text-success-700` |

**IMPORTANT:** Leave these colors alone — they are intentional status colors used in specific contexts (e.g., yellow for warnings, blue for links). Do NOT blindly replace every color.

## Step 1.4: Clean Up Dead CSS

**File:** `src/frontend/src/App.css`

This file contains leftover Vite template CSS (`.logo`, `@keyframes logo-spin`, `.read-the-docs`). Delete the entire file or replace its contents with just:

```css
/* App-level styles */
```

Make sure `App.css` is not imported anywhere (check `src/frontend/src/main.tsx`).

## Step 1.5: Verify Theme

**Test:** Change `--color-primary-600` from `#4f46e5` (indigo) to `#0891b2` (teal) in `index.css`. Every button, link, and accent on the entire site should change from indigo to teal. This proves the theme system works.

**Revert** to indigo after testing (or keep teal if Fahim prefers it — he will choose the final palette).

**Acceptance criteria:**
- [ ] No `indigo-` color class exists in any `.tsx` file
- [ ] No `gray-` color class exists in any `.tsx` file (except deliberate dark backgrounds like `bg-gray-700`)
- [ ] Changing `--color-primary-600` in `index.css` updates all accents site-wide
- [ ] `npm run build --workspace=@welbeing/frontend` succeeds without errors
- [ ] All existing tests pass

---

# Phase 2: Image Upload — Backend (Storage Abstraction + Local Adapter)

## Goal

Build a storage abstraction layer that supports local file storage now and AWS S3 later — without changing any calling code. Install Multer for file handling. Process images (resize/optimize) with Sharp.

## Industry Guide: Image Storage Architecture

```
┌──────────────────────────────────────────────────────┐
│                   STORAGE ABSTRACTION                  │
│                                                        │
│  interface StorageAdapter {                            │
│    upload(file, key): Promise<UploadResult>            │
│    delete(key): Promise<void>                          │
│    getUrl(key): string                                 │
│  }                                                     │
│                                                        │
│  ┌─────────────────┐     ┌──────────────────────────┐│
│  │  LocalAdapter   │     │    S3Adapter (Phase 3)    ││
│  │  (Phase 2)      │     │    (swap in when ready)   ││
│  │                 │     │                           ││
│  │  saves to:      │     │  uploads to:              ││
│  │  /uploads/      │     │  s3://bucket/             ││
│  │  served via     │     │  served via               ││
│  │  Express static │     │  CloudFront/signed URL    ││
│  └─────────────────┘     └──────────────────────────┘│
│                                                        │
│  Backend code calls:                                   │
│    storage.upload(file, key)                           │
│    storage.delete(key)                                 │
│    storage.getUrl(key)                                 │
│  ...regardless of which adapter is active.             │
└──────────────────────────────────────────────────────┘
```

**Key design decisions:**
1. **Always process images before storage** — resize to max dimensions, convert to WebP/AVIF for size savings, strip EXIF for privacy. This reduces bandwidth by 50-80%.
2. **Generate multiple sizes** — thumbnail (200px), medium (600px), large (1200px). Store all and serve appropriate size via `srcset`.
3. **Store by content hash** — filename = `{hash}.webp`. Prevents duplicates and allows CDN caching.
4. **Never trust client filenames** — generate server-side names only.
5. **Validate file types** — check MIME type AND magic bytes, not just the extension.

## Step 2.1: Install Dependencies

```bash
cd src/backend
npm install multer sharp
npm install -D @types/multer
```

**What each does:**
- `multer` — Express middleware for multipart/form-data file uploads
- `sharp` — Image processing (resize, format conversion, optimization). Uses native bindings, extremely fast.

## Step 2.2: Create Storage Abstraction

**New file:** `src/backend/src/lib/storage/types.ts`

```typescript
export interface UploadFile {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  size: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

export interface UploadResult {
  key: string;          // storage key (path/filename)
  url: string;          // full public URL
  size: number;         // file size in bytes
  mimetype: string;     // processed mimetype
  width: number;
  height: number;
}

export interface StorageAdapter {
  upload(file: UploadFile, directory: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
```

## Step 2.3: Create Image Processing Utility

**New file:** `src/backend/src/lib/storage/imageProcessor.ts`

```typescript
import sharp from 'sharp';
import type { ProcessedImage } from './types';

// Target sizes for product images.
// Generates multiple variants; the largest is stored as primary.
export const IMAGE_SIZES = {
  thumbnail: { width: 200, height: 200 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
} as const;

export type ImageSizeKey = keyof typeof IMAGE_SIZES;

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateImage(mimetype: string, size: number): void {
  if (!ALLOWED_MIMETYPES.includes(mimetype)) {
    throw new Error(`Unsupported file type: ${mimetype}. Allowed: JPEG, PNG, WebP, AVIF.`);
  }
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${size} bytes. Maximum: ${MAX_FILE_SIZE} bytes (10MB).`);
  }
}

/**
 * Process an image: resize to fit within target dimensions, convert to WebP.
 * WebP provides ~30% smaller files than JPEG at equivalent quality.
 */
export async function processImage(
  buffer: Buffer,
  sizeKey: ImageSizeKey,
): Promise<ProcessedImage> {
  const { width, height } = IMAGE_SIZES[sizeKey];

  const processed = await sharp(buffer)
    .resize(width, height, {
      fit: 'cover',       // crop to fill dimensions exactly
      position: 'center',
      withoutEnlargement: true,  // don't upscale small images
    })
    .webp({ quality: 82 })  // 82 is visually lossless for most photos
    .toBuffer({ resolveWithBuffer: true });

  const metadata = await sharp(processed).metadata();

  return {
    buffer: processed,
    width: metadata.width ?? width,
    height: metadata.height ?? height,
    format: 'webp',
  };
}

/**
 * Generate a content-based filename.
 * Uses a hash of the buffer + timestamp to prevent collisions and duplicates.
 */
export function generateImageKey(buffer: Buffer, sizeKey: ImageSizeKey): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  return `products/${hash}-${sizeKey}.webp`;
}
```

## Step 2.4: Create Local Storage Adapter

**New file:** `src/backend/src/lib/storage/localAdapter.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';
import type { StorageAdapter, UploadFile, UploadResult } from './types';
import { processImage, generateImageKey, validateImage, IMAGE_SIZES } from './imageProcessor';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const PUBLIC_BASE_URL = process.env.UPLOAD_BASE_URL || '/uploads';

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor(uploadDir: string = UPLOAD_DIR) {
    this.uploadDir = uploadDir;
  }

  async ensureDir(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async upload(file: UploadFile, directory: string = 'products'): Promise<UploadResult> {
    validateImage(file.mimetype, file.size);
    await this.ensureDir();

    // Process the "large" variant as the primary stored image.
    const processed = await processImage(file.buffer, 'large');
    const key = generateImageKey(processed.buffer, 'large');
    const fullPath = path.join(this.uploadDir, key);

    // Create subdirectories if needed
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, processed.buffer);

    return {
      key,
      url: `${PUBLIC_BASE_URL}/${key}`,
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
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
      // File already gone — not an error
    }
  }

  getUrl(key: string): string {
    return `${PUBLIC_BASE_URL}/${key}`;
  }
}
```

## Step 2.5: Create Storage Factory

**New file:** `src/backend/src/lib/storage/index.ts`

```typescript
import type { StorageAdapter } from './types';
import { LocalStorageAdapter } from './localAdapter';

// Singleton — instantiated once at startup.
let storageInstance: StorageAdapter | null = null;

/**
 * Returns the active storage adapter.
 *
 * STORAGE_PROVIDER=local  → LocalStorageAdapter (default)
 * STORAGE_PROVIDER=s3     → S3StorageAdapter (Phase 3, not yet implemented)
 *
 * To add S3 support later, create s3Adapter.ts implementing StorageAdapter,
 * then add it here. No calling code changes needed.
 */
export function getStorage(): StorageAdapter {
  if (storageInstance) return storageInstance;

  const provider = process.env.STORAGE_PROVIDER || 'local';

  switch (provider) {
    case 'local':
      storageInstance = new LocalStorageAdapter();
      break;
    // case 's3':
    //   storageInstance = new S3StorageAdapter();
    //   break;
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${provider}`);
  }

  return storageInstance;
}

export type { StorageAdapter, UploadFile, UploadResult } from './types';
```

## Step 2.6: Create Multer Upload Middleware

**New file:** `src/backend/src/middleware/upload.ts`

```typescript
import multer from 'multer';

// Use memory storage — we process with Sharp before saving to disk.
// This avoids writing raw uploads to disk; only processed images are stored.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, AVIF.`));
    }
  },
});

// Accept up to 8 images per product upload
export const uploadProductImages = upload.array('images', 8);
```

## Step 2.7: Create Upload API Route

**New file:** `src/backend/src/api/admin/uploads.ts`

```typescript
import { Request, Response, Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { uploadProductImages } from '../../middleware/upload';
import { getStorage } from '../../lib/storage';
import { logger } from '../../lib/logger';

const router = Router();

// All upload routes require admin auth
router.use(adminAuth);

/**
 * POST /api/admin/uploads/product-images
 * Accepts multipart/form-data with field name "images" (up to 8 files).
 * Returns array of uploaded image URLs.
 */
router.post('/product-images', uploadProductImages, async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  try {
    const storage = getStorage();
    const results = [];

    for (const file of files) {
      const uploadFile = {
        buffer: file.buffer,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };

      const result = await storage.upload(uploadFile, 'products');
      results.push({
        url: result.url,
        key: result.key,
        width: result.width,
        height: result.height,
        size: result.size,
      });
    }

    logger.info('Product images uploaded', { count: results.length });

    return res.status(201).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Image upload failed', { requestId, error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/uploads/product-images
 * Body: { key: string }
 * Deletes a single uploaded image.
 */
router.delete('/product-images', async (req: Request, res: Response) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ success: false, message: 'Image key is required' });
  }

  try {
    const storage = getStorage();
    await storage.delete(key);
    return res.json({ success: true, message: 'Image deleted' });
  } catch (error: any) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Image deletion failed', { requestId, error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Image deletion failed',
      error: error.message,
    });
  }
});

export default router;
```

## Step 2.8: Wire Up the Upload Route + Static File Serving

**File:** `src/backend/src/app.ts`

Add these imports near the top (after the other router imports):

```typescript
import uploadsRouter from './api/admin/uploads';
import path from 'path';
```

Add the upload router (after the other admin routes, before the 404 handler):

```typescript
app.use('/api/admin/uploads', apiLimiter, uploadsRouter);
```

Add static file serving for local uploads (after the routes, before the 404 handler):

```typescript
// Serve uploaded files (local storage mode).
// When S3 is enabled, this is not needed — files are served from CDN.
import express from 'express';
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '1y',  // long cache — filenames are content-hashed
  immutable: true,
}));
```

## Step 2.9: Add Environment Variables

**File:** `src/backend/.env.example` — append:

```env
# Image Storage
# STORAGE_PROVIDER: 'local' (default) or 's3' (when AWS is set up)
STORAGE_PROVIDER=local
# UPLOAD_BASE_URL: URL prefix for serving uploaded files.
# Local dev: /uploads. Production with nginx: /uploads. With S3+CloudFront: https://cdn.example.com
UPLOAD_BASE_URL=/uploads

# When S3 is ready (Phase 3), add these:
# STORAGE_PROVIDER=s3
# AWS_S3_BUCKET=welbeing-images
# AWS_S3_REGION=ap-southeast-2
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_CLOUDFRONT_URL=https://cdn.example.com
```

**File:** `src/backend/.env` — add the same keys (local values).

**File:** `.gitignore` — add:

```
uploads/
```

## Step 2.10: Write Tests

**New file:** `src/backend/tests/unit/storage.test.ts`

```typescript
import { validateImage } from '../../src/lib/storage/imageProcessor';

describe('Image validation', () => {
  it('accepts valid image types', () => {
    expect(() => validateImage('image/jpeg', 1024)).not.toThrow();
    expect(() => validateImage('image/png', 1024)).not.toThrow();
    expect(() => validateImage('image/webp', 1024)).not.toThrow();
  });

  it('rejects invalid types', () => {
    expect(() => validateImage('application/pdf', 1024)).toThrow();
    expect(() => validateImage('image/gif', 1024)).toThrow();
  });

  it('rejects files over 10MB', () => {
    const tenMB = 10 * 1024 * 1024;
    expect(() => validateImage('image/jpeg', tenMB + 1)).toThrow();
  });
});
```

**Acceptance criteria:**
- [ ] `npm run build --workspace=@welbeing/backend` succeeds
- [ ] `POST /api/admin/uploads/product-images` accepts multipart files and returns URLs
- [ ] Uploaded images are saved to `uploads/products/` as `.webp` files
- [ ] Invalid file types are rejected with a clear error message
- [ ] Files over 10MB are rejected
- [ ] `uploads/` is in `.gitignore`
- [ ] `GET /uploads/products/{hash}-large.webp` serves the uploaded image

---

# Phase 3: Image Upload — Frontend (Admin ProductForm)

## Goal

Replace the "Image URLs (one per line)" textarea in the admin ProductForm with a proper drag-and-drop image uploader. Show image previews. Allow reordering and deletion.

## Step 3.1: Create Image Upload Component

**New file:** `src/frontend/src/components/admin/ImageUploader.tsx`

```tsx
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export interface UploadedImage {
  url: string;
  key: string;
  width?: number;
  height?: number;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 8,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    const toUpload = Array.from(files).slice(0, remaining);

    if (toUpload.length === 0) {
      setUploadError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    toUpload.forEach((file) => formData.append('images', file));

    try {
      const response = await fetch(`${API_BASE_URL}/admin/uploads/product-images`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        // Do NOT set Content-Type — browser sets it with boundary for FormData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Upload failed');
      }

      const result = await response.json();
      const newImages: UploadedImage[] = result.data.map((item: any) => ({
        url: item.url,
        key: item.key,
        width: item.width,
        height: item.height,
      }));

      onChange([...images, ...newImages]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [images, onChange, maxImages]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    // Note: actual file deletion from storage should be called via DELETE endpoint
    // if the product is being saved. For unsaved uploads, schedule cleanup.
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Drag-drop zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-primary-500 bg-primary-50 scale-[1.02]'
              : 'border-border-default hover:border-primary-300 hover:bg-surface-alt'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
              <span className="text-sm text-text-secondary">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-text-muted" />
              <span className="text-sm font-medium text-text-primary">
                Drag & drop images here, or click to browse
              </span>
              <span className="text-xs text-text-muted">
                JPEG, PNG, WebP · Max 10MB each · Up to {maxImages} images
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-danger-600 bg-danger-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.url}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border-default bg-surface-alt"
            >
              <img
                src={image.url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 bg-danger-600 text-white rounded-full p-1
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-1 right-1 bg-surface-dark text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !isUploading && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <ImageIcon className="w-4 h-4" />
          No images uploaded yet
        </div>
      )}
    </div>
  );
};
```

## Step 3.2: Update ProductForm to Use ImageUploader

**File:** `src/frontend/src/components/admin/ProductForm.tsx`

Replace the `imageUrls` textarea state and UI.

**Change the state type:**

Add import at top:
```typescript
import { ImageUploader, type UploadedImage } from './ImageUploader';
```

Change the formData state:
```typescript
// OLD:
imageUrls: '',

// NEW:
uploadedImages: [] as UploadedImage[],
```

In the `useEffect` that loads `initialData`:
```typescript
// OLD:
imageUrls: initialData.images?.map(i => i.url).join('\n') || '',

// NEW:
uploadedImages: (initialData.images || []).map(img => ({
  url: img.url,
  key: img.url.split('/').pop() || '',  // extract key from URL
})),
```

In `handleSubmit`, change the payload:
```typescript
// OLD:
imageUrls: formData.imageUrls.split('\n').map(u => u.trim()).filter(u => u),

// NEW:
imageUrls: formData.uploadedImages.map(img => img.url),
```

**Replace the Image URLs textarea with the ImageUploader:**

Remove this block:
```tsx
<div>
    <label className="block text-sm font-medium text-text-primary">Image URLs (one per line)</label>
    <textarea rows={4} className="mt-1 block w-full rounded-md border-border-default shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 font-mono text-xs"
        placeholder="https://example.com/image1.jpg"
        value={formData.imageUrls} onChange={e => setFormData({...formData, imageUrls: e.target.value})}
    />
</div>
```

Replace with:
```tsx
<div>
    <label className="block text-sm font-medium text-text-primary mb-2">Product Images</label>
    <ImageUploader
        images={formData.uploadedImages}
        onChange={(images) => setFormData(prev => ({ ...prev, uploadedImages: images }))}
        maxImages={8}
    />
</div>
```

## Step 3.3: Update Body Size Limit in Express

**File:** `src/backend/src/app.ts`

Multer handles the multipart parsing, but Express's `express.json()` has a default 100KB body limit. Add explicit limit:

```typescript
// Find this line:
app.use(express.json());

// Change to:
app.use(express.json({ limit: '15mb' }));
```

## Step 3.4: Update Swagger Documentation

Add the upload endpoint to the OpenAPI spec or `SWAGGER_IMPLEMENTATION.md`.

## Step 3.5: Test the Full Flow

1. Start the backend: `npm run dev --workspace=@welbeing/backend`
2. Start the frontend: `npm run dev --workspace=@welbeing/frontend`
3. Log in as admin (MFA required)
4. Navigate to Admin → Products → Create New
5. Upload 2-3 images via drag-and-drop
6. Verify previews appear with thumbnails
7. Fill in product details and save
8. Navigate to the product on the storefront — images should display

**Acceptance criteria:**
- [ ] Drag-and-drop upload works in ProductForm
- [ ] Click-to-browse upload works
- [ ] Image previews show in a grid with remove buttons
- [ ] First image is labeled "Main"
- [ ] Saved product displays uploaded images on the storefront
- [ ] Invalid file types show an error message
- [ ] Files over 10MB are rejected client-side and server-side
- [ ] `npm run build` succeeds for both workspaces
- [ ] All tests pass

---

# Phase 4: Cart Persistence

## Goal

Cart survives page refresh and browser restart by syncing to `localStorage`.

## Step 4.1: Update CartContext

**File:** `src/frontend/src/context/CartContext.tsx`

Replace the `useState` initialization and add persistence:

```typescript
const CART_STORAGE_KEY = 'welbeing_cart';

// Load initial state from localStorage
const loadCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to persist cart', err);
    }
  }, [items]);

  // ... rest of the existing addItem, removeItem, updateQuantity, clearCart logic stays the same
```

Add `useEffect` to the imports:
```typescript
import React, { createContext, useEffect, useMemo, useState } from 'react';
```

**Acceptance criteria:**
- [ ] Add items to cart, refresh page → cart persists
- [ ] Remove items → cart updates and persists
- [ ] Clear cart → localStorage entry removed
- [ ] Cart works for both guest and authenticated users
- [ ] All frontend tests pass

---

# Phase 5: Email Service (Resend)

## Goal

Replace the console-logging email stubs with real email sending via Resend (simplest API, generous free tier — 3,000 emails/month free).

## Step 5.1: Install Resend

```bash
cd src/backend
npm install resend
```

## Step 5.2: Create Email Service

**Replace file:** `src/backend/src/lib/email.ts`

```typescript
import { Resend } from 'resend';
import { logger } from './logger';

// Only initialize Resend if API key is present.
// Falls back to logging if not configured (useful for dev/testing).
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    logger.info('Email not sent (no RESEND_API_KEY)', { to, subject });
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    logger.info('Email sent', { to, subject });
  } catch (error) {
    logger.error('Email send failed', { to, subject, error });
    // Don't throw — email failure shouldn't break the user flow.
    // The calling code should still proceed (e.g., password reset token still works).
  }
}

export const emailService = {
  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    await send(
      email,
      'Verify Your Email — Welbeing',
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Welbeing!</h2>
        <p>Please verify your email address to activate your account:</p>
        <a href="${verificationUrl}"
           style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          If the button doesn't work, copy this link: ${verificationUrl}
        </p>
      </div>
      `,
    );
  },

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await send(
      email,
      'Reset Your Password — Welbeing',
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click below to set a new password:</p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
      `,
    );
  },

  async sendOrderConfirmation(email: string, orderId: number) {
    await send(
      email,
      `Order Confirmation #${orderId} — Welbeing`,
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for your order!</h2>
        <p>Your order <strong>#${orderId}</strong> has been received and is being processed.</p>
        <p>We'll send you an update when your items ship.</p>
      </div>
      `,
    );
  },

  async sendOrderStatusUpdate(email: string, orderId: number, status: string) {
    await send(
      email,
      `Order #${orderId} — ${status} — Welbeing`,
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Update</h2>
        <p>Your order <strong>#${orderId}</strong> status has been updated to: <strong>${status}</strong></p>
      </div>
      `,
    );
  },
};
```

## Step 5.3: Add Environment Variables

**File:** `src/backend/.env.example` — append:

```env
# Email
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@welbeing.com
FRONTEND_URL=http://localhost:5173
```

**Acceptance criteria:**
- [ ] Without `RESEND_API_KEY`, emails log to console (backward compatible)
- [ ] With `RESEND_API_KEY`, real emails are sent
- [ ] Verification email contains a working link
- [ ] Password reset email contains a working link
- [ ] Order confirmation email is sent after checkout
- [ ] All backend tests pass

---

# Phase 6: Tax Calculation (GST)

## Goal

Calculate 10% GST for Australian orders. For international orders, apply $0 tax (no tax collection obligation until thresholds are met).

## Step 6.1: Create Tax Service

**New file:** `src/backend/src/services/taxService.ts`

```typescript
/**
 * Calculate tax for an order based on shipping destination.
 *
 * Australian GST: 10% on taxable supplies shipped to Australian addresses.
 * International: $0 (no collection obligation until country-specific thresholds met).
 *
 * This is a simplified implementation. For production with complex rules,
 * integrate a tax service like TaxJar or Avalara.
 */

const AU_GST_RATE = 0.10; // 10%

export interface TaxResult {
  rate: number;
  amount: number;       // tax amount in dollars
  taxableAmount: number; // amount tax was calculated on
  jurisdiction: string;
}

export function calculateTax(
  subtotal: number,
  country: string,
): TaxResult {
  const normalizedCountry = country.trim().toLowerCase();

  if (normalizedCountry === 'australia' || normalizedCountry === 'au') {
    return {
      rate: AU_GST_RATE,
      amount: Math.round(subtotal * AU_GST_RATE * 100) / 100,
      taxableAmount: subtotal,
      jurisdiction: 'AU-GST',
    };
  }

  // No tax for other countries (simplified)
  return {
    rate: 0,
    amount: 0,
    taxableAmount: subtotal,
    jurisdiction: 'NONE',
  };
}
```

## Step 6.2: Integrate into Order Service

**File:** `src/backend/src/services/orderService.ts`

After the `totalPrice` calculation (around line 236), add:

```typescript
import { calculateTax } from './taxService';

// ... inside createOrderFromPayload, after totalPrice is calculated:

// Calculate tax based on shipping address country
const shippingCountry = normalizedAddress?.country || shippingAddress?.country || 'Australia';
const taxResult = calculateTax(totalPrice.toNumber(), shippingCountry);
```

Then when creating the order, update the data:

```typescript
// Find the order creation block and update:
const order = await tx.order.create({
  data: {
    userId,
    guestEmail,
    addressId: resolvedAddressId,
    status: OrderStatus.PENDING,
    paymentStatus: OrderPaymentStatus.PENDING,
    totalPrice: totalPrice.plus(taxResult.amount),  // total INCLUDES tax
    taxAmount: taxResult.amount,
    shippingFee: new Prisma.Decimal(0),  // TODO: Phase 7 shipping rates
    // ...
  },
});
```

## Step 6.3: Update Checkout Page to Show Tax

**File:** `src/frontend/src/pages/Checkout.tsx`

In the order summary section, add a tax line after subtotal:

```tsx
<div className="flex justify-between text-sm text-text-secondary">
  <span>Subtotal</span>
  <span>${subtotal.toFixed(2)}</span>
</div>
<div className="flex justify-between text-sm text-text-secondary">
  <span>GST (10%)</span>
  <span>${(subtotal * 0.10).toFixed(2)}</span>
</div>
<div className="flex justify-between text-sm text-text-secondary">
  <span>Shipping</span>
  <span>Calculated at next step</span>
</div>
<div className="flex justify-between text-lg font-semibold text-text-primary border-t border-border-default pt-3 mt-3">
  <span>Total</span>
  <span>${(subtotal * 1.10).toFixed(2)}</span>
</div>
```

**Acceptance criteria:**
- [ ] Australian orders include 10% GST
- [ ] International orders have $0 tax
- [ ] Order total includes tax
- [ ] Checkout page shows tax breakdown
- [ ] Tax amount stored in `order.taxAmount` field

---

# Phase 7: Reviews System

## Goal

The `Review` model exists in the Prisma schema. Build the API endpoints and UI for users to rate and review products.

## Step 7.1: Create Review Routes

**New file:** `src/backend/src/api/reviews.ts`

Implement:
- `GET /api/products/:id/reviews` — public, returns reviews for a product with pagination
- `POST /api/products/:id/reviews` — authenticated, creates a review (rating 1-5, optional comment)
- `PUT /api/reviews/:id` — authenticated, owner only, updates own review
- `DELETE /api/reviews/:id` — authenticated, owner or admin, deletes review

Follow the existing pattern: thin controller → service → Prisma. Use Zod for validation (rating must be integer 1-5).

## Step 7.2: Add Review UI to ProductDetail

**File:** `src/frontend/src/pages/ProductDetail.tsx`

Add below the product info:
- Average rating display (stars)
- List of existing reviews with author name, date, rating, comment
- Review submission form (authenticated users only)
- "Write a Review" button that toggles the form

## Step 7.3: Add Review Moderation to Admin

Add a reviews tab or section in the admin dashboard for flagging/removing inappropriate reviews.

**Acceptance criteria:**
- [ ] Authenticated users can submit reviews (1-5 stars + optional comment)
- [ ] Reviews display on product detail page
- [ ] Users can edit/delete their own reviews
- [ ] Admins can delete any review
- [ ] Guest users can see reviews but not submit them
- [ ] Rating average is displayed

---

# Phase 8: React Error Boundaries + Code Splitting

## Step 8.1: Create Error Boundary

**New file:** `src/frontend/src/components/ErrorBoundary.tsx`

Create a class component ErrorBoundary that catches render errors and shows a fallback UI.

Wrap the routes in `App.tsx` with `<ErrorBoundary>`.

## Step 8.2: Lazy Load Admin Routes

**File:** `src/frontend/src/App.tsx`

Replace direct imports of admin pages with `React.lazy()`:

```typescript
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProducts = React.lazy(() => import('./pages/admin/Products').then(m => ({ default: m.AdminProducts })));
// ... etc for all admin pages
```

Wrap admin routes in `<Suspense fallback={<PageLoader />}>`.

**Acceptance criteria:**
- [ ] Component errors show a fallback UI, not a white screen
- [ ] Admin pages load in separate chunks (check Network tab)
- [ ] Storefront pages load without admin code

---

# Phase 9: Stripe Payment Integration (FINAL PHASE)

> **Do NOT start this phase until all other phases are complete and the site is otherwise production-ready.**

## Goal

Replace the mock payment service with real Stripe payment processing.

## Architecture

```
┌─────────────┐     1. Checkout      ┌──────────────┐
│   Frontend   │ ──────────────────→ │   Backend     │
│  (React)     │                     │  (Express)    │
│              │  2. PaymentIntent   │               │
│              │ ←────────────────── │               │
│              │                     │               │
│              │  3. Confirm with    │               │
│              │     Stripe.js       │               │
│              │ ──────────────────→ │   Stripe API  │
│              │                     │ ────────────→ │
│              │  4. Webhook         │               │
│              │ ←────────────────── │ ←──────────── │
│              │     confirmation    │               │
└─────────────┘                     └──────────────┘
```

## Step 9.1: Install Stripe

```bash
cd src/backend && npm install stripe
cd ../frontend && npm install @stripe/stripe-js @stripe/react-stripe-js
```

## Step 9.2: Replace Payment Service

**File:** `src/backend/src/services/paymentService.ts`

Implement real Stripe PaymentIntent flow:
1. `createPaymentIntent(amount, currency)` — creates a PaymentIntent via Stripe API
2. `confirmPayment(paymentIntentId)` — confirms payment succeeded
3. Handle Stripe webhooks for async payment events

## Step 9.3: Add Stripe Webhook Endpoint

**New file:** `src/backend/src/api/webhooks/stripe.ts`

- `POST /api/webhooks/stripe` — receives Stripe webhooks
- Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
- Handle `payment_intent.succeeded`, `payment_intent.payment_failed`
- Update order payment status accordingly
- This endpoint must be registered BEFORE `express.json()` middleware (Stripe needs raw body)

## Step 9.4: Frontend Stripe Elements

**File:** `src/frontend/src/pages/Checkout.tsx`

Replace the payment placeholder input with Stripe Elements (PaymentElement). On submit, call `stripe.confirmPayment()`.

## Step 9.5: Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Acceptance criteria:**
- [ ] Test mode: real test cards work (4242 4242 4242 4242)
- [ ] Failed payments create orders with `FAILED` payment status
- [ ] Webhook correctly updates order status
- [ ] Stripe dashboard shows test transactions
- [ ] Switching to live keys (`sk_live_`) requires only env change, no code change

---

# Phase Summary

| Phase | Feature | Priority | Dependencies |
|-------|---------|----------|-------------|
| 1 | Centralized Theme System | **FIRST** | None |
| 2 | Image Upload Backend | **HIGH** | None |
| 3 | Image Upload Frontend | **HIGH** | Phase 2 |
| 4 | Cart Persistence | **HIGH** | None |
| 5 | Email Service (Resend) | **HIGH** | None |
| 6 | Tax Calculation (GST) | **HIGH** | None |
| 7 | Reviews System | MEDIUM | None |
| 8 | Error Boundaries + Code Splitting | MEDIUM | None |
| 9 | Stripe Payment | **LAST** | All other phases |

**Recommended execution order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

---

# Appendix A: How to Change Brand Colors (For Fahim)

After Phase 1 is complete, to re-skin the entire site:

1. Open `src/frontend/src/index.css`
2. Find the `@theme` block
3. Change the `--color-primary-*` values to your new brand color palette
4. Change the `--color-secondary-*` values for accent colors
5. Save. The entire site updates instantly.

**To generate a color palette from a single hex color:**
Use https://uicolors.app/create — paste your hex color, it generates all 50-900 shades. Copy those values into the CSS variables.

---

# Appendix B: How to Switch from Local Storage to S3 (For Fahim)

After Phase 2 is complete, switching to AWS S3 requires:

1. Install the AWS SDK: `cd src/backend && npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. Create `src/backend/src/lib/storage/s3Adapter.ts` implementing the `StorageAdapter` interface (use the exact same `upload`, `delete`, `getUrl` signatures as `LocalStorageAdapter`)
3. Uncomment the S3 case in `src/backend/src/lib/storage/index.ts`
4. Set environment variables:
   ```env
   STORAGE_PROVIDER=s3
   AWS_S3_BUCKET=welbeing-images
   AWS_S3_REGION=ap-southeast-2
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_CLOUDFRONT_URL=https://cdn.example.com
   ```
5. Restart the backend. All uploads now go to S3. No frontend changes needed.

**No other code changes required** — the storage abstraction handles everything.

---

*This document is the complete specification. Hand it to Turing as-is. Each phase is self-contained and can be implemented independently (except 3 depends on 2, and 9 depends on all others).*
