/**
 * Legacy Dashboard.jsx
 * This file is kept for backwards compatibility only.
 * The real admin dashboard is at pages/admin/AdminDashboard.jsx
 * accessible via /admin/dashboard inside the AdminLayout.
 *
 * Any direct hit to this component (e.g. from old bookmarks) is
 * redirected cleanly to the correct route.
 */
import { Navigate } from 'react-router-dom';

export default function Dashboard() {
  return <Navigate to="/admin/dashboard" replace />;
}
