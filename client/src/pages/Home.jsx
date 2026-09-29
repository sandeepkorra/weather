import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="hero-page">
      <div className="weather-scene" aria-hidden="true">
        <div className="scene-sun" />
        <div className="scene-cloud scene-cloud-one" />
        <div className="scene-cloud scene-cloud-two" />
        <div className="scene-rain scene-rain-one" />
        <div className="scene-rain scene-rain-two" />
        <div className="scene-grid" />
      </div>

      <div className="hero-topline">
        <span className="live-indicator"><i /> Live atmosphere</span>
        <span className="topline-date">Tuesday, September 22, 2026</span>
      </div>

      <div className="hero-layout">
        <div className="hero-copy">
          <p className="hero-kicker">A clearer way to look outside</p>
          <h1>Weather, with a little more <em>sky.</em></h1>
          <p className="hero-description">Search the world, save the places that matter, and stay one step ahead of the forecast.</p>
          <div className="hero-actions">
            <Link className="hero-button" to="/search">Explore a city <span>{'->'}</span></Link>
            <Link className="hero-text-link" to="/register">Create your free account <span>+</span></Link>
          </div>
        </div>

        <aside className="hero-snapshot">
          <div className="snapshot-heading"><span>Featured signal</span><span className="signal-bars"><i /><i /><i /></span></div>
          <div className="snapshot-place"><span className="snapshot-pin">+</span><div><strong>INDIA</strong><small>INDIA / 20.59 N, 78.96 E</small></div></div>
          <div className="snapshot-temperature"><strong>21</strong><span>°C</span><div><b>Clear skies</b><small>Feels like 22°</small></div></div>
          <div className="snapshot-divider" />
          <div className="snapshot-metrics"><div><small>Humidity</small><b>54%</b></div><div><small>Wind</small><b>12 km/h</b></div><div><small>Visibility</small><b>10 km</b></div></div>
          <div className="snapshot-footer"><span>Updated 2 min ago</span><span className="snapshot-arrow">↗</span></div>
        </aside>
      </div>

      <div className="hero-footer">
        <div><span className="footer-index">01</span><strong>Forecast intelligence</strong><small>Current conditions, made simple.</small></div>
        <div><span className="footer-index">02</span><strong>Your places</strong><small>Keep every horizon within reach.</small></div>
        <div><span className="footer-index">03</span><strong>Quietly useful</strong><small>The signal without the noise.</small></div>
      </div>
    </section>
  );
}