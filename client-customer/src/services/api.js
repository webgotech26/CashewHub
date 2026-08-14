import axios from 'axios';

/**
 * Resolve the backend origin (no trailing /api).
 *
 * Handles all three env-var formats people commonly set:
 *   https://cashewhub.onrender.com          → keeps as-is
 *   https://cashewhub.onrender.com/         → strips trailing slash
 *   https://cashewhub.onrender.com/api      → strips /api suffix
 *   https://cashewhub.onrender.com/api/     → strips /api/ suffix
 *
 * Call sites always use full paths like  /api/auth/login
 * so baseURL must be the bare origin only.
 */
function resolveBaseURL() {
  const raw = (import.meta.env.VITE_API_URL || 'https://cashewhub.onrender.com')
    .trim()
    .replace(/\/+$/, '')          // remove trailing slashes
    .replace(/\/api$/, '');       // remove /api suffix if present
  return raw;
}

const BASE_URL = resolveBaseURL();

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
  timeout: 20000,   // 20 s — Render free tier can take ~15 s on cold start
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

/**
 * apiWithRetry — wraps an axios call with exponential-backoff retry.
 *
 * Retries only on network errors (no response) or 5xx server errors.
 * Does NOT retry on 4xx (auth/validation errors — no point retrying).
 *
 * @param {Function} requestFn  – () => api.get('/api/...')
 * @param {number}   maxRetries – how many extra attempts (default 2)
 * @param {number}   baseDelay  – initial delay in ms (default 1500)
 */
export async function apiWithRetry(requestFn, maxRetries = 2, baseDelay = 1500) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      // Don't retry on 4xx client errors
      if (status && status < 500) throw err;
      // If we have retries left, wait then try again
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // 1.5s → 3s → 6s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * pingBackend — fire-and-forget health check to wake the Render instance.
 * Call this once on app mount so the server is warm before real requests.
 */
export function pingBackend() {
  fetch(`${BASE_URL}/api/health`, { method: 'GET' }).catch(() => {
    // Silently ignore — this is just a wake-up ping
  });
}

export default api;
