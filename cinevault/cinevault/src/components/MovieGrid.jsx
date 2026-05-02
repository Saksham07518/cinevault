import { useState, useEffect, useRef, useCallback } from "react";
import MovieTooltip from "./MovieTooltip";
import "./MovieGrid.css";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// Grid layout config — col span + row span per card slot
const GRID_LAYOUT = [
  { col: 3, row: 6 },
  { col: 4, row: 4 },
  { col: 5, row: 7 },
  { col: 3, row: 5 },
  { col: 4, row: 6 },
  { col: 5, row: 5 },
  { col: 3, row: 4 },
  { col: 4, row: 3 },
  { col: 2, row: 5 },
  { col: 4, row: 4 },
  { col: 3, row: 5 },
  { col: 3, row: 4 },
];

export default function MovieGrid({ apiKey }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, movie: null, x: 0, y: 0 });
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("watchlist") || "[]"); }
    catch { return []; }
  });
  const hideTimer = useRef(null);

  useEffect(() => {
    if (!apiKey) { setError("No API key provided"); setLoading(false); return; }
    fetchMovies();
  }, [apiKey]);

  async function fetchMovies() {
    try {
      setLoading(true);
      const res = await fetch(
        `${TMDB_BASE}/trending/movie/week?api_key=${apiKey}&language=en-US`
      );
      if (!res.ok) throw new Error("Failed to fetch movies");
      const data = await res.json();
      // Also fetch genres to map ids → names
      const gRes = await fetch(`${TMDB_BASE}/genre/movie/list?api_key=${apiKey}&language=en-US`);
      const gData = await gRes.json();
      const genreMap = {};
      gData.genres.forEach(g => { genreMap[g.id] = g.name; });

      const top12 = data.results.slice(0, 12).map(m => ({
        id: m.id,
        title: m.title,
        year: m.release_date?.split("-")[0] || "—",
        rating: m.vote_average?.toFixed(1),
        genres: m.genre_ids.slice(0, 2).map(id => genreMap[id]).filter(Boolean),
        desc: m.overview,
        poster: m.poster_path ? `${IMG_BASE}${m.poster_path}` : null,
        backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
        popularity: m.popularity,
        isNew: new Date(m.release_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isHot: m.popularity > 500,
      }));
      setMovies(top12);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleMouseEnter = useCallback((e, movie) => {
    clearTimeout(hideTimer.current);
    positionTooltip(e, movie);
  }, []);

  const handleMouseMove = useCallback((e, movie) => {
    positionTooltip(e, movie);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      setTooltip(t => ({ ...t, visible: false }));
    }, 80);
  }, []);

  function positionTooltip(e, movie) {
    const TW = 230, TH = 340;
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = e.clientX + 20;
    let y = e.clientY - 70;
    if (x + TW > vw - 12) x = e.clientX - TW - 20;
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

  return (
    <>
      <div className="movie-grid">
        {movies.map((movie, i) => {
          const layout = GRID_LAYOUT[i] || { col: 3, row: 4 };
          const inWL = isInWatchlist(movie.id);
          return (
            <div
              key={movie.id}
              className="movie-card"
              style={{ gridColumn: `span ${layout.col}`, gridRow: `span ${layout.row}` }}
              onMouseEnter={e => handleMouseEnter(e, movie)}
              onMouseMove={e => handleMouseMove(e, movie)}
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
      </div>

      {/* Floating tooltip */}
      <MovieTooltip
        movie={tooltip.movie}
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        inWatchlist={tooltip.movie ? isInWatchlist(tooltip.movie.id) : false}
        onToggleWatchlist={toggleWatchlist}
      />
    </>
  );
}
