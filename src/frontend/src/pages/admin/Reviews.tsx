import React, { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { deleteAdminReview, fetchAdminReviews } from '../../api/admin';
import type { Review } from '../../api/reviews';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((value) => (
      <Star
        key={value}
        className={`h-4 w-4 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-border-default'}`}
      />
    ))}
  </div>
);

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminReviews();
      setReviews(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleDelete = async (review: Review) => {
    if (!window.confirm('Delete this customer review? This cannot be undone.')) return;
    setDeletingId(review.id);
    setError(null);
    try {
      await deleteAdminReview(review.id);
      setReviews((current) => current.filter((item) => item.id !== review.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Reviews</h2>
        <p className="text-sm text-text-secondary">Moderate customer product reviews.</p>
      </div>

      {error && <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>}

      <div className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-text-secondary">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-6 text-sm text-text-secondary">No reviews submitted yet.</div>
        ) : (
          <div className="divide-y divide-border-default">
            {reviews.map((review) => (
              <article key={review.id} className="p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-semibold text-text-primary">
                      {review.product?.name ?? `Product #${review.productId}`}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    By {review.user.firstName} {review.user.lastName} • {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  {review.comment && <p className="max-w-3xl text-sm leading-relaxed text-text-primary">{review.comment}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(review)}
                  disabled={deletingId === review.id}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-danger-200 px-4 py-2 text-sm font-semibold text-danger-700 hover:bg-danger-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === review.id ? 'Deleting...' : 'Delete'}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
