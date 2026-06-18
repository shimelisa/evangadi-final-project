/**
 * Navbar: top bar with page title, debounced keyword search, and AI semantic search.
 * Search drives URL params → Dashboard reads them via useSearchParams.
 * searchMode: 'keyword' (default, auto-debounce) | 'semantic' (AI Search button)
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LogOut, Sparkles } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar({ title, subtitle, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Search state ──
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("query") || "";
  });

  // Keep input in sync with URL when navigating back to dashboard
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const urlQuery = params.get("query") || "";
    const urlMode = params.get("mode") || "";

    // only sync when URL actually has query
    if (urlQuery) {
      setSearchTerm(urlQuery);
    }
  }, [location.search]);

  // ── Debounced keyword search (500ms) ──
  // searchMode = keyword: auto-fires as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchTerm.trim();

      // ✅ CASE 1: empty → reset ONLY
      if (!trimmed) {
        if (location.pathname === "/dashboard" && location.search) {
          navigate("/dashboard");
        }
        return;
      }

      // ✅ CASE 2: valid search → navigate
      if (location.pathname === "/dashboard") {
        const url = `/dashboard?query=${encodeURIComponent(trimmed)}&mode=keyword`;
        navigate(url);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, navigate, location.pathname]);

  // ── Semantic search (AI Search button) ──
  // searchMode = semantic: fires on button click
  const handleSemanticSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 3) {
      navigate(
        `/dashboard?query=${encodeURIComponent(searchTerm.trim())}&mode=semantic`,
      );
    }
  };

  // ── Keyword search on Enter ──
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(
        `/dashboard?query=${encodeURIComponent(searchTerm.trim())}&mode=keyword`,
      );
    }
  };

  return (
    <header className={styles.navbar}>
      {/* Page title */}
      <div className={styles.navbar__titleBlock}>
        <h2 className={styles.navbar__pageTitle}>{title}</h2>
        {subtitle && <p className={styles.navbar__pageSubtitle}>{subtitle}</p>}
      </div>

      {/* Search bar */}
      <form className={styles.navbar__search} onSubmit={handleSearchSubmit}>
        <div className={styles["navbar__search-icon"]}>
          <Search size={16} />
        </div>
        <input
          id="search"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          placeholder="Search questions by keyword…"
          className={styles["navbar__search-input"]}
          aria-label="Search questions by keyword"
        />
        {/* AI Search button — triggers semantic search */}
        {searchTerm.length >= 3 && (
          <button
            type="button"
            onClick={handleSemanticSearch}
            className={styles["navbar__semantic-button"]}
            title="Use AI Semantic Search"
          >
            <Sparkles size={14} />
            <span className={styles["navbar__semantic-text"]}>AI Search</span>
          </button>
        )}
      </form>

      {/* User info + logout */}
      <div className={styles.navbar__actions}>
        <div className={styles.navbar__user}>
          <span className={styles["navbar__user-name"]}>
            {user ? `${user.firstName} ${user.lastName}` : "Guest"}
          </span>
          <div className={styles["navbar__user-avatar"]}>
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${user?.firstName || "User"}+${user?.lastName || ""}&background=random`
              }
              alt="avatar"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        {user && (
          <button
            type="button"
            className={styles.navbar__logout}
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
