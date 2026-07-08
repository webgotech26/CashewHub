import { Navigate, useLocation } from 'react-router-dom';

/**
 * Wraps a route and redirects to /login if no valid token.
 * Appends ?redirect=<currentPath> so Login can send the user back.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const token    = localStorage.getItem('token');
  const user     = JSON.parse(localStorage.getItem('user') || 'null');
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
