import React, { useRef, useState } from 'react';
import { uploadProductImage, type UploadedImage } from '../../api/admin';

interface ImageUploaderProps {
  onUploaded: (image: UploadedImage) => void;
  uploadImage?: (file: File) => Promise<UploadedImage>;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploaded,
  uploadImage = uploadProductImage,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<UploadedImage | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await uploadImage(file);
      setLastUpload(uploaded);
      onUploaded(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-border-default bg-surface-alt'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
          aria-label="Upload product image"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <p className="text-sm font-medium text-text-primary">Drag and drop a product image</p>
        <p className="mt-1 text-xs text-text-secondary">PNG, JPEG, WebP, or AVIF up to 10MB. Images are optimized to WebP.</p>
        <button
          type="button"
          className="btn-secondary mt-3"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? 'Uploading...' : 'Choose image'}
        </button>
      </div>

      {lastUpload && (
        <div className="flex items-center gap-3 rounded-lg border border-border-default bg-surface p-3">
          <img src={lastUpload.url} alt="Uploaded product preview" className="h-14 w-14 rounded-md object-cover" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">Uploaded successfully</p>
            <p className="truncate text-xs text-text-secondary">{lastUpload.url}</p>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
    </div>
  );
};
