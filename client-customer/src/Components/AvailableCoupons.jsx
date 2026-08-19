/**
 * AvailableCoupons.jsx
 *
 * Collapsible panel shown in Checkout that lists all active coupons.
 * Clicking a coupon card auto-fills the coupon input and triggers
 * validation via the onApply callback.
 *
 * Props:
 *   orderTotal   {number}  — current order total (pre-coupon) for eligibility check
 *   onApply      {(code: string) => void}  — called with the coupon code to apply
 *   appliedCode  {string|null}             — currently applied code (for highlighting)
 */
import { useEffect, useState } from 'react';
import api from '../services/api';

/* ── helpers ──────────────────────────────────────────────────── */
function formatDiscount(coupon) {
  if (coupon.discount_type === 'percentage') {
    return `${Number(coupon.discount_value).toFixed(0)}% OFF`;
  }
  return `₹${Number(coupon.discount_value).toFixed(0)} OFF`;
}

function formatMinSpend(coupon) {
  if (!coupon.min_order_amount || Number(coupon.min_order_amount) <= 0) return null;
  return `Min. order ₹${Number(coupon.min_order_amount).toLocaleString('en-IN')}`;
}

function formatExpiry(coupon) {
  if (!coupon.expiry_date) return null;
  const d = new Date(coupon.expiry_date);
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return null; // already expired — backend filters but just in case
  if (diffDays === 1) return 'Expires today';
  if (diffDays <= 7) return `Expires in ${diffDays} days`;
  return `Valid till ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function isEligible(coupon, orderTotal) {
  if (!coupon.min_order_amount) return true;
  return orderTotal >= Number(coupon.min_order_amount);
}

/* ── badge accent colours ─────────────────────────────────────── */
const BADGE_COLORS = [
  { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', tag: '#D97706' },
  { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', tag: '#059669' },
  { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E3A8A', tag: '#2563EB' },
  { bg: '#FDF4FF', border: '#E9D5FF', text: '#6B21A8', tag: '#7C3AED' },
  { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412', tag: '#EA580C' },
];

function colorForIndex(i) {
  return BADGE_COLORS[i % BADGE_COLORS.length];
}

/* ── Skeleton card ────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      border: '1.5px solid #F0F0F0', borderRadius: 12,
      padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center',
      background: '#FAFAFA',
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, background: '#EBEBEB',
        animation: 'ac-shimmer 1.4s infinite', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, width: '55%', borderRadius: 6, background: '#EBEBEB',
          animation: 'ac-shimmer 1.4s infinite' }} />
        <div style={{ height: 11, width: '35%', borderRadius: 6, background: '#EBEBEB',
          animation: 'ac-shimmer 1.4s 0.2s infinite' }} />
      </div>
      <div style={{ width: 60, height: 30, borderRadius: 8, background: '#EBEBEB',
        animation: 'ac-shimmer 1.4s infinite', flexShrink: 0 }} />
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */
export default function AvailableCoupons({ orderTotal = 0, onApply, appliedCode = null }) {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open,    setOpen]      = useState(false);
  const [copied,  setCopied]    = useState(null); // code that was just copied

  useEffect(() => {
    api.get('/api/coupons/active')
      .then(r => setCoupons(r.data.data || []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, []);

  const handleApply = (code) => {
    if (typeof onApply === 'function') onApply(code);
  };

  const handleCopy = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  // Nothing to show while loading the count
  const eligibleCount = coupons.filter(c => isEligible(c, orderTotal)).length;

  return (
    <div style={{ marginBottom: 4 }}>
      <style>{`
        @keyframes ac-shimmer {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.45; }
        }
        @keyframes ac-slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ac-card:hover { border-color: #C9972B !important; }
        .ac-apply-btn:hover { background: #C9972B !important; color: #1a0a00 !important; }
      `}</style>

      {/* ── Trigger row ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px',
          borderRadius: 12,
          border: `1.5px solid ${open ? '#C9972B' : '#E7E2D9'}`,
          background: open ? '#FDF8F0' : '#FAFAF8',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🎟️</span>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1917', display: 'block' }}>
              Available Coupons
            </span>
            {!loading && coupons.length > 0 && (
              <span style={{ fontSize: 11, color: '#78716C', display: 'block', marginTop: 1 }}>
                {eligibleCount > 0
                  ? `${eligibleCount} coupon${eligibleCount !== 1 ? 's' : ''} applicable on your order`
                  : `${coupons.length} coupon${coupons.length !== 1 ? 's' : ''} available`}
              </span>
            )}
            {!loading && coupons.length === 0 && (
              <span style={{ fontSize: 11, color: '#9CA3AF', display: 'block', marginTop: 1 }}>
                No active coupons right now
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!loading && coupons.length > 0 && (
            <span style={{
              background: '#FEF3C7', border: '1px solid #FDE68A',
              color: '#92400E', fontSize: 10, fontWeight: 800,
              padding: '2px 8px', borderRadius: 20,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {coupons.length} offers
            </span>
          )}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#78716C" strokeWidth="2.2" strokeLinecap="round"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease', flexShrink: 0,
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* ── Collapsible panel ── */}
      {open && (
        <div style={{
          border: '1.5px solid #E7E2D9',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          background: '#fff',
          padding: '4px 0 12px',
          animation: 'ac-slide-down 0.22s ease',
        }}>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Empty state */}
          {!loading && coupons.length === 0 && (
            <div style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎫</div>
              <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>
                No active coupons right now
              </p>
              <p style={{ fontSize: 12, color: '#A8A29E', marginTop: 4 }}>
                Check back soon for discount offers!
              </p>
            </div>
          )}

          {/* Coupon cards */}
          {!loading && coupons.length > 0 && (
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {coupons.map((coupon, i) => {
                const c         = colorForIndex(i);
                const eligible  = isEligible(coupon, orderTotal);
                const isApplied = appliedCode === coupon.code;
                const expiry    = formatExpiry(coupon);
                const minSpend  = formatMinSpend(coupon);

                return (
                  <div
                    key={coupon.id}
                    className="ac-card"
                    style={{
                      border: `1.5px solid ${isApplied ? '#22C55E' : eligible ? c.border : '#E5E5E5'}`,
                      borderRadius: 12,
                      background: isApplied ? '#F0FDF4' : eligible ? c.bg : '#FAFAFA',
                      padding: '0',
                      overflow: 'hidden',
                      opacity: eligible ? 1 : 0.6,
                      transition: 'border-color 0.18s ease',
                      cursor: eligible ? 'pointer' : 'default',
                    }}
                    onClick={() => eligible && !isApplied && handleApply(coupon.code)}
                  >
                    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 72 }}>

                      {/* Left accent bar + discount badge */}
                      <div style={{
                        width: 72, flexShrink: 0,
                        background: isApplied
                          ? 'linear-gradient(135deg,#16A34A,#22C55E)'
                          : eligible
                            ? `linear-gradient(135deg,${c.tag},${c.tag}cc)`
                            : 'linear-gradient(135deg,#9CA3AF,#D1D5DB)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 2,
                        padding: '10px 6px',
                        position: 'relative',
                      }}>
                        {/* Notch effect */}
                        <div style={{
                          position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                          width: 16, height: 16, borderRadius: '50%',
                          background: '#fff', border: '1.5px solid #E7E2D9',
                          zIndex: 1,
                        }} />
                        <span style={{ fontSize: 20, lineHeight: 1 }}>
                          {isApplied ? '✅' : coupon.discount_type === 'percentage' ? '💰' : '🎁'}
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 900, color: '#fff',
                          lineHeight: 1, textAlign: 'center',
                          textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        }}>
                          {coupon.discount_type === 'percentage'
                            ? `${Number(coupon.discount_value).toFixed(0)}%`
                            : `₹${Number(coupon.discount_value).toFixed(0)}`}
                        </span>
                        <span style={{
                          fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>OFF</span>
                      </div>

                      {/* Right: code + details */}
                      <div style={{
                        flex: 1, padding: '10px 14px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
                      }}>
                        {/* Code row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 15, fontWeight: 800, color: isApplied ? '#15803D' : c.text,
                            letterSpacing: 1, fontFamily: 'monospace',
                          }}>
                            {coupon.code}
                          </span>
                          {/* Copy button */}
                          <button
                            type="button"
                            onClick={e => handleCopy(coupon.code, e)}
                            title="Copy code"
                            style={{
                              background: 'none', border: `1px solid ${c.border}`,
                              borderRadius: 5, padding: '2px 7px',
                              cursor: 'pointer', fontSize: 10, fontWeight: 700,
                              color: c.text, fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 3,
                              transition: 'all 0.15s',
                            }}
                          >
                            {copied === coupon.code ? '✓ Copied' : '⎘ Copy'}
                          </button>
                          {isApplied && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: '#15803D',
                              background: '#DCFCE7', border: '1px solid #BBF7D0',
                              padding: '2px 8px', borderRadius: 20,
                              textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>Applied</span>
                          )}
                        </div>

                        {/* Description line */}
                        <p style={{ fontSize: 12, color: '#44403C', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                          {formatDiscount(coupon)}
                          {minSpend ? ` · ${minSpend}` : ''}
                        </p>

                        {/* Expiry + eligibility row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {expiry && (
                            <span style={{ fontSize: 10, color: '#78716C', fontWeight: 500 }}>
                              🕐 {expiry}
                            </span>
                          )}
                          {!eligible && minSpend && (
                            <span style={{
                              fontSize: 10, fontWeight: 600, color: '#9A3412',
                              background: '#FEF2F2', border: '1px solid #FECACA',
                              padding: '1px 7px', borderRadius: 20,
                            }}>
                              Add ₹{(Number(coupon.min_order_amount) - orderTotal).toLocaleString('en-IN')} more to unlock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Apply button */}
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        padding: '10px 14px 10px 0', flexShrink: 0,
                      }}>
                        {isApplied ? (
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#DCFCE7', border: '1.5px solid #86EFAC',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16,
                          }}>✓</div>
                        ) : eligible ? (
                          <button
                            type="button"
                            className="ac-apply-btn"
                            onClick={e => { e.stopPropagation(); handleApply(coupon.code); }}
                            style={{
                              padding: '7px 14px', borderRadius: 8,
                              border: `1.5px solid ${c.tag}`,
                              background: 'transparent',
                              color: c.tag,
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'all 0.18s',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Apply
                          </button>
                        ) : (
                          <span style={{
                            fontSize: 10, color: '#9CA3AF', fontWeight: 600,
                            padding: '6px 10px', borderRadius: 8,
                            border: '1px solid #E5E5E5',
                            textAlign: 'center', lineHeight: 1.4,
                          }}>
                            Not<br />eligible
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer note */}
          {!loading && coupons.length > 0 && (
            <p style={{
              fontSize: 11, color: '#A8A29E', textAlign: 'center',
              margin: '4px 14px 0', lineHeight: 1.5,
            }}>
              Only one coupon can be applied per order. Click "Apply" to use a code.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
