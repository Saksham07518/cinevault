import { useEffect, useRef } from "react";
import "./MovieTooltip.css";

function StarRating({ rating }) {
  const full = Math.round(parseFloat(rating) / 2);
  return (
    <div className="tip-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`tip-star ${i > full ? "empty" : ""}`}>★</span>
      ))}
      <span className="tip-score-label">{rating} / 10</span>
    </div>
  );
}

export default function MovieTooltip({ movie, visible, x, y, inWatchlist, onToggleWatchlist, onMouseEnter, onMouseLeave }) {
  const ref = useRef(null);

  if (!movie) return null;

  const BACKDROP = movie.backdrop || movie.poster;

  return (
    <div
      ref={ref}
      className={`movie-tooltip ${visible ? "visible" : ""}`}
      style={{ left: x, top: y }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="tip-box">
        {/* Banner */}
        <div className="tip-banner">
          {BACKDROP ? (
            <img src={BACKDROP} alt={movie.title} className="tip-banner-img" />
          ) : (
            <div className="tip-banner-fallback" />
          )}
          <div className="tip-banner-overlay" />
          <div className="tip-banner-title">{movie.title}</div>
        </div>

        <div className="tip-body">
          {/* Genre chips */}
          <div className="tip-genres">
            {movie.genres.map(g => (
              <span key={g} className="tip-genre">{g}</span>
            ))}
          </div>

          {/* Meta row */}
          <div className="tip-meta">
            <span className="tip-rating">★ {movie.rating}</span>
            <span className="tip-dot" />
            <span className="tip-year">{movie.year}</span>
          </div>

          {/* Description */}
          <p className="tip-desc">
            {movie.desc?.length > 120 ? movie.desc.slice(0, 117) + "…" : movie.desc}
          </p>

          {/* Actions */}
          <div className="tip-actions">
            <a
              href={`https://www.themoviedb.org/movie/${movie.id}`}
              target="_blank"
              rel="noreferrer"
              className="tip-btn-watch"
            >
              ▶ View Details
            </a>
            <button
              className={`tip-btn-save ${inWatchlist ? "saved" : ""}`}
              onClick={() => onToggleWatchlist(movie)}
            >
              {inWatchlist ? "✓ Saved" : "+ Save"}
            </button>
          </div>
        </div>

        <div className="tip-divider" />

        {/* Star rating */}
        <StarRating rating={movie.rating} />
      </div>
    </div>
  );
}
