import { useState, useEffect, useRef, useCallback } from "react";
import Masonry from "react-masonry-css";
import MovieTooltip from "./MovieTooltip";
import "./MovieGrid.css";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";



const breakpointColumnsObj = {
  default: 5,
  1400: 4,
  1100: 3,
  700: 2,
  500: 1
};

export default function MovieGrid({ apiKey, searchQuery, showWatchlist }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerTarget = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, movie: null, x: 0, y: 0 });
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("watchlist") || "[]"); }
    catch { return []; }
  });
  const hideTimer = useRef(null);

  useEffect(() => {
    if (showWatchlist) {
      setMovies(watchlist);
      setLoading(false);
      setError(null);
    }
  }, [showWatchlist, watchlist]);

  useEffect(() => {
    if (!showWatchlist) {
      if (!apiKey) { setError("No API key provided"); setLoading(false); return; }
      setPage(1);
      setHasMore(true);
      fetchMovies(searchQuery, 1);
    }
  }, [apiKey, searchQuery, showWatchlist]);

  useEffect(() => {
    if (!showWatchlist && page > 1) {
      fetchMovies(searchQuery, page);
    }
  }, [page]);

  useEffect(() => {
    if (showWatchlist || loading || isFetchingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    
    return () => observer.disconnect();
  }, [showWatchlist, loading, isFetchingMore, hasMore]);

  async function fetchMovies(query, pageNum) {
    try {
      if (pageNum === 1) setLoading(true);
      else setIsFetchingMore(true);
      setError(null);

      const url = query
        ? `${TMDB_BASE}/search/movie?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}&page=${pageNum}`
        : `${TMDB_BASE}/trending/movie/week?api_key=${apiKey}&language=en-US&page=${pageNum}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch movies");
      const data = await res.json();

      if (!data.results?.length) {
        if (pageNum === 1) setMovies([]);
        setHasMore(false);
        setLoading(false);
        setIsFetchingMore(false);
        return;
      }

      setHasMore(pageNum < data.total_pages);

      // Fetch genres to map ids → names
      const gRes = await fetch(`${TMDB_BASE}/genre/movie/list?api_key=${apiKey}&language=en-US`);
      const gData = await gRes.json();
      const genreMap = {};
      gData.genres.forEach(g => { genreMap[g.id] = g.name; });

      const newMovies = data.results.map(m => ({
        id: m.id,
        title: m.title,
        year: m.release_date?.split("-")[0] || "—",
        rating: m.vote_average?.toFixed(1),
        genres: m.genre_ids?.slice(0, 2).map(id => genreMap[id]).filter(Boolean) || [],
        desc: m.overview,
        poster: m.poster_path ? `${IMG_BASE}${m.poster_path}` : null,
        backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
        popularity: m.popularity,
        isNew: new Date(m.release_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isHot: m.popularity > 500,
      }));
      setMovies(prev => pageNum === 1 ? newMovies : [...prev, ...newMovies]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }

  const handleMouseEnter = useCallback((e, movie) => {
    clearTimeout(hideTimer.current);
    positionTooltip(e, movie);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      setTooltip(t => ({ ...t, visible: false }));
    }, 300); // Increased delay to allow moving to tooltip
  }, []);

  const handleTooltipEnter = useCallback(() => {
    clearTimeout(hideTimer.current);
  }, []);

  function positionTooltip(e, movie) {
    const rect = e.currentTarget.getBoundingClientRect();
    const TW = 230, TH = 340;
    const vw = window.innerWidth, vh = window.innerHeight;
    
    // Default: place to the right of the card
    let x = rect.right + 10;
    let y = rect.top - 20;

    // If it overflows right, place to the left
    if (x + TW > vw - 12) {
      x = rect.left - TW - 10;
    }
    
    // Keep within vertical bounds
    if (y + TH > vh - 12) y = vh - TH - 12;
    if (y < 12) y = 12;
    
    setTooltip({ visible: true, movie, x, y });
  }

  function toggleWatchlist(movie) {
    setWatchlist(prev => {
      const next = prev.find(m => m.id === movie.id)
        ? prev.filter(m => m.id !== movie.id)
        : [...prev, movie];
      localStorage.setItem("watchlist", JSON.stringify(next));
      return next;
    });
  }

  function isInWatchlist(id) {
    return watchlist.some(m => m.id === id);
  }

  if (loading) return (
    <div className="grid-loading">
      {GRID_LAYOUT.map((_, i) => (
        <div key={i} className={`skeleton-card sc-${i + 1}`} />
      ))}
    </div>
  );

  if (error) return (
    <div className="grid-error">
      <p>⚠ {error}</p>
      <small>Check your TMDB API key in App.jsx</small>
    </div>
  );

  if (!loading && movies.length === 0) return (
    <div className="grid-error">
      <p>{showWatchlist ? "🍿 Watchlist is empty" : "🎬 No movies found"}</p>
      <small>{showWatchlist ? "Save some movies to watch later" : "Try a different search term"}</small>
    </div>
  );

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="movie-grid"
        columnClassName="movie-grid_column"
      >
        {movies.map((movie, i) => {
          const inWL = isInWatchlist(movie.id);
          return (
            <div
              key={`${movie.id}-${i}`}
              className="movie-card"
              onMouseEnter={e => handleMouseEnter(e, movie)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Poster image */}
              {movie.poster ? (
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="card-poster"
                  loading="lazy"
                />
              ) : (
                <div className="card-poster-fallback" />
              )}

              {/* Gradient overlay always present */}
              <div className="card-gradient" />

              {/* Badges */}
              {movie.isNew && !movie.isHot && (
                <span className="badge badge-new">New</span>
              )}
              {movie.isHot && (
                <span className="badge badge-hot">Hot</span>
              )}

              {/* Score pill */}
              <span className="score-pill">★ {movie.rating}</span>

              {/* Watchlist heart */}
              <button
                className={`wl-btn ${inWL ? "wl-active" : ""}`}
                onClick={e => { e.stopPropagation(); toggleWatchlist(movie); }}
                aria-label="Add to watchlist"
              >
                {inWL ? "♥" : "♡"}
              </button>

              {/* Bottom title (always visible on small cards) */}
              <div className="card-footer">
                <div className="card-title">{movie.title}</div>
              </div>
            </div>
          );
        })}
      </Masonry>

      {/* Floating tooltip */}
      <MovieTooltip
        movie={tooltip.movie}
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        inWatchlist={tooltip.movie ? isInWatchlist(tooltip.movie.id) : false}
        onToggleWatchlist={toggleWatchlist}
        onMouseEnter={handleTooltipEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Infinite Scroll Sentinel */}
      {!showWatchlist && hasMore && (
        <div 
          ref={observerTarget} 
          style={{ height: 40, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px 0", color: "rgba(255,255,255,0.4)", fontSize: 13 }}
        >
          {isFetchingMore && <span>Loading more movies...</span>}
        </div>
      )}
    </>
  );
}
