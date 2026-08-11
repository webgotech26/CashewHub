import axios from 'axios';

/**
 * Resolve the backend origin (no trailing /api).
 *
 * Handles all three env-var formats people commonly set:
 *   https://cashew-hub.onrender.com          → keeps as-is
 *   https://cashew-hub.onrender.com/         → strips trailing slash
 *   https://cashew-hub.onrender.com/api      → strips /api suffix
 *   https://cashew-hub.onrender.com/api/     → strips /api/ suffix
 *
 * Call sites always use full paths like  /api/auth/login
 * so baseURL must be the bare origin only.
 */
function resolveBaseURL() {
  const raw = (import.meta.env.VITE_API_URL || 'https://cashew-hub.onrender.com')
    .trim()
    .replace(/\/+$/, '')          // remove trailing slashes
    .replace(/\/api$/, '');       // remove /api suffix if present
  return raw;
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

/* Attach JWT token to every outgoing request */
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

/* Auto-logout on 401 (except auth routes which handle it themselves) */
api.interceptors.response.use(
  response => response,
  error => {
    const isAuthRoute = error.config?.url?.includes('/api/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
