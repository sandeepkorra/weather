import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

export default function Favourites() {
  const navigate = useNavigate();
  const [favourites, setFavourites] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/cities')
      .then(({ data }) => {
        setFavourites(Array.isArray(data) ? data : data.cities || []);
        setStatus('success');
      })
      .catch(() => {
        setError('Could not load your favourites. Please try again.');
        setStatus('error');
      });
  }, []);

  async function removeFavourite(favourite) {
    const previousFavourites = favourites;
    setFavourites((current) => current.filter((item) => item._id !== favourite._id));
    try {
      await api.delete(`/cities/${favourite._id}`);
    } catch {
      setFavourites(previousFavourites);
      setError('Could not remove that favourite.');
    }
  }

  return (
    <section className="collection-page">
      <div className="page-heading">
        <p className="eyebrow">Your saved places</p>
        <h1>Favourites</h1>
        <p>Keep the cities you check most close at hand.</p>
      </div>
      {status === 'loading' && <p className="weather-skeleton">Loading favourites...</p>}
      {status === 'error' && <p className="weather-message" role="alert">{error}</p>}
      {status === 'success' && favourites.length === 0 && (
        <div className="empty-state">
          <p>No favourites yet. Search for a city and add it here.</p>
          <button type="button" onClick={() => navigate('/search')}>Search cities</button>
        </div>
      )}
      {error && status === 'success' && <p className="weather-message" role="alert">{error}</p>}
      <div className="collection-grid">
        {favourites.map((favourite) => (
          <article className="collection-card" key={favourite._id}>
            <div><h2>{favourite.name}</h2><p>{favourite.country || 'Country unavailable'}</p></div>
            <div className="card-actions">
              <button type="button" onClick={() => navigate(`/search?city=${encodeURIComponent(favourite.name)}`)}>View weather</button>
              <button type="button" className="secondary-button" onClick={() => removeFavourite(favourite)}>Remove</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}