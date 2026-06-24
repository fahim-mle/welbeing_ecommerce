import type { StorageAdapter } from './types';
import { LocalStorageAdapter } from './localAdapter';

let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (storageInstance) {
    return storageInstance;
  }

  const provider = process.env.STORAGE_PROVIDER || 'local';
  switch (provider) {
    case 'local':
      storageInstance = new LocalStorageAdapter();
      return storageInstance;
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${provider}`);
  }
}

export function resetStorageForTests(): void {
  storageInstance = null;
}

export type { StorageAdapter, UploadFile, UploadResult } from './types';
