import axios from 'axios';

/**
 * Resolve the backend base URL.
 * Priority:
 *   1. VITE_API_URL env var (set in Vercel dashboard for production)
 *   2. Hard-coded Render production URL as fallback
 *
 * The URL must always be absolute (start with https:// or http://) so that
 * Axios never resolves it relative to the current window.location origin.
 */
const RAW_URL = import.meta.env.VITE_API_URL || 'https://cashew-hub.onrender.com';

/* Strip any accidental trailing slash so paths join cleanly */
const BASE_URL = RAW_URL.replace(/\/+$/, '');

const api = axios.create({
  baseURL: BASE_URL,
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
