import { Navigate } from 'react-router-dom';

/**
 * Wraps a route and redirects to /login if no valid token or role mismatch.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/login" replace />;

  return children;
}
