import { useState, useEffect } from "react";
import "./ReviewForm.css";

function StarRating({ value, onChange, readonly = false }) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className={`star-rating-input ${readonly ? "readonly" : ""}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${
            star <= (hoverValue || value) ? "filled" : ""
          }`}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          disabled={readonly}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
        >
          <span className="star-icon">
            {star <= (hoverValue || value) ? "★" : "☆"}
          </span>
        </button>
      ))}
      {value > 0 && <span className="rating-text">{value}/5</span>}
    </div>
  );
}

function ReviewForm({
  bookId,
  bookTitle,
  onSubmit,
  onCancel,
  editingReview = null,
}) {
  const [formData, setFormData] = useState({
    title: "",
    rating_value: 0,
    comment: "",
    reviewer_name: "",
    reviewer_email: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingReview) {
      setFormData({
        title: editingReview.title || "",
        rating_value: editingReview.rating_value || 0,
        comment: editingReview.comment || "",
        reviewer_name: editingReview.reviewer_name || "",
        reviewer_email: editingReview.reviewer_email || "",
      });
    } else {
      // Reset form when not editing
      setFormData({
        title: "",
        rating_value: 0,
        comment: "",
        reviewer_name: "",
        reviewer_email: "",
      });
    }
  }, [editingReview]);

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Please add a title for your review";
    }

    if (formData.rating_value === 0) {
      newErrors.rating_value = "Please select a rating";
    }

    if (!formData.comment.trim()) {
      newErrors.comment = "Please write your review";
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = "Review must be at least 10 characters";
    }

    if (!formData.reviewer_name.trim()) {
      newErrors.reviewer_name = "Please enter your name";
    }

    if (!formData.reviewer_email.trim()) {
      newErrors.reviewer_email = "Please enter your email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reviewer_email)) {
      newErrors.reviewer_email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Send form data to parent - parent handles CMS operations
      await onSubmit(formData);
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="review-form-container">
      <div className="review-form-header">
        <h3>{editingReview ? "Edit Your Review" : "Write a Review"}</h3>
        <p className="form-subtitle">
          Share your thoughts about <strong>{bookTitle}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label htmlFor="rating">Your Rating *</label>
          <StarRating
            value={formData.rating_value}
            onChange={(val) => handleChange("rating_value", val)}
          />
          {errors.rating_value && (
            <span className="form-error">{errors.rating_value}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="title">Review Title *</label>
          <input
            type="text"
            id="title"
            placeholder="Summarize your experience..."
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
          />
          {errors.title && <span className="form-error">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="comment">Your Review *</label>
          <textarea
            id="comment"
            placeholder="What did you like or dislike? What made this book memorable?"
            value={formData.comment}
            onChange={(e) => handleChange("comment", e.target.value)}
            rows={5}
            disabled={isSubmitting}
          />
          {errors.comment && (
            <span className="form-error">{errors.comment}</span>
          )}
          <span className="char-count">
            {formData.comment.length} characters
          </span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reviewer_name">Your Name *</label>
            <input
              type="text"
              id="reviewer_name"
              placeholder="John Doe"
              value={formData.reviewer_name}
              onChange={(e) => handleChange("reviewer_name", e.target.value)}
              disabled={isSubmitting}
            />
            {errors.reviewer_name && (
              <span className="form-error">{errors.reviewer_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reviewer_email">Your Email *</label>
            <input
              type="email"
              id="reviewer_email"
              placeholder="john@example.com"
              value={formData.reviewer_email}
              onChange={(e) => handleChange("reviewer_email", e.target.value)}
              disabled={isSubmitting}
            />
            {errors.reviewer_email && (
              <span className="form-error">{errors.reviewer_email}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner"></span>
                {editingReview ? "Updating..." : "Publishing..."}
              </>
            ) : editingReview ? (
              "Update Review"
            ) : (
              "Publish Review"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReviewForm;
