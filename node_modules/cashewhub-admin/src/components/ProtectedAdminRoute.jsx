import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedAdminRoute — only allows users with role=admin.
 * Any other user is redirected to /login.
 */
export default function ProtectedAdminRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    const redirectTo = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
