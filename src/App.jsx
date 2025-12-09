import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { fetchLocales } from "./services/contentApi";
import {
  detectUserLocale,
  isFirstVisit,
  markAsVisited,
  getBrowserLanguages,
} from "./services/localeDetection";
import BooksList from "./pages/BooksList";
import BookDetail from "./pages/BookDetail";
import "./App.css";

// Toast Context for notifications
export const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

// Locale Context for internationalization
export const LocaleContext = createContext();

export function useLocale() {
  return useContext(LocaleContext);
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function LocaleSelector({ locales, loading, autoDetectedInfo, onAutoDetect }) {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];
  const isAutoDetected = autoDetectedInfo?.locale === locale;

  const handleSelect = (localeCode) => {
    setLocale(localeCode);
    setIsOpen(false);
  };

  const handleAutoDetect = () => {
    onAutoDetect();
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="locale-selector">
        <div className="locale-btn locale-loading">
          <span className="locale-spinner"></span>
          <span className="locale-name">Loading...</span>
        </div>
      </div>
    );
  }

  if (locales.length === 0) {
    return null;
  }

  return (
    <div className="locale-selector">
      <button
        className="locale-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span className="locale-flag">{currentLocale?.flag || "🌐"}</span>
        <span className="locale-name">{currentLocale?.name || "Select"}</span>
        {isAutoDetected && <span className="auto-badge" title="Auto-detected">🎯</span>}
        <span className="locale-arrow">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          <div className="locale-backdrop" onClick={() => setIsOpen(false)} />
          <div className="locale-dropdown">
            {/* Auto-detect option */}
            <button
              className="locale-option auto-detect-option"
              onClick={handleAutoDetect}
            >
              <span className="locale-flag">🎯</span>
              <span className="locale-name">Auto-detect</span>
              <span className="locale-hint">Based on browser</span>
            </button>
            
            <div className="locale-divider" />
            
            {locales.map((loc) => (
              <button
                key={loc.code}
                className={`locale-option ${loc.code === locale ? "active" : ""}`}
                onClick={() => handleSelect(loc.code)}
              >
                <span className="locale-flag">{loc.flag}</span>
                <span className="locale-name">{loc.name}</span>
                {loc.isMaster && <span className="locale-master">Master</span>}
                {loc.code === locale && <span className="locale-check">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Header({ locales, localesLoading, autoDetectedInfo, onAutoDetect }) {
  const location = useLocation();
  const isHome = location.pathname === "/books" || location.pathname === "/";

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/books" className="logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">
            <span className="logo-main">Bookshelf</span>
            <span className="logo-sub">Reviews & Ratings</span>
          </span>
        </Link>

        <div className="header-actions">
          <LocaleSelector
            locales={locales}
            loading={localesLoading}
            autoDetectedInfo={autoDetectedInfo}
            onAutoDetect={onAutoDetect}
          />
          {!isHome && (
            <Link to="/books" className="btn btn-ghost back-btn">
              <span>←</span>
              <span>All Books</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function App() {
  const [toasts, setToasts] = useState([]);
  const [locales, setLocales] = useState([]);
  const [localesLoading, setLocalesLoading] = useState(true);
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem("bookshelf_locale");
    return saved || "en-us";
  });
  const [autoDetectedInfo, setAutoDetectedInfo] = useState(null);

  // Toast function defined early so it can be used in useEffect
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch locales and auto-detect user's preferred locale on mount
  useEffect(() => {
    async function loadLocales() {
      try {
        const data = await fetchLocales();
        setLocales(data);

        // Auto-detect locale for first-time visitors or if no saved preference
        const firstVisit = isFirstVisit();
        const detection = detectUserLocale(data, {
          forceDetection: firstVisit,
        });

        // Check if detected locale exists in available locales
        const localeExists = data.some((l) => l.code === detection.locale);

        if (localeExists) {
          setLocale(detection.locale);
          localStorage.setItem("bookshelf_locale", detection.locale);

          // Show notification for first-time visitors about auto-detection
          if (firstVisit && detection.wasAutoDetected) {
            const detectedLocaleInfo = data.find(
              (l) => l.code === detection.locale
            );
            setAutoDetectedInfo({
              locale: detection.locale,
              localeName: detectedLocaleInfo?.name || detection.locale,
              browserLanguage: detection.browserLanguage,
            });

            // Show toast after a brief delay so UI is ready
            setTimeout(() => {
              addToast(
                `🌍 Language set to ${detectedLocaleInfo?.name || detection.locale} based on your browser settings`,
                "info"
              );
            }, 500);

            markAsVisited();
          }
        } else if (data.length > 0) {
          // Fallback to master locale or first available
          const masterLocale = data.find((l) => l.isMaster);
          const defaultLocale = masterLocale ? masterLocale.code : data[0].code;
          setLocale(defaultLocale);
          localStorage.setItem("bookshelf_locale", defaultLocale);
        }
      } catch (err) {
        console.error("Failed to fetch locales:", err);
        // Fallback to default locale
        setLocales([
          { code: "en-us", name: "English (US)", flag: "🇺🇸", isMaster: true },
        ]);
      } finally {
        setLocalesLoading(false);
      }
    }

    loadLocales();
  }, [addToast]);

  const handleSetLocale = useCallback((newLocale) => {
    setLocale(newLocale);
    localStorage.setItem("bookshelf_locale", newLocale);
    // Clear auto-detected info when user manually changes locale
    setAutoDetectedInfo(null);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle manual auto-detect trigger
  const handleAutoDetect = useCallback(() => {
    const detection = detectUserLocale(locales, { forceDetection: true });
    const localeExists = locales.some((l) => l.code === detection.locale);

    if (localeExists) {
      setLocale(detection.locale);
      localStorage.setItem("bookshelf_locale", detection.locale);

      const detectedLocaleInfo = locales.find(
        (l) => l.code === detection.locale
      );
      setAutoDetectedInfo({
        locale: detection.locale,
        localeName: detectedLocaleInfo?.name || detection.locale,
        browserLanguage: detection.browserLanguage,
      });

      addToast(
        `🎯 Language set to ${detectedLocaleInfo?.name || detection.locale} based on your browser (${detection.browserLanguage})`,
        "success"
      );
    } else {
      addToast("Could not detect a matching language", "error");
    }
  }, [locales, addToast]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, locales }}>
      <ToastContext.Provider value={{ addToast }}>
        <div className="app">
          <Header
            locales={locales}
            localesLoading={localesLoading}
            autoDetectedInfo={autoDetectedInfo}
            onAutoDetect={handleAutoDetect}
          />

          <main className="main-content">
            <div className="container">
              <Routes>
                <Route path="/" element={<Navigate to="/books" replace />} />
                <Route path="/books" element={<BooksList />} />
                <Route path="/books/:slug" element={<BookDetail />} />
              </Routes>
            </div>
          </main>

          <footer className="app-footer">
            <div className="container">
              <p>Made with ❤️ for book lovers</p>
            </div>
          </footer>

          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </ToastContext.Provider>
    </LocaleContext.Provider>
  );
}

export default App;
