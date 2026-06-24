import React, { useEffect, useMemo, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import {
  deleteReview,
  fetchProductReviews,
  submitProductReview,
  type Review,
  type ReviewSummary,
} from '../api/reviews';
import { useAuth } from '../hooks/useAuth';

interface ProductReviewsProps {
  productId: number;
}

const emptySummary: ReviewSummary = { averageRating: 0, totalReviews: 0 };

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

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(emptySummary);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserReview = useMemo(
    () => reviews.find((review) => review.userId === user?.id),
    [reviews, user?.id],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProductReviews(productId)
      .then((result) => {
        if (cancelled) return;
        setReviews(result.data);
        setSummary(result.summary);
      })
      .catch(() => {
        if (!cancelled) setError('Reviews are temporarily unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => {
    if (currentUserReview) {
      setRating(currentUserReview.rating);
      setComment(currentUserReview.comment ?? '');
    }
  }, [currentUserReview]);

  const refreshReviews = async () => {
    const result = await fetchProductReviews(productId);
    setReviews(result.data);
    setSummary(result.summary);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitProductReview(productId, { rating, comment });
      await refreshReviews();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOwnReview = async () => {
    if (!currentUserReview) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteReview(currentUserReview.id);
      setComment('');
      setRating(5);
      await refreshReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-border-default pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Customer Reviews</h2>
          <div className="mt-2 flex items-center gap-3 text-sm text-text-secondary">
            <StarRating rating={Math.round(summary.averageRating)} />
            <span>
              {summary.totalReviews > 0
                ? `${summary.averageRating.toFixed(1)} average from ${summary.totalReviews} review${summary.totalReviews === 1 ? '' : 's'}`
                : 'No reviews yet'}
            </span>
          </div>
        </div>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="btn-primary"
          >
            {currentUserReview ? 'Edit Your Review' : 'Write a Review'}
          </button>
        ) : (
          <p className="text-sm text-text-secondary">Sign in to write a review.</p>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>}

      {showForm && isAuthenticated && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-border-default bg-surface p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Rating</label>
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="w-full rounded-lg border border-border-default px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Comment</label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full rounded-lg border border-border-default px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Share what helped, what stood out, or who this product suits."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? 'Saving...' : currentUserReview ? 'Update Review' : 'Submit Review'}
            </button>
            {currentUserReview && (
              <button
                type="button"
                onClick={handleDeleteOwnReview}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg border border-danger-200 px-4 py-2 text-sm font-semibold text-danger-700 hover:bg-danger-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-text-secondary">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-default p-6 text-sm text-text-secondary">
            Be the first customer to review this product.
          </div>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-border-default bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-text-primary">
                    {review.user.firstName} {review.user.lastName}
                  </p>
                  <p className="text-xs text-text-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              {review.comment && <p className="mt-3 text-sm leading-relaxed text-text-secondary">{review.comment}</p>}
            </article>
          ))
        )}
      </div>
    </section>
  );
};
