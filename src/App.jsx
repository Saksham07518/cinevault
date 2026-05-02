import { useState } from "react";
import MovieGrid from "./components/MovieGrid";
import "./App.css";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  function handleSearch(e) {
    const val = e.target.value;
    setInputValue(val);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => setSearchQuery(val.trim()), 400);
  }

  function handleClear() {
    setInputValue("");
    setSearchQuery("");
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          cine<span>vault</span>
        </div>
        <nav className="app-nav">
          <a href="#" className="nav-link active">Discover</a>
          <a href="#" className="nav-link">Watchlist</a>
          <a href="#" className="nav-link">Trending</a>
        </nav>
        <div className="header-right">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              id="movie-search"
              className="search-input"
              type="text"
              placeholder="Search movies…"
              value={inputValue}
              onChange={handleSearch}
              autoComplete="off"
            />
            {inputValue && (
              <button className="search-clear" onClick={handleClear} aria-label="Clear search">✕</button>
            )}
          </div>
        </div>
      </header>

      <main>
        <div className="section-header">
          <h2 className="section-title">
            {searchQuery ? `Results for "${searchQuery}"` : "Trending This Week"}
          </h2>
          <span className="section-sub">Hover any poster for details</span>
        </div>
        <MovieGrid apiKey={TMDB_API_KEY} searchQuery={searchQuery} />
      </main>
    </div>
  );
}
