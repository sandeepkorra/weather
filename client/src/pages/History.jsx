import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const limit = 10;

function relativeTime(timestamp) {
  const difference = new Date(timestamp).getTime() - Date.now();
  const minutes = Math.round(difference / 60000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
}

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus('loading');
    api.get('/history', { params: { page, limit } })
      .then(({ data }) => {
        setHistory(Array.isArray(data) ? data : data.entries || data.history || []);
        setPages(data.pages || data.totalPages || 1);
        setStatus('success');
      })
      .catch(() => {
        setError('Could not load your search history. Please try again.');
        setStatus('error');
      });
  }, [page]);

  async function deleteEntry(entry) {
    try {
      await api.delete(`/history/${entry._id}`);
      setHistory((current) => current.filter((item) => item._id !== entry._id));
    } catch {
      setError('Could not delete that history entry.');
    }
  }

  async function clearHistory() {
    if (!window.confirm('Clear your entire search history?')) return;
    try {
      await api.delete('/history');
      setHistory([]);
      setPage(1);
      setPages(1);
    } catch {
      setError('Could not clear your search history.');
    }
  }

  return (
    <section className="collection-page history-page">
      <div className="history-scene" aria-hidden="true">
        <div className="history-scene-cloud history-scene-cloud-one" />
        <div className="history-scene-cloud history-scene-cloud-two" />
        <div className="history-scene-sun" />
        <div className="history-scene-rays" />
        <div className="history-scene-mist" />
      </div>
      <div className="page-heading page-heading-row">
        <div><p className="eyebrow">Your recent searches</p><h1>History</h1><p>Return to a city you have already explored.</p></div>
        <button type="button" className="secondary-button" onClick={clearHistory} disabled={!history.length}>Clear all</button>
      </div>
      {status === 'loading' && <p className="weather-skeleton">Loading history...</p>}
      {status === 'error' && <p className="weather-message" role="alert">{error}</p>}
      {error && status === 'success' && <p className="weather-message" role="alert">{error}</p>}
      {status === 'success' && history.length === 0 && <p className="empty-state">No searches yet.</p>}
      <div className="history-list">
        {history.map((entry) => (
          <article className="history-row" key={entry._id}>
            <div><h2>{entry.city}</h2><p>{relativeTime(entry.searchedAt)}</p></div>
            <div className="card-actions">
              <button type="button" onClick={() => navigate(`/search?city=${encodeURIComponent(entry.city)}`)}>Search again</button>
              <button type="button" className="secondary-button" onClick={() => deleteEntry(entry)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
      {pages > 1 && <div className="pagination"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setPage((current) => current + 1)}>Next</button></div>}
    </section>
  );
}