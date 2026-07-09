/**
 * tokens.js
 * Shared design tokens and status configuration for the Orders feature.
 * Import from here — never hard-code brand values in individual components.
 */

export const GOLD   = '#C9972B';
export const GOLD_L = '#F5C842';
export const DARK   = '#1A1A1A';
export const MUTED  = '#9CA3AF';
export const FONT   = "'Inter', 'DM Sans', system-ui, sans-serif";

/**
 * STATUS_MAP
 * Single source of truth for every order status.
 * bg/color values match the CSS .status-pill--* classes in account-layout.css.
 *
 * @type {Record<string, { bg, color, dot, label, icon, cssClass }>}
 */
export const STATUS_MAP = {
  pending: {
    bg:       '#FEF9C3',   /* warm amber — spec: #FEF9C3 */
    color:    '#854D0E',
    dot:      '#D97706',
    label:    'Pending',
    icon:     '🕐',
    cssClass: 'status-pill--pending',
  },
  confirmed: {
    bg:       '#EFF6FF',
    color:    '#1D4ED8',
    dot:      '#3B82F6',
    label:    'Confirmed',
    icon:     '✓',
    cssClass: 'status-pill--confirmed',
  },
  processing: {
    bg:       '#F5F3FF',
    color:    '#6D28D9',
    dot:      '#7C3AED',
    label:    'Processing',
    icon:     '⚙️',
    cssClass: 'status-pill--processing',
  },
  shipped: {
    bg:       '#ECFEFF',
    color:    '#0E7490',
    dot:      '#06B6D4',
    label:    'Shipped',
    icon:     '🚚',
    cssClass: 'status-pill--shipped',
  },
  delivered: {
    bg:       '#F0FDF4',
    color:    '#15803D',
    dot:      '#22C55E',
    label:    'Delivered',
    icon:     '🎉',
    cssClass: 'status-pill--delivered',
  },
  cancelled: {
    bg:       '#FFF1F2',
    color:    '#9F1239',
    dot:      '#F43F5E',
    label:    'Cancelled',
    icon:     '✕',
    cssClass: 'status-pill--cancelled',
  },
};

/**
 * getStatusStyle
 * Maps a raw status string to its visual config.
 * Used by StatusBadge.jsx and any component that needs pill colours.
 *
 * @param {string} status
 * @returns {{ bg, color, dot, label, icon, cssClass }}
 */
export function getStatusStyle(status) {
  return (
    STATUS_MAP[status] ?? {
      bg:       '#F3F4F6',
      color:    '#374151',
      dot:      '#9CA3AF',
      label:    status,
      icon:     '•',
      cssClass: '',
    }
  );
}

/** Ordered list of steps used by the progress Timeline. */
export const TIMELINE_STEPS = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];
