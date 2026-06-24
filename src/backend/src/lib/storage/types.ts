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
  key: string;
  url: string;
  size: number;
  mimetype: string;
  width: number;
  height: number;
}

export interface StorageAdapter {
  upload(file: UploadFile, directory?: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
