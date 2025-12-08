import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../App";
import { fetchBooks } from "../services/contentApi";
import "./BooksList.css";

// Format reading time from metadata
// CMS stores either total hours OR total minutes (not hours + additional minutes)
function formatReadingTime(readingTimeMetadata) {
  if (!readingTimeMetadata) return null;

  const hours = parseInt(readingTimeMetadata.estimated_hours) || 0;
  const totalMinutes = parseInt(readingTimeMetadata.estimated_minutes) || 0;

  // If we have hours, use that (e.g., 6 hours)
  if (hours > 0) {
    return `${hours}h`;
  }

  // If we have minutes, convert to hours + minutes if >= 60
  if (totalMinutes > 0) {
    if (totalMinutes >= 60) {
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    return `${totalMinutes} min`;
  }

  return null;
}

function BookCard({ book, index }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const readingTime = formatReadingTime(book.reading_time_metadata);

  return (
    <Link
      to={`/books/${book.slug}`}
      className="book-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="book-card-image">
        {book.cover_image?.url ? (
          <>
            {!imageLoaded && <div className="skeleton book-cover-skeleton" />}
            <img
              src={book.cover_image.url}
              alt={book.title}
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
          </>
        ) : (
          <div className="book-cover-placeholder">
            <span className="book-icon">📖</span>
            <span className="book-placeholder-title">
              {book.title?.slice(0, 2)}
            </span>
          </div>
        )}
        {book.featured && (
          <span className="featured-badge">
            <span>⭐</span> Featured
          </span>
        )}
      </div>

      <div className="book-card-content">
        <h3 className="book-title">{book.title}</h3>

        {book.author && <p className="book-author">by {book.author}</p>}

        {book.genre && book.genre.length > 0 && (
          <div className="book-genres">
            {book.genre.slice(0, 2).map((g, i) => (
              <span key={i} className="tag tag-secondary">
                {g}
              </span>
            ))}
            {book.genre.length > 2 && (
              <span className="tag tag-secondary">
                +{book.genre.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="book-meta-row">
          {book.publication_year && (
            <span className="book-year">{book.publication_year}</span>
          )}
          {readingTime && (
            <span className="book-reading-time">
              <span className="reading-time-icon">⏱️</span>
              {readingTime}
            </span>
          )}
        </div>
      </div>

      <div className="book-card-arrow">
        <span>→</span>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="books-grid">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="book-card skeleton-card">
          <div className="skeleton book-cover-skeleton" />
          <div className="book-card-content">
            <div
              className="skeleton"
              style={{ height: "24px", width: "80%", marginBottom: "8px" }}
            />
            <div
              className="skeleton"
              style={{ height: "16px", width: "60%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">📚</div>
      <h3>No books found</h3>
      <p>Check back later for new additions to the library.</p>
    </div>
  );
}

function BooksList() {
  const { locale } = useLocale();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch books when locale changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBooks(locale);
        setBooks(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load books. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [locale]);

  const filteredBooks = books.filter((book) => {
    const query = searchQuery.toLowerCase();
    return (
      book.title?.toLowerCase().includes(query) ||
      book.author?.toLowerCase().includes(query) ||
      book.genre?.some((g) => g.toLowerCase().includes(query))
    );
  });

  return (
    <div className="books-page">
      <div className="page-header">
        <h1 className="page-title">Discover Books</h1>
        <p className="page-subtitle">
          Explore our collection and share your thoughts
        </p>
      </div>

      <div className="search-section">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title, author, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && <LoadingSkeleton />}

      {error && (
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && filteredBooks.length === 0 && searchQuery && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      )}

      {!loading && !error && books.length === 0 && <EmptyState />}

      {!loading && !error && filteredBooks.length > 0 && (
        <>
          <div className="results-count">
            Showing {filteredBooks.length} book
            {filteredBooks.length !== 1 ? "s" : ""}
            {searchQuery && ` for "${searchQuery}"`}
          </div>
          <div className="books-grid">
            {filteredBooks.map((book, index) => (
              <BookCard key={book.uid} book={book} index={index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default BooksList;
