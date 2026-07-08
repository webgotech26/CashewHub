/**
 * createApiClient — shared factory used by both client-customer and client-admin.
 *
 * Usage in client-customer/src/services/api.js:
 *   import createApiClient from '../../../shared/services/createApiClient';
 *   export default createApiClient({ redirectPath: '/login' });
 *
 * Usage in client-admin/src/services/api.js:
 *   import createApiClient from '../../../shared/services/createApiClient';
 *   export default createApiClient({ redirectPath: '/admin/login' });
 */

import axios from 'axios';

export default function createApiClient({ redirectPath = '/login' } = {}) {
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach JWT to every outgoing request
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle 401 — clear session and redirect to the app's own login page
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const isAuthRoute = error.config?.url?.includes('/api/auth/');
      if (error.response?.status === 401 && !isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = redirectPath;
      }
      return Promise.reject(error);
    }
  );

  return api;
}
