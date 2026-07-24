/**
 * ProfilePage.jsx  — v5 Premium Sidebar Dashboard
 *
 * Layout:
 *   Desktop → vertical sidebar (240px) + dynamic main content area
 *   Mobile  → horizontal scrollable tab bar replaces sidebar
 *
 * Tabs: Dashboard · My Orders · Addresses · Wishlist · Rewards · Security
 *
 * All styling is CSS-in-JS (inline + account-layout.css tokens).
 * No Tailwind dependency — matches the existing project conventions.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../Components/orders/StatusBadge';
import '../../styles/pages/account-layout.css';
import '../../styles/pages/account-no-sidebar.css';

/* ── Design tokens ─────────────────────────────────────────── */
const GOLD   = '#C9972B';
const GOLD_L = '#F5C842';
const DARK   = '#1A1A1A';
const MUTED  = '#9CA3AF';
const FONT   = "'Inter','DM Sans',system-ui,sans-serif";
const BG     = '#F4F5F7';

/* ── SVG icon set (thin-stroke, 18×18) ─────────────────────── */
const IC = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  orders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  addresses: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  wishlist: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  rewards: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  security: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={GOLD}
      stroke={GOLD} strokeWidth="1.5" strokeLinecap="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  coin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={GOLD} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
};

/* ── Sidebar nav items config ──────────────────────────────── */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard',       icon: IC.dashboard  },
  { key: 'orders',    label: 'My Orders',        icon: IC.orders     },
  { key: 'addresses', label: 'Saved Addresses',  icon: IC.addresses  },
  { key: 'wishlist',  label: 'Wishlist',          icon: IC.wishlist   },
  { key: 'rewards',   label: 'H2B Rewards',       icon: IC.rewards    },
  { key: 'security',  label: 'Security',          icon: IC.security   },
];

/* ═══════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ═══════════════════════════════════════════════════════════════ */

/* Card wrapper */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #EBEBEB',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      padding: 28,
      fontFamily: FONT,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* Section eyebrow + title header */
function SectionHead({ eyebrow, title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        {eyebrow && (
          <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: GOLD,
            textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px' }}>
            {eyebrow}
          </p>
        )}
        <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700,
          color: DARK, margin: 0, letterSpacing: -0.2 }}>
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

/* Alert banner */
function Alert({ msg }) {
  if (!msg) return null;
  const ok = msg.type === 'success';
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10, marginBottom: 18,
      fontSize: 13, fontWeight: 600, fontFamily: FONT,
      background: ok ? '#F0FDF4' : '#FEF2F2',
      color:      ok ? '#15803D' : '#B91C1C',
      border:     `1px solid ${ok ? '#86EFAC' : '#FECACA'}`,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {ok ? '✅' : '❌'} {msg.text}
    </div>
  );
}

/* Floating-label line input */
function Field({ label, id, type = 'text', value, onChange, disabled, hint }) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || Boolean(value);
  return (
    <div style={{ position: 'relative', paddingTop: 20 }}>
      <label htmlFor={id} style={{
        position: 'absolute', left: 0,
        top: isActive ? 0 : 32,
        fontSize: isActive ? 10 : 14,
        fontWeight: isActive ? 700 : 400,
        color: disabled ? MUTED : isActive ? (focused ? GOLD : '#6B7280') : MUTED,
        fontFamily: FONT,
        letterSpacing: isActive ? 0.8 : 0,
        textTransform: isActive ? 'uppercase' : 'none',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: 'none', userSelect: 'none',
      }}>{label}</label>
      <input id={id} type={type} value={value} disabled={disabled}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 0',
          border: 'none',
          borderBottom: `1.5px solid ${focused ? GOLD : disabled ? '#F0F0F0' : '#E5E7EB'}`,
          outline: 'none', fontSize: 14, fontFamily: FONT,
          color: disabled ? MUTED : DARK, background: 'transparent',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.18s ease', boxSizing: 'border-box',
        }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 2, width: focused ? '100%' : '0%',
        background: `linear-gradient(90deg,${GOLD},${GOLD_L})`,
        borderRadius: 2, transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      }} />
      {hint && <p style={{ fontFamily: FONT, fontSize: 11, color: MUTED, marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

/* Gold primary button */
function PrimaryBtn({ children, onClick, type = 'button', disabled, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#E5E7EB' : `linear-gradient(135deg,${GOLD},${GOLD_L})`,
        color: disabled ? MUTED : '#1a0a00',
        fontSize: 13.5, fontWeight: 700,
        padding: '11px 22px',
        boxShadow: hov && !disabled ? `0 6px 20px ${GOLD}55` : `0 2px 8px ${GOLD}30`,
        transform: hov && !disabled ? 'translateY(-1px)' : 'none',
        transition: 'all 0.18s ease',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}>
      {children}
    </button>
  );
}

/* Ghost outlined button */
function GhostBtn({ children, onClick, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, borderRadius: 10, cursor: 'pointer',
        background: hov ? DARK : 'transparent',
        border: `1.5px solid ${hov ? DARK : '#D1D5DB'}`,
        color: hov ? '#fff' : DARK,
        fontSize: 13, fontWeight: 600, padding: '9px 18px',
        transition: 'all 0.18s ease',
        ...style,
      }}>
      {children}
    </button>
  );
}

/* Skeleton shimmer row */
function SkeletonRow({ h = 56 }) {
  return (
    <div style={{
      height: h, borderRadius: 10,
      background: 'linear-gradient(90deg,#F0F0F0 25%,#FAFAFA 50%,#F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'profileSkel 1.5s ease-in-out infinite',
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB PANELS
   ═══════════════════════════════════════════════════════════════ */

/* ── Dashboard ─────────────────────────────────────────────── */
function TabDashboard({ user, avatarUrl, onAvatarChange, onTabChange, navigate }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef();
  const initials = (user.name || user.email || 'C').charAt(0).toUpperCase();

  useEffect(() => {
    api.get('/api/orders?limit=3')
      .then(r => setOrders(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Orders', value: orders.length || '—', icon: IC.orders },
    { label: 'H2B Points',   value: '1,240 pts',          icon: IC.coin   },
    { label: 'Wishlist',     value: '3 items',             icon: IC.wishlist },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Identity hero */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          background: `linear-gradient(135deg,#1a0a00,#3d1a00)`,
          padding: '28px 28px 24px',
          display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow */}
          <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180,
            borderRadius: '50%', background: `radial-gradient(circle,${GOLD}20,transparent 70%)`,
            pointerEvents: 'none' }} />

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
              background: `linear-gradient(135deg,${GOLD},${GOLD_L})`,
              border: `3px solid ${GOLD}50`,
              boxShadow: `0 0 0 4px ${GOLD}18, 0 8px 24px ${GOLD}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#1a0a00', fontFamily: FONT,
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <button onClick={() => ref.current?.click()}
              style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 24, height: 24, borderRadius: '50%',
                background: DARK, color: '#fff', border: '2px solid #fff',
                cursor: 'pointer', fontSize: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = GOLD}
              onMouseLeave={e => e.currentTarget.style.background = DARK}
            >📷</button>
            <input ref={ref} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={onAvatarChange} />
          </div>

          {/* Identity */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
              letterSpacing: 1.6, margin: '0 0 3px' }}>
              Welcome back
            </p>
            <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800,
              color: '#fff', margin: '0 0 8px', letterSpacing: -0.4 }}>
              {user.name || 'Customer'}
            </h2>
            <span style={{
              fontFamily: FONT, fontSize: 10, fontWeight: 700, color: GOLD,
              background: `${GOLD}18`, border: `1px solid ${GOLD}40`,
              padding: '3px 10px', borderRadius: 20, letterSpacing: 0.8,
              textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {IC.star} Premium Member
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          borderTop: '1px solid #F0F0F0',
        }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              padding: '18px 20px', textAlign: 'center',
              borderRight: i < stats.length - 1 ? '1px solid #F0F0F0' : 'none',
            }}>
              <p style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800,
                color: DARK, margin: '0 0 3px' }}>{s.value}</p>
              <p style={{ fontFamily: FONT, fontSize: 11, color: MUTED, margin: 0 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Orders mini */}
      <Card>
        <SectionHead eyebrow="Activity" title="Recent Orders"
          action={
            <GhostBtn onClick={() => onTabChange('orders')}
              style={{ fontSize: 12, padding: '7px 14px' }}>
              View All →
            </GhostBtn>
          } />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>📦</p>
            <p style={{ fontFamily: FONT, fontSize: 13, color: MUTED }}>
              No orders yet
            </p>
            <PrimaryBtn onClick={() => navigate('/home/shop')}
              style={{ marginTop: 14, padding: '9px 20px', fontSize: 12 }}>
              Shop Now →
            </PrimaryBtn>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {orders.map((o, idx) => (
              <div key={o.id}>
                <div onClick={() => navigate(`/home/orders/${o.id}`)}
                  className="order-row"
                  style={{ borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: '#FDF5E8', border: `1px solid ${GOLD}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>🌰</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600,
                      color: DARK, overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', margin: 0 }}>
                      {o.product_names || `Order #${o.id}`}
                    </p>
                    <p style={{ fontFamily: FONT, fontSize: 11, color: MUTED, margin: '2px 0 0' }}>
                      {new Date(o.created_at).toLocaleDateString('en-IN',
                        { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800,
                      color: DARK, margin: 0 }}>
                      ₹{Number(o.total_amount).toLocaleString('en-IN')}
                    </p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                {idx < orders.length - 1 && (
                  <div style={{ height: 1, background: '#F5F5F5', margin: '0 14px' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── My Orders tab ─────────────────────────────────────────── */
function TabOrders({ navigate }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(() => {
    setLoading(true); setError(null);
    api.get('/api/orders?limit=50')
      .then(r  => setOrders(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return (
    <Card>
      <SectionHead eyebrow="Orders" title="My Orders" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1,2,3,4].map(i => <SkeletonRow key={i} h={64} />)}
      </div>
    </Card>
  );

  if (error) return (
    <Card>
      <SectionHead eyebrow="Orders" title="My Orders" />
      <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: FONT, fontSize: 13, color: '#B91C1C' }}>❌ {error}</span>
        <GhostBtn onClick={fetch} style={{ fontSize: 12, padding: '7px 14px' }}>Retry</GhostBtn>
      </div>
    </Card>
  );

  return (
    <Card>
      <SectionHead eyebrow="Orders" title={`My Orders (${orders.length})`} />
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
          <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700,
            color: DARK, marginBottom: 8 }}>No orders yet</h3>
          <p style={{ fontFamily: FONT, fontSize: 13, color: MUTED, marginBottom: 20 }}>
            Place your first order and it will appear here.
          </p>
          <PrimaryBtn onClick={() => navigate('/home/shop')}>Shop Now →</PrimaryBtn>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
                {['Order', 'Items', 'Date', 'Amount', 'Status', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: MUTED,
                    textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id}
                  style={{ borderBottom: i < orders.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700,
                      color: DARK }}>#{o.id}</span>
                  </td>
                  <td style={{ padding: '14px 12px', maxWidth: 180 }}>
                    <span style={{ fontFamily: FONT, fontSize: 13, color: DARK,
                      display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' }}>
                      {o.product_names || '—'}
                    </span>
                    {o.total_qty && (
                      <span style={{ fontFamily: FONT, fontSize: 11, color: MUTED }}>
                        {o.total_qty} item{Number(o.total_qty) > 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: MUTED }}>
                      {new Date(o.created_at).toLocaleDateString('en-IN',
                        { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: DARK }}>
                      ₹{Number(o.total_amount).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <button onClick={() => navigate(`/home/orders/${o.id}`)}
                      style={{ fontFamily: FONT, background: 'none', border: 'none',
                        color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        padding: 0, whiteSpace: 'nowrap' }}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ── Saved Addresses tab ───────────────────────────────────── */
function TabAddresses() {
  const [addresses, setAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saved_addresses') || '[]'); }
    catch { return []; }
  });
  const [adding,  setAdding]  = useState(false);
  const [newAddr, setNewAddr] = useState('');

  const save = () => {
    if (!newAddr.trim()) return;
    const updated = [...addresses,
      { id: Date.now(), text: newAddr.trim(), isDefault: addresses.length === 0 }];
    setAddresses(updated);
    localStorage.setItem('saved_addresses', JSON.stringify(updated));
    setNewAddr(''); setAdding(false);
  };
  const remove = id => {
    const updated = addresses.filter(a => a.id !== id);
    localStorage.setItem('saved_addresses', JSON.stringify(updated));
    setAddresses(updated);
  };
  const setDefault = id => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    localStorage.setItem('saved_addresses', JSON.stringify(updated));
    setAddresses(updated);
  };

  return (
    <Card>
      <SectionHead eyebrow="Delivery" title="Saved Addresses"
        action={
          <PrimaryBtn onClick={() => setAdding(v => !v)}
            style={{ fontSize: 12, padding: '8px 16px' }}>
            {adding ? 'Cancel' : '+ Add New'}
          </PrimaryBtn>
        } />

      {/* Add form */}
      {adding && (
        <div style={{ background: '#FAFAFA', borderRadius: 14, padding: 20,
          border: '1px solid #EBEBEB', marginBottom: 20 }}>
          <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700,
            color: GOLD, display: 'block', marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: 1 }}>
            Delivery Address
          </label>
          <textarea value={newAddr} onChange={e => setNewAddr(e.target.value)}
            placeholder="Street, Area, City, State, Pincode" rows={3}
            style={{ width: '100%', padding: '10px 0',
              border: 'none', borderBottom: '1.5px solid #E5E7EB',
              fontSize: 13, outline: 'none', fontFamily: FONT,
              resize: 'vertical', boxSizing: 'border-box', background: 'transparent' }} />
          <PrimaryBtn onClick={save} style={{ marginTop: 14, fontSize: 13, padding: '9px 20px' }}>
            Save Address
          </PrimaryBtn>
        </div>
      )}

      {addresses.length === 0 && !adding ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>📍</p>
          <p style={{ fontFamily: FONT, fontSize: 14, color: MUTED }}>
            No saved addresses. Add one for faster checkout.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {addresses.map(a => (
            <div key={a.id} style={{
              padding: '18px 20px', borderRadius: 14,
              background: a.isDefault ? `${GOLD}06` : '#FAFAFA',
              border: `1px solid ${a.isDefault ? GOLD + '35' : '#EBEBEB'}`,
              display: 'flex', flexDirection: 'column', gap: 10,
              transition: 'all 0.15s ease',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: a.isDefault ? `${GOLD}15` : '#EBEBEB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: a.isDefault ? GOLD : MUTED,
                }}>{IC.addresses}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: DARK,
                    margin: 0, lineHeight: 1.65 }}>{a.text}</p>
                  {a.isDefault && (
                    <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700,
                      color: GOLD, background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
                      padding: '2px 8px', borderRadius: 20, marginTop: 5,
                      display: 'inline-block', textTransform: 'uppercase',
                      letterSpacing: 0.5 }}>Default</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F0F0F0', paddingTop: 10 }}>
                {!a.isDefault && (
                  <GhostBtn onClick={() => setDefault(a.id)}
                    style={{ flex: 1, fontSize: 11, padding: '6px 10px',
                      borderColor: `${GOLD}50`, color: GOLD }}>
                    Set Default
                  </GhostBtn>
                )}
                <button onClick={() => remove(a.id)} style={{
                  flex: 1, fontFamily: FONT, background: 'none',
                  border: '1px solid #FECACA', color: '#DC2626', borderRadius: 8,
                  padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Wishlist tab ───────────────────────────────────────────── */
function TabWishlist({ navigate }) {
  return (
    <Card>
      <SectionHead eyebrow="Saved Items" title="My Wishlist" />
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>❤️</p>
        <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700,
          color: DARK, marginBottom: 8 }}>Your wishlist is empty</h3>
        <p style={{ fontFamily: FONT, fontSize: 13, color: MUTED, marginBottom: 20 }}>
          Save products you love to purchase them later.
        </p>
        <PrimaryBtn onClick={() => navigate('/home/shop')}>Browse Products →</PrimaryBtn>
      </div>
    </Card>
  );
}

/* ── Rewards tab ────────────────────────────────────────────── */
function TabRewards() {
  const tiers = [
    { name: 'Silver',   min: 0,    max: 999,  color: '#94A3B8' },
    { name: 'Gold',     min: 1000, max: 2999, color: GOLD      },
    { name: 'Platinum', min: 3000, max: 9999, color: '#6366F1' },
  ];
  const points = 1240;
  const currentTier = tiers.find(t => points >= t.min && points <= t.max) || tiers[0];

  const history = [
    { desc: 'Purchase – W320 Cashew 1kg', pts: '+50',  date: '12 Jun 2025', color: '#15803D' },
    { desc: 'Purchase – Roasted Cashew',  pts: '+30',  date: '28 May 2025', color: '#15803D' },
    { desc: 'Redeemed for discount',      pts: '-100', date: '10 May 2025', color: '#B91C1C' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Balance card */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          background: `linear-gradient(135deg,#1a0a00,#3d1a00)`,
          padding: '28px 28px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 4px' }}>
              Your H2B Points
            </p>
            <p style={{ fontFamily: FONT, fontSize: 40, fontWeight: 800,
              color: GOLD_L, margin: '0 0 8px', letterSpacing: -1 }}>
              {points.toLocaleString()}
            </p>
            <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700,
              color: currentTier.color, background: `${currentTier.color}20`,
              border: `1px solid ${currentTier.color}40`,
              padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
              letterSpacing: 0.8 }}>
              {currentTier.name} Member
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>
              Next tier in
            </p>
            <p style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800,
              color: '#fff', margin: 0 }}>
              {(currentTier.max + 1 - points).toLocaleString()} pts
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT, fontSize: 11, color: MUTED }}>
              {currentTier.name} — {currentTier.min.toLocaleString()} pts
            </span>
            <span style={{ fontFamily: FONT, fontSize: 11, color: MUTED }}>
              Next: {(currentTier.max + 1).toLocaleString()} pts
            </span>
          </div>
          <div style={{ height: 6, background: '#F0F0F0', borderRadius: 6 }}>
            <div style={{
              height: '100%', borderRadius: 6,
              width: `${Math.min(((points - currentTier.min) / (currentTier.max - currentTier.min)) * 100, 100)}%`,
              background: `linear-gradient(90deg,${GOLD},${GOLD_L})`,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </Card>

      {/* History */}
      <Card>
        <SectionHead eyebrow="History" title="Points Activity" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {history.map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px', borderRadius: 10,
              borderBottom: i < history.length - 1 ? '1px solid #F5F5F5' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: FONT, fontSize: 13, color: DARK,
                  margin: 0, fontWeight: 500 }}>{h.desc}</p>
                <p style={{ fontFamily: FONT, fontSize: 11, color: MUTED, margin: '2px 0 0' }}>
                  {h.date}
                </p>
              </div>
              <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: h.color }}>
                {h.pts}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Security tab ───────────────────────────────────────────── */
function TabSecurity({ user, navigate }) {
  const [form,   setForm]   = useState({
    name: user.name || '', email: user.email || '', mobile: user.mobile || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState(null);

  const [pw,     setPw]     = useState({ current: '', newPw: '', confirm: '' });
  const [savPw,  setSavPw]  = useState(false);
  const [pwMsg,  setPwMsg]  = useState(null);

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      await api.put(`/api/customers/${user.id}`,
        { name: form.name.trim(), mobile: form.mobile.trim() });
      const updated = { ...user, name: form.name.trim(), mobile: form.mobile.trim() };
      localStorage.setItem('user', JSON.stringify(updated));
      setMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally { setSaving(false); }
  };

  const handlePw = async e => {
    e.preventDefault();
    if (pw.newPw !== pw.confirm) { setPwMsg({ type:'error', text:'Passwords do not match.' }); return; }
    if (pw.newPw.length < 6)    { setPwMsg({ type:'error', text:'Minimum 6 characters.' }); return; }
    setSavPw(true); setPwMsg(null);
    try {
      await api.put(`/api/customers/${user.id}/password`,
        { current_password: pw.current, new_password: pw.newPw });
      setPwMsg({ type:'success', text:'Password updated.' });
      setPw({ current:'', newPw:'', confirm:'' });
    } catch (err) {
      setPwMsg({ type:'error', text: err.response?.data?.message || 'Failed.' });
    } finally { setSavPw(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Account Settings */}
      <Card>
        <SectionHead eyebrow="Account" title="Personal Information" />
        <Alert msg={msg} />
        <form onSubmit={handleSave}
          style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px 32px' }}
            className="security-form-grid">
            <Field label="Full Name" id="s-name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
            <Field label="Mobile Number" id="s-mobile" type="tel" value={form.mobile}
              onChange={e => setForm({ ...form, mobile: e.target.value })} />
            <Field label="Email Address" id="s-email" type="email" value={form.email}
              disabled hint="Email cannot be changed" />
          </div>
          <div>
            <PrimaryBtn type="submit" disabled={saving}
              style={{ padding: '12px 28px', fontSize: 14 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </PrimaryBtn>
          </div>
        </form>
      </Card>

      {/* Password */}
      <Card>
        <SectionHead eyebrow="Security" title="Change Password" />
        <Alert msg={pwMsg} />
        <form onSubmit={handlePw}
          style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px 32px' }}
            className="security-form-grid">
            <Field label="Current Password" id="s-cur" type="password"
              value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} />
            <Field label="New Password" id="s-new" type="password"
              value={pw.newPw} onChange={e => setPw({ ...pw, newPw: e.target.value })} />
            <Field label="Confirm New Password" id="s-con" type="password"
              value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} />
          </div>
          <div>
            <PrimaryBtn type="submit" disabled={savPw}
              style={{ padding: '12px 28px', fontSize: 14 }}>
              {savPw ? 'Updating…' : 'Update Password'}
            </PrimaryBtn>
          </div>
        </form>
      </Card>

      {/* Danger zone */}
      <Card>
        <SectionHead eyebrow="Session" title="Sign Out" />
        <p style={{ fontFamily: FONT, fontSize: 13, color: MUTED, marginBottom: 18 }}>
          You will be signed out from all active sessions on this device.
        </p>
        <GhostBtn onClick={handleLogout}
          style={{ borderColor: '#FECACA', color: '#DC2626' }}>
          {IC.logout}
          <span style={{ marginLeft: 8 }}>Sign Out</span>
        </GhostBtn>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════ */
function Sidebar({ active, onChange, user, avatarUrl, onLogout }) {
  const initials = (user.name || user.email || 'C').charAt(0).toUpperCase();

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #EBEBEB',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      alignSelf: 'flex-start',
      position: 'sticky',
      top: 96,           /* clears fixed 72px header + 24px gap */
      fontFamily: FONT,
    }}>

      {/* User hero */}
      <div style={{
        background: 'linear-gradient(150deg,#1a0a00,#3d1a00)',
        padding: '22px 20px 18px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{ position:'absolute', top:-30, left:'50%', transform:'translateX(-50%)',
          width:120, height:120, borderRadius:'50%',
          background:`radial-gradient(circle,${GOLD}20,transparent 70%)`,
          pointerEvents:'none' }} />

        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
          background: `linear-gradient(135deg,${GOLD},${GOLD_L})`,
          border: `3px solid ${GOLD}50`,
          boxShadow: `0 0 0 4px ${GOLD}18, 0 6px 20px ${GOLD}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, color: '#1a0a00', overflow: 'hidden',
          position: 'relative', zIndex: 1,
        }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar"
                style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : initials}
        </div>

        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700,
          color: '#fff', margin: '0 0 2px', letterSpacing: -0.1,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          position:'relative', zIndex:1 }}>
          {user.name || 'Customer'}
        </p>
        <p style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(255,255,255,0.45)',
          margin: '0 0 10px', whiteSpace:'nowrap', overflow:'hidden',
          textOverflow:'ellipsis', position:'relative', zIndex:1 }}>
          {user.email}
        </p>
        <span style={{
          fontFamily: FONT, fontSize: 9, fontWeight: 800, color: GOLD,
          background: `${GOLD}18`, border: `1px solid ${GOLD}40`,
          padding: '3px 10px', borderRadius: 20, letterSpacing: 1,
          textTransform: 'uppercase', position: 'relative', zIndex: 1,
        }}>⭐ Premium Member</span>
      </div>

      {/* Nav links */}
      <nav style={{ padding: '10px 0 6px' }} aria-label="Account navigation">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.key;
          return (
            <button key={item.key}
              onClick={() => onChange(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                width: '100%', padding: '11px 18px',
                background: isActive ? `${GOLD}10` : 'none',
                border: 'none',
                borderLeft: `3px solid ${isActive ? GOLD : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: FONT, fontSize: 13.5,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? GOLD : '#4A4A4A',
                textAlign: 'left', lineHeight: 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = '#FDF8F0';
                  e.currentTarget.style.color = DARK;
                  e.currentTarget.style.paddingLeft = '22px';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#4A4A4A';
                  e.currentTarget.style.paddingLeft = '18px';
                }
              }}
            >
              <span style={{ color: isActive ? GOLD : MUTED, flexShrink: 0,
                transition: 'color 0.15s' }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ height: 1, background: '#F0F0F0', margin: '8px 16px' }} />

        {/* Logout */}
        <button onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 11,
            width: '100%', padding: '11px 18px',
            background: 'none', border: 'none', borderLeft: '3px solid transparent',
            cursor: 'pointer', fontFamily: FONT, fontSize: 13.5,
            fontWeight: 500, color: '#DC2626', textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.paddingLeft = '22px'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.paddingLeft = '18px'; }}
        >
          <span style={{ color: '#DC2626', flexShrink: 0 }}>{IC.logout}</span>
          Sign Out
        </button>
      </nav>
    </aside>
  );
}

/* ── Mobile horizontal tab bar (≤ 900px) ──────────────────── */
function MobileTabs({ active, onChange }) {
  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #EBEBEB',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      overflowX: 'auto', whiteSpace: 'nowrap',
      scrollbarWidth: 'none',
      fontFamily: FONT,
    }}>
      <style>{`.mobile-tabs::-webkit-scrollbar{display:none}`}</style>
      <div className="mobile-tabs" style={{
        display: 'inline-flex', padding: '0 16px', gap: 2,
        minWidth: '100%',
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.key;
          return (
            <button key={item.key}
              onClick={() => onChange(item.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '14px 14px 12px',
                background: 'none', border: 'none',
                borderBottom: `3px solid ${isActive ? GOLD : 'transparent'}`,
                cursor: 'pointer', fontFamily: FONT,
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? GOLD : MUTED,
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <span style={{ color: isActive ? GOLD : MUTED, flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const [tab,     setTab]      = useState('dashboard');
  const [avatarUrl, setAvatar] = useState(
    () => localStorage.getItem('avatar_url') || ''
  );

  const handleAvatarChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      setAvatar(url);
      localStorage.setItem('avatar_url', url);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  /* Render the active tab panel */
  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return (
        <TabDashboard user={user} avatarUrl={avatarUrl}
          onAvatarChange={handleAvatarChange}
          onTabChange={setTab} navigate={navigate} />
      );
      case 'orders':    return <TabOrders    navigate={navigate} />;
      case 'addresses': return <TabAddresses />;
      case 'wishlist':  return <TabWishlist  navigate={navigate} />;
      case 'rewards':   return <TabRewards   />;
      case 'security':  return <TabSecurity  user={user} navigate={navigate} />;
      default:          return null;
    }
  };

  const currentLabel = NAV_ITEMS.find(n => n.key === tab)?.label || 'Dashboard';

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT }}>

      {/* ── Keyframe for skeleton shimmer ── */}
      <style>{`
        @keyframes profileSkel {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        /* Mobile nav shown below 900px */
        .profile-mobile-nav  { display: none; }
        .profile-sidebar     { display: flex; }
        @media (max-width: 900px) {
          .profile-sidebar     { display: none !important; }
          .profile-mobile-nav  { display: block !important; }
          .profile-layout      { display: block !important; }
          .profile-main        { margin-top: 20px; }
        }
        /* Security form — 2-col → 1-col on small screens */
        .security-form-grid {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 640px) {
          .security-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Mobile horizontal tab bar */}
      <div className="profile-mobile-nav">
        <MobileTabs active={tab} onChange={setTab} />
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1100, margin: '0 auto',
        padding: 'clamp(16px,3vw,32px) clamp(16px,3vw,32px) 80px' }}>

        {/* Page heading */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: GOLD,
            textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px' }}>
            My Account
          </p>
          <h1 style={{ fontFamily: FONT, fontSize: 'clamp(20px,3vw,26px)',
            fontWeight: 800, color: DARK, margin: 0, letterSpacing: -0.5 }}>
            {currentLabel}
          </h1>
        </div>

        {/* Sidebar + main content */}
        <div className="profile-layout"
          style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Sidebar — desktop only */}
          <div className="profile-sidebar">
            <Sidebar
              active={tab}
              onChange={setTab}
              user={user}
              avatarUrl={avatarUrl}
              onLogout={handleLogout}
            />
          </div>

          {/* Main content */}
          <main className="profile-main" style={{ flex: 1, minWidth: 0 }}>
            {renderTab()}
          </main>

        </div>
      </div>
    </div>
  );
}
