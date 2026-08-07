/**
 * ActionButtons.jsx
 * CTA row at the bottom of each OrderCard.
 *
 * Props:
 *   orderId     {number|string}
 *   status      {string}
 *   onView      {(id) => void}   — navigate to order detail
 *   onAction    {(id) => void}   — "Track Order" depending on status
 *   onReorder   {(id) => void}   — reorder handler passed from MyOrders
 */
import { useState } from 'react';
import { GOLD, GOLD_L, DARK, FONT } from './tokens';

/* ── Primary button ────────────────────────────────────────────── */
function PrimaryBtn({ children, onClick, ariaLabel, disabled, loading }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily:    FONT,
        flex:          1,
        padding:       '11px 0',
        borderRadius:  10,
        border:        'none',
        background:    disabled || loading
          ? '#E5E7EB'
          : `linear-gradient(135deg, ${GOLD}, ${GOLD_L})`,
        color:         disabled || loading ? '#9CA3AF' : '#1a0a00',
        fontSize:      13,
        fontWeight:    700,
        cursor:        disabled || loading ? 'not-allowed' : 'pointer',
        letterSpacing: 0.2,
        boxShadow:     hovered && !disabled && !loading ? `0 6px 20px ${GOLD}55` : `0 3px 12px ${GOLD}35`,
        transform:     hovered && !disabled && !loading ? 'translateY(-1px)' : 'translateY(0)',
        transition:    'all 0.18s ease',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        gap:           5,
      }}
    >
      {children}
    </button>
  );
}

/* ── Green Reorder button ──────────────────────────────────────── */
function ReorderBtn({ children, onClick, ariaLabel, loading, done }) {
  const [hovered, setHovered] = useState(false);

  const bg = done
    ? '#16A34A'
    : loading
      ? '#E5E7EB'
      : hovered
        ? '#1B4332'
        : '#2D6A4F';

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={loading || done}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily:    FONT,
        flex:          1,
        padding:       '11px 0',
        borderRadius:  10,
        border:        'none',
        background:    bg,
        color:         loading ? '#9CA3AF' : '#fff',
        fontSize:      13,
        fontWeight:    700,
        cursor:        loading || done ? 'not-allowed' : 'pointer',
        letterSpacing: 0.2,
        boxShadow:     hovered && !loading && !done
          ? '0 6px 20px rgba(45,106,79,0.4)'
          : '0 3px 10px rgba(45,106,79,0.2)',
        transform:     hovered && !loading && !done ? 'translateY(-1px)' : 'translateY(0)',
        transition:    'all 0.18s ease',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        gap:           5,
      }}
    >
      {children}
    </button>
  );
}

/* ── Ghost button ──────────────────────────────────────────────── */
function GhostBtn({ children, onClick, ariaLabel }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily:    FONT,
        flex:          1,
        padding:       '11px 0',
        borderRadius:  10,
        border:        `1.5px solid ${hovered ? DARK : '#D1D5DB'}`,
        background:    hovered ? DARK : 'transparent',
        color:         hovered ? '#fff' : DARK,
        fontSize:      13,
        fontWeight:    600,
        cursor:        'pointer',
        letterSpacing: 0.2,
        transition:    'all 0.18s ease',
      }}
    >
      {children}
    </button>
  );
}

/* ── ActionButtons export ──────────────────────────────────────── */
export default function ActionButtons({ orderId, status, onView, onAction, onReorder }) {
  const isDelivered = status === 'delivered';
  const isCancelled = status === 'cancelled';

  const [reorderLoading, setReorderLoading] = useState(false);
  const [reorderDone,    setReorderDone]    = useState(false);

  const handleReorder = async () => {
    if (!onReorder || reorderLoading || reorderDone) return;
    setReorderLoading(true);
    try {
      await onReorder(orderId);
      setReorderDone(true);
      // Reset after 3 seconds so button is usable again
      setTimeout(() => setReorderDone(false), 3000);
    } finally {
      setReorderLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>

      {/* View Details — always visible */}
      <GhostBtn
        onClick={() => onView(orderId)}
        ariaLabel={`View details for order #${orderId}`}
      >
        View Details
      </GhostBtn>

      {/* Delivered → Reorder button */}
      {isDelivered && (
        <ReorderBtn
          onClick={handleReorder}
          loading={reorderLoading}
          done={reorderDone}
          ariaLabel={`Reorder items from order #${orderId}`}
        >
          {reorderDone
            ? '✓ Added to Cart!'
            : reorderLoading
              ? '⏳ Adding…'
              : '🔄 Reorder'}
        </ReorderBtn>
      )}

      {/* Active orders → Track Order */}
      {!isCancelled && !isDelivered && (
        <PrimaryBtn
          onClick={() => onAction(orderId)}
          ariaLabel={`Track order #${orderId}`}
        >
          Track Order →
        </PrimaryBtn>
      )}

    </div>
  );
}
