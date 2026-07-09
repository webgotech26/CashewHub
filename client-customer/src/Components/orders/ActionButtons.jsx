/**
 * ActionButtons.jsx
 * CTA row at the bottom of each OrderCard.
 *
 * Props:
 *   orderId     {number|string}
 *   status      {string}
 *   onView      {(id) => void}  — navigate to order detail
 *   onAction    {(id) => void}  — "Track Order" or "Order Again" depending on status
 */
import { useState } from 'react';
import { GOLD, GOLD_L, DARK, FONT } from './tokens';

/* ── Primary button — filled gold gradient ────────────────────── */
function PrimaryBtn({ children, onClick, ariaLabel }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily:   FONT,
        flex:         1,
        padding:      '11px 0',
        borderRadius: 10,
        border:       'none',
        background:   `linear-gradient(135deg, ${GOLD}, ${GOLD_L})`,
        color:        '#1a0a00',
        fontSize:     13,
        fontWeight:   700,
        cursor:       'pointer',
        letterSpacing: 0.2,
        boxShadow:    hovered ? `0 6px 20px ${GOLD}55` : `0 3px 12px ${GOLD}35`,
        transform:    hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition:   'all 0.18s ease',
      }}
    >
      {children}
    </button>
  );
}

/* ── Ghost button — outlined, fills dark on hover ─────────────── */
function GhostBtn({ children, onClick, ariaLabel }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily:   FONT,
        flex:         1,
        padding:      '11px 0',
        borderRadius: 10,
        border:       `1.5px solid ${hovered ? DARK : '#D1D5DB'}`,
        background:   hovered ? DARK : 'transparent',
        color:        hovered ? '#fff' : DARK,
        fontSize:     13,
        fontWeight:   600,
        cursor:       'pointer',
        letterSpacing: 0.2,
        transition:   'all 0.18s ease',
      }}
    >
      {children}
    </button>
  );
}

/* ── ActionButtons export ─────────────────────────────────────── */
export default function ActionButtons({ orderId, status, onView, onAction }) {
  const isDelivered = status === 'delivered';
  const isCancelled = status === 'cancelled';

  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
      <GhostBtn
        onClick={() => onView(orderId)}
        ariaLabel={`View details for order #${orderId}`}
      >
        View Details
      </GhostBtn>

      {/* Active orders → Track; Delivered → Re-order; Cancelled → nothing */}
      {!isCancelled && (
        <PrimaryBtn
          onClick={() => onAction(orderId)}
          ariaLabel={
            isDelivered
              ? `Order again from order #${orderId}`
              : `Track order #${orderId}`
          }
        >
          {isDelivered ? 'Order Again →' : 'Track Order →'}
        </PrimaryBtn>
      )}
    </div>
  );
}
