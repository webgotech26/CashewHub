/**
 * resolveImageUrl.js
 *
 * Converts a product image_url stored in the database into a fully-qualified
 * URL that the browser can load directly.
 *
 * Three cases:
 *
 *  1. Empty / null / whitespace → returns null (caller renders a fallback).
 *
 *  2. Absolute URL (starts with http / https / data:) → return as-is.
 *     This covers Cloudinary CDN links and any other hosted image.
 *
 *  3. Relative path (e.g. "/uploads/products/product-123.jpg")
 *     → prepend the Render backend origin so the browser can fetch it.
 *     Reads from  import.meta.env.VITE_API_URL  (same var used by api.js).
 *
 * Usage:
 *   import { resolveImageUrl } from '../utils/resolveImageUrl';
 *   <img src={resolveImageUrl(product.image_url)} alt={product.name} />
 */

/** Bare backend origin — no trailing slash, no /api suffix. */
function getBackendOrigin() {
  return (import.meta.env.VITE_API_URL || 'https://cashewhub.onrender.com')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');
}

/**
 * @param {string|null|undefined} url  Raw value from the database image_url column.
 * @returns {string|null}              Fully-qualified URL, or null if nothing to show.
 */
export function resolveImageUrl(url) {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();

  // Already absolute (http/https/data URI)
  if (/^(https?:|data:)/i.test(trimmed)) return trimmed;

  // Relative path — prepend backend origin
  const origin = getBackendOrigin();
  // Ensure exactly one slash between origin and path
  const path   = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}
