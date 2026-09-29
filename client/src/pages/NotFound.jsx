import { Link } from 'react-router-dom';

export default function NotFound() {
  return <section className="not-found"><p className="eyebrow">404</p><h1>Page not found</h1><p>That route does not exist.</p><Link to="/">Return home</Link></section>;
}