import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import BooksList from "./pages/BooksList.jsx";
import BookDetail from "./pages/BookDetail.jsx";
import "./App.css";

// Toast Context for notifications
export const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
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

function Header() {
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
        
        {!isHome && (
          <Link to="/books" className="btn btn-ghost back-btn">
            <span>←</span>
            <span>All Books</span>
          </Link>
        )}
      </div>
    </header>
  );
}

function App() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className="app">
        <Header />
        
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
  );
}

export default App;
