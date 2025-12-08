import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useToast, useLocale } from "../App";
import {
  fetchBookBySlug,
  fetchAllRatings,
  filterRatingsForBook,
  createAndPublishRating,
  updateAndPublishRating,
  deleteRating,
} from "../services/contentApi";
import ReviewForm from "../components/ReviewForm";
import "./BookDetail.css";

// Format reading time from metadata
// CMS stores either total hours OR total minutes (not hours + additional minutes)
function formatReadingTime(readingTimeMetadata) {
  if (!readingTimeMetadata) return null;

  const hours = parseInt(readingTimeMetadata.estimated_hours) || 0;
  const totalMinutes = parseInt(readingTimeMetadata.estimated_minutes) || 0;

  // If we have hours, use that (e.g., 6 hours)
  if (hours > 0) {
    return {
      display: hours === 1 ? `${hours} hour` : `${hours} hours`,
      hours: hours,
      minutes: 0,
    };
  }

  // If we have minutes, convert to hours + minutes if >= 60
  if (totalMinutes > 0) {
    if (totalMinutes >= 60) {
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return {
        display: mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hours`,
        hours: hrs,
        minutes: mins,
      };
    }
    return {
      display: `${totalMinutes} minutes`,
      hours: 0,
      minutes: totalMinutes,
    };
  }

  return null;
}

function ReadingTimeBadge({ readingTime }) {
  if (!readingTime) return null;

  return (
    <div className="reading-time-badge">
      <div className="reading-time-icon-large">⏱️</div>
      <div className="reading-time-content">
        <span className="reading-time-label">Reading Time</span>
        <span className="reading-time-value">{readingTime.display}</span>
      </div>
    </div>
  );
}

function StarDisplay({ rating }) {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`star ${star <= rating ? "filled" : ""}`}>
          {star <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

// Check if review is flagged or pending moderation
function getModerationStatus(review) {
  if (review.flagged === true) return "flagged";
  if (review.moderation_status === "pending") return "pending";
  if (review.moderation_status === "rejected") return "rejected";
  return "approved";
}

function ModerationBadge({ status, reason }) {
  if (status === "approved") return null;

  const badges = {
    pending: {
      icon: "⏳",
      text: "Pending moderation",
      className: "moderation-pending",
    },
    flagged: {
      icon: "⚠️",
      text: "Under review",
      className: "moderation-flagged",
    },
    rejected: {
      icon: "🚫",
      text: "Content removed",
      className: "moderation-rejected",
    },
  };

  const badge = badges[status] || badges.pending;

  return (
    <div className={`moderation-badge ${badge.className}`}>
      <span className="moderation-icon">{badge.icon}</span>
      <span className="moderation-text">{badge.text}</span>
      {reason && <span className="moderation-reason">({reason})</span>}
    </div>
  );
}

function ReviewCard({ review, onEdit, onDelete, canEdit, locale }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const moderationStatus = getModerationStatus(review);
  const isHidden = moderationStatus === "rejected";
  const isPending = moderationStatus === "pending" || moderationStatus === "flagged";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(locale || "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(review.uid);
    setIsDeleting(false);
  };

  // Don't render rejected reviews
  if (isHidden) {
    return null;
  }

  return (
    <div className={`review-card ${isPending ? "review-pending" : ""}`}>
      {/* Moderation Badge */}
      <ModerationBadge
        status={moderationStatus}
        reason={review.moderation_reason}
      />

      <div className="review-header">
        <div className="review-rating">
          <StarDisplay rating={review.rating_value} />
          <span className="rating-number">{review.rating_value}/5</span>
        </div>
        {canEdit && !isPending && (
          <div className="review-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onEdit(review)}
              aria-label="Edit review"
            >
              ✏️ Edit
            </button>
            {showDeleteConfirm ? (
              <div className="delete-confirm">
                <span>Delete?</span>
                <button
                  className="btn btn-ghost btn-sm danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "..." : "Yes"}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete review"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {review.title && <h4 className="review-title">{review.title}</h4>}

      {/* Show blurred content for pending reviews */}
      {isPending ? (
        <p className="review-comment review-blurred">
          This review is being checked by our moderation team...
        </p>
      ) : (
        review.comment && <p className="review-comment">{review.comment}</p>
      )}

      <div className="review-footer">
        <div className="reviewer-info">
          <span className="reviewer-avatar">
            {review.reviewer_name?.charAt(0).toUpperCase() || "A"}
          </span>
          <div className="reviewer-details">
            <span className="reviewer-name">
              {review.reviewer_name || "Anonymous"}
            </span>
            {(review.created_at || review.updated_at) && (
              <span className="review-date">
                {formatDate(review.updated_at || review.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="book-detail-loading">
      <div
        className="skeleton"
        style={{ height: "60px", width: "60%", marginBottom: "16px" }}
      />
      <div
        className="skeleton"
        style={{ height: "24px", width: "40%", marginBottom: "24px" }}
      />
      <div
        className="skeleton"
        style={{ height: "200px", marginBottom: "32px" }}
      />
      <div className="skeleton" style={{ height: "150px" }} />
    </div>
  );
}

function BookDetail() {
  const { slug } = useParams();
  const { addToast } = useToast();
  const { locale } = useLocale();

  const [book, setBook] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loadingBook, setLoadingBook] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [error, setError] = useState(null);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // Load book data when slug or locale changes
  useEffect(() => {
    async function loadBook() {
      setLoadingBook(true);
      setError(null);
      try {
        const data = await fetchBookBySlug(slug, locale);
        if (!data) {
          setError("Book not found");
        } else {
          setBook(data);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load book. Please try again.");
      } finally {
        setLoadingBook(false);
      }
    }

    loadBook();
  }, [slug, locale]);

  // Function to load/reload ratings
  const loadRatings = useCallback(async () => {
    setLoadingRatings(true);
    try {
      const all = await fetchAllRatings(locale);
      setRatings(all);
    } catch (err) {
      console.error(err);
      addToast("Failed to load reviews", "error");
    } finally {
      setLoadingRatings(false);
    }
  }, [addToast, locale]);

  // Load ratings when locale changes
  useEffect(() => {
    loadRatings();
  }, [loadRatings]);

  // Filter ratings for this book
  const bookRatings = useMemo(() => {
    if (!book) return [];
    return filterRatingsForBook(ratings, book.uid);
  }, [ratings, book]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (!bookRatings.length) return null;
    const sum = bookRatings.reduce((acc, r) => acc + (r.rating_value || 0), 0);
    return (sum / bookRatings.length).toFixed(1);
  }, [bookRatings]);

  // Handle submit review (create or update in CMS)
  const handleSubmitReview = useCallback(
    async (reviewData) => {
      try {
        const dataToSend = {
          title: reviewData.title,
          book: [{ uid: book.uid, _content_type_uid: "book" }],
          rating_value: reviewData.rating_value,
          comment: reviewData.comment,
          reviewer_name: reviewData.reviewer_name,
          reviewer_email: reviewData.reviewer_email,
          tags: [],
        };

        if (editingReview?.uid) {
          // Update existing review
          await updateAndPublishRating(editingReview.uid, dataToSend, locale);
          addToast("Review updated successfully!", "success");
        } else {
          // Create new review
          await createAndPublishRating(dataToSend, locale);
          addToast("Review submitted successfully!", "success");
        }

        // Refresh ratings after a short delay to allow CMS to process
        setTimeout(() => {
          loadRatings();
        }, 1500);

        setShowReviewForm(false);
        setEditingReview(null);
      } catch (err) {
        console.error(err);
        addToast(
          err.message || "Failed to submit review. Please try again.",
          "error"
        );
      }
    },
    [book?.uid, editingReview, addToast, loadRatings, locale]
  );

  // Handle edit review
  const handleEditReview = useCallback((review) => {
    setEditingReview(review);
    setShowReviewForm(true);
    setTimeout(() => {
      document.querySelector(".review-form-container")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, []);

  // Handle delete review (delete from CMS)
  const handleDeleteReview = useCallback(
    async (reviewUid) => {
      try {
        await deleteRating(reviewUid, locale);
        addToast("Review deleted successfully!", "success");

        // Refresh ratings
        setTimeout(() => {
          loadRatings();
        }, 1000);
      } catch (err) {
        console.error(err);
        addToast(err.message || "Failed to delete review", "error");
      }
    },
    [addToast, loadRatings, locale]
  );

  const handleCancelForm = useCallback(() => {
    setShowReviewForm(false);
    setEditingReview(null);
  }, []);

  if (loadingBook) return <LoadingState />;

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">📖</div>
        <h2>Oops!</h2>
        <p>{error}</p>
        <a href="/books" className="btn btn-primary">
          Back to Books
        </a>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="book-detail-page">
      {/* Book Info Section */}
      <section className="book-info-section">
        <div className="book-info-grid">
          {/* Book Cover */}
          <div className="book-cover-container">
            {book.cover_image?.url ? (
              <img
                src={book.cover_image.url}
                alt={book.title}
                className="book-cover-large"
              />
            ) : (
              <div className="book-cover-placeholder-large">
                <span className="placeholder-icon">📖</span>
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="book-details">
            <div className="book-meta-tags">
              {book.genre?.map((g, i) => (
                <span key={i} className="tag">
                  {g}
                </span>
              ))}
              {book.featured && (
                <span className="tag featured-tag">⭐ Featured</span>
              )}
            </div>

            <h1 className="book-title-large">{book.title}</h1>

            {book.author && (
              <p className="book-author-large">by {book.author}</p>
            )}

            {/* Book Meta Info */}
            <div className="book-meta-info">
              {book.publication_year && (
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span className="meta-text">
                    Published {book.publication_year}
                  </span>
                </div>
              )}
              {book.reading_time_metadata && (
                <div className="meta-item reading-time-highlight">
                  <span className="meta-icon">⏱️</span>
                  <span className="meta-text">
                    {formatReadingTime(book.reading_time_metadata)?.display}{" "}
                    read
                  </span>
                </div>
              )}
            </div>

            {/* Rating Summary */}
            <div className="rating-summary">
              {averageRating ? (
                <>
                  <div className="rating-big">
                    <span className="rating-number-big">{averageRating}</span>
                    <span className="rating-max">/5</span>
                  </div>
                  <div className="rating-details">
                    <StarDisplay rating={Math.round(averageRating)} />
                    <span className="review-count">
                      {bookRatings.length} review
                      {bookRatings.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              ) : (
                <p className="no-ratings">No reviews yet. Be the first!</p>
              )}
            </div>

            {/* Description */}
            {book.description && (
              <div className="book-description">
                <h3>About this book</h3>
                <p>{book.description}</p>
              </div>
            )}

            {/* Write Review Button */}
            {!showReviewForm && (
              <button
                className="btn btn-primary write-review-btn"
                onClick={() => setShowReviewForm(true)}
              >
                <span>✍️</span>
                Write a Review
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Review Form */}
      {showReviewForm && (
        <section className="review-form-section">
          <ReviewForm
            bookId={book.uid}
            bookTitle={book.title}
            onSubmit={handleSubmitReview}
            onCancel={handleCancelForm}
            editingReview={editingReview}
          />
        </section>
      )}

      {/* Reviews Section */}
      <section className="reviews-section">
        <div className="section-header">
          <h2>Reviews</h2>
          {!showReviewForm && bookRatings.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowReviewForm(true)}
            >
              <span>+</span> Add Review
            </button>
          )}
        </div>

        {loadingRatings && (
          <div className="reviews-loading">
            <div className="loading-spinner" />
            <p>Loading reviews...</p>
          </div>
        )}

        {!loadingRatings && bookRatings.length === 0 && (
          <div className="empty-reviews">
            <div className="empty-icon">💬</div>
            <h3>No reviews yet</h3>
            <p>Share your thoughts and be the first to review this book!</p>
            {!showReviewForm && (
              <button
                className="btn btn-primary"
                onClick={() => setShowReviewForm(true)}
              >
                Write the First Review
              </button>
            )}
          </div>
        )}

        {!loadingRatings && bookRatings.length > 0 && (
          <div className="reviews-list">
            {bookRatings.map((review) => (
              <ReviewCard
                key={review.uid}
                review={review}
                canEdit={true}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default BookDetail;
