/**
 * OrderCard.jsx
 * Premium order card — 16px border-radius, 24px padding,
 * box-shadow: 0 4px 15px rgba(0,0,0,0.08), lift-on-hover.
 *
 * Props:
 *   order   {object}  — order data from API
 *   onView  {(id) => void}
 *   onTrack {(id) => void}
 */
import { useState } from 'react';
import { getProductVisual } from '../../utils/productVisual';
import { GOLD, GOLD_L, DARK, MUTED, FONT } from './tokens';
import StatusBadge   from './StatusBadge';
import Timeline      from './Timeline';
import ActionButtons from './ActionButtons';

/* ── Helper: parse image_url (may be JSON string) ───────────────── */
function parseImageUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
  } catch {
    return raw.startsWith('http') || raw.startsWith('/') ? raw : null;
  }
}

/* ── CalendarIcon — tiny inline SVG ──────────────────────────── */
function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      width="10" height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function OrderCard({ order, onView, onTrack }) {
  const [hovered, setHovered] = useState(false);

  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });

  const formattedAmount = Number(order.total_amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
  });

  /* Resolve image — parse JSON array string if needed */
  const visual   = getProductVisual(order.product_names ?? '');
  const imgSrc   = parseImageUrl(order.image_url) || visual.localImage || null;

  /* Accent bar colour mirrors status */
  const accentColor = isCancelled
    ? '#F43F5E'
    : isDelivered
      ? '#22C55E'
      : `linear-gradient(90deg, ${GOLD}, ${GOLD_L})`;

  return (
    <article
      aria-label={`Order #${order.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   '#fff',
        borderRadius: 16,                              /* spec: 16px */
        border:       `1px solid ${hovered ? `${GOLD}55` : '#EBEBEB'}`,
        boxShadow:    hovered
          ? `0 16px 40px rgba(0,0,0,0.10), 0 4px 15px ${GOLD}18`
          : '0 4px 15px rgba(0,0,0,0.08)',            /* spec: 0 4px 15px … */
        transform:    hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition:   'all 0.26s cubic-bezier(0.4,0,0.2,1)',
        overflow:     'hidden',
      }}
    >
      {/* ── Status accent bar ── */}
      <div
        aria-hidden="true"
        style={{
          height:     3,
          background: accentColor,
          opacity:    hovered ? 1 : 0.5,
          transition: 'opacity 0.3s',
        }}
      />

      <div style={{ padding: 24, fontFamily: FONT }}>

        {/* ── Row 1: Order ID + date + status badge ── */}
        <div
          style={{
            display:         'flex',
            justifyContent:  'space-between',
            alignItems:      'flex-start',
            gap:             12,
            flexWrap:        'wrap',
            marginBottom:    16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: DARK, letterSpacing: -0.2 }}>
                Order #{order.id}
              </span>
              {isDelivered && (
                <span
                  style={{
                    fontSize:     10,
                    fontWeight:   700,
                    color:        '#15803D',
                    background:   '#F0FDF4',
                    border:       '1px solid #BBF7D0',
                    padding:      '2px 8px',
                    borderRadius: 20,
                  }}
                >
                  COMPLETED
                </span>
              )}
            </div>

            <p style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarIcon />
              {formattedDate}
            </p>
          </div>

          <StatusBadge status={order.status} />
        </div>

        {/* ── Row 2: Product summary strip ── */}
        <div
          style={{
            background:   '#FCFCFC',
            borderRadius: 12,
            border:       '1px solid #F0F0F0',
            padding:      '14px 16px',
            display:      'flex',
            alignItems:   'center',
            gap:          14,
            marginBottom: 18,
          }}
        >
          {/* Thumbnail */}
          <div
            style={{
              width:        60,
              height:       60,
              borderRadius: 10,
              flexShrink:   0,
              background:   imgSrc ? '#F7F4EF' : visual.bg,
              border:       '1px solid #EDE8DE',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              overflow:     'hidden',
              fontSize:     24,
            }}
          >
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={order.product_names || `Order #${order.id}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }}
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span
              aria-hidden="true"
              style={{ display: imgSrc ? 'none' : 'flex', fontSize: 28, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
            >
              {visual.emoji || '🌰'}
            </span>
          </div>

          {/* Product name + quantity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize:     13,
                fontWeight:   700,
                color:        DARK,
                lineHeight:   1.4,
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap',
                marginBottom: 3,
              }}
            >
              {order.product_names || `Order #${order.id}`}
            </p>
            <p style={{ fontSize: 12, color: MUTED }}>
              {order.total_qty
                ? `${order.total_qty} item${Number(order.total_qty) > 1 ? 's' : ''}`
                : '—'}
            </p>
          </div>

          {/* Price */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p
              style={{
                fontSize:     20,
                fontWeight:   800,
                color:        DARK,
                letterSpacing: -0.5,
                lineHeight:   1,
              }}
            >
              ₹{formattedAmount}
            </p>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Total Paid</p>
          </div>
        </div>

        {/* ── Row 3: Progress timeline ── */}
        <Timeline status={order.status} />

        {/* ── Row 4: Action buttons ── */}
        <ActionButtons
          orderId={order.id}
          status={order.status}
          onView={onView}
          onAction={onTrack}
        />

      </div>
    </article>
  );
}
