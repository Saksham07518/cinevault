import { useState } from "react";
import MovieGrid from "./components/MovieGrid";
import "./App.css";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [currentView, setCurrentView] = useState("discover");

  function handleSearch(e) {
    const val = e.target.value;
    setInputValue(val);
    if (currentView !== "discover") setCurrentView("discover");
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
          <a 
            href="#" 
            className={`nav-link ${currentView === 'discover' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setCurrentView('discover'); }}
          >
            Discover
          </a>
          <a 
            href="#" 
            className={`nav-link ${currentView === 'watchlist' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setCurrentView('watchlist'); }}
          >
            Watchlist
          </a>
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
            {currentView === "watchlist" 
              ? "Your Watchlist" 
              : searchQuery 
                ? `Results for "${searchQuery}"` 
                : "Trending This Week"}
          </h2>
          <span className="section-sub">
            {currentView === "watchlist" ? "Movies you've saved for later" : "Hover any poster for details"}
          </span>
        </div>
        <MovieGrid apiKey={TMDB_API_KEY} searchQuery={searchQuery} showWatchlist={currentView === "watchlist"} />
      </main>
    </div>
  );
}
