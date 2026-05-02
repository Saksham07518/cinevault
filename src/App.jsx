import MovieGrid from "./components/MovieGrid";
import "./App.css";

const TMDB_API_KEY = "e54cc10534683f3d416645de4432f33f";

export default function App() {
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
          <span className="powered-by">Powered by TMDB</span>
        </div>
      </header>

      <main>
        <div className="section-header">
          <h2 className="section-title">Trending This Week</h2>
          <span className="section-sub">Hover any poster for details</span>
        </div>
        <MovieGrid apiKey={TMDB_API_KEY} />
      </main>
    </div>
  );
}
