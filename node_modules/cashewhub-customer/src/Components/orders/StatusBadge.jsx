/**
 * StatusBadge.jsx
 * Premium pill-shaped status badge.
 *
 * Styling is CSS-driven via .status-pill + .status-pill--{status}
 * classes defined in account-layout.css, so colours can be updated
 * in one place without touching this component.
 *
 * Props:
 *   status  {string}  — e.g. 'pending' | 'shipped' | 'delivered'
 */
import { getStatusStyle } from './tokens';

export default function StatusBadge({ status }) {
  const s = getStatusStyle(status);

  return (
    <span
      role="status"
      aria-label={`Order status: ${s.label}`}
      className={`status-pill ${s.cssClass}`}
    >
      <span className="status-pill__dot" aria-hidden="true" />
      {s.label}
    </span>
  );
}
