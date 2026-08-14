/**
 * resolveImageUrl.js  (admin)
 *
 * Same logic as client-customer/src/utils/resolveImageUrl.js.
 * Converts a relative DB image path into a fully-qualified URL.
 */

function getBackendOrigin() {
  return (import.meta.env.VITE_API_URL || 'https://cashewhub.onrender.com')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');
}

/**
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function resolveImageUrl(url) {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (/^(https?:|data:)/i.test(trimmed)) return trimmed;
  const origin = getBackendOrigin();
  const path   = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}
