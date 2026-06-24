import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUploader } from '../ImageUploader';

const uploadedImage = {
  key: 'products/demo-large.webp',
  url: '/uploads/products/demo-large.webp',
  size: 1234,
  mimetype: 'image/webp',
  width: 600,
  height: 600,
};

describe('ImageUploader', () => {
  it('uploads a selected image and reports the uploaded URL', async () => {
    const uploadImage = vi.fn().mockResolvedValue(uploadedImage);
    const onUploaded = vi.fn();

    render(<ImageUploader uploadImage={uploadImage} onUploaded={onUploaded} />);

    const file = new File(['image-bytes'], 'product.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Upload product image'), {
      target: { files: [file] },
    });

    await waitFor(() => expect(uploadImage).toHaveBeenCalledWith(file));
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(uploadedImage));
    expect(screen.getByText('Uploaded successfully')).toBeInTheDocument();
    expect(screen.getByText(uploadedImage.url)).toBeInTheDocument();
  });

  it('shows an error when upload fails', async () => {
    const uploadImage = vi.fn().mockRejectedValue(new Error('Upload rejected'));

    render(<ImageUploader uploadImage={uploadImage} onUploaded={vi.fn()} />);

    const file = new File(['image-bytes'], 'product.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Upload product image'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Upload rejected');
  });
});
