import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <p>Restoring your session...</p>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}