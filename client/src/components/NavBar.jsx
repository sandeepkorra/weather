import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const publicLinks = [
  ['/', 'Home'],
  ['/login', 'Login'],
  ['/register', 'Register']
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const links = user
    ? [['/', 'Home'], ['/search', 'Search'], ['/favourites', 'Favourites'], ['/history', 'History']]
    : publicLinks;

  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <div className="nav-inner">
        <NavLink className="brand-mark" to="/" end><span className="brand-symbol">/</span><span>Weather<span>Explorer</span></span></NavLink>
        <div className="nav-links">
          {links.map(([to, label]) => (
            <NavLink key={to} end={to === '/'} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </div>
        {user && <div className="nav-account"><span className="nav-user">{user.name}</span><button type="button" onClick={logout}>Logout</button></div>}
      </div>
    </nav>
  );
}