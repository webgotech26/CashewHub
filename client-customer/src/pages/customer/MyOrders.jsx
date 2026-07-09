/**
 * MyOrders.jsx  — v3 Premium Spacious
 * Order History page — horizontal top-nav, no sidebar.
 *
 * Layout:  account-no-sidebar.css  (max-width 1000px, 32px cards)
 * Cards:   <OrderCard>             ← components/orders/OrderCard.jsx
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import OrderCard from '../../components/orders/OrderCard';
import { GOLD, DARK, MUTED, FONT } from '../../components/orders/tokens';
import '../../styles/pages/account-layout.css';
import '../../styles/pages/account-no-sidebar.css';

/* ── Horizontal tab-nav (mirrors ProfilePage) ──────────────────── */
function AccountNav({ active, navigate }) {
  const tabs = [
    {
      key: 'orders', label: 'My Orders', path: '/home/orders',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
    {
      key: 'profile', label: 'My Profile', path: '/home/profile',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      key: 'shop', label: 'Shop', path: '/home/shop',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      ),
    },
  ];

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  
}

/* ── Skeleton loading card ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div aria-busy="true" aria-label="Loading order…" className="acct-ns-card">
      {[['38%', 18], ['24%', 12], ['100%', 76], ['60%', 12]].map(([w, h], i) => (
        <div key={i} className="skeleton"
          style={{ height: h, width: w, marginBottom: 16 }} />
      ))}
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────── */
function EmptyState({ onShop }) {
  return (
    <div className="acct-ns-card"
      style={{ textAlign: 'center', padding: '72px 40px' }}>
      <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 28px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `linear-gradient(135deg, ${GOLD}18, ${GOLD}30)`,
          boxShadow: `0 8px 32px ${GOLD}22`,
        }} />
        <div style={{
          position: 'absolute', inset: 12, borderRadius: '50%',
          background: `linear-gradient(135deg, ${GOLD}25, ${GOLD}45)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38,
        }}>📦</div>
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, color: DARK,
        marginBottom: 10, fontFamily: FONT }}>
        No orders yet
      </h2>
      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7,
        maxWidth: 320, margin: '0 auto 32px', fontFamily: FONT }}>
        Browse our premium cashew collection and place your first order.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center',
        gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {['🚚 Free delivery above ₹499', '🌿 No preservatives', '📦 Fresh packed'].map(f => (
          <span key={f} style={{
            fontFamily: FONT, fontSize: 12, fontWeight: 600, color: '#4A4A4A',
            background: '#F5F5F5', border: '1px solid #EBEBEB',
            padding: '5px 12px', borderRadius: 20,
          }}>{f}</span>
        ))}
      </div>

      <button onClick={onShop} style={{
        fontFamily: FONT,
        background: `linear-gradient(135deg, ${GOLD}, #F5C842)`,
        color: '#1a0a00', border: 'none', borderRadius: 30,
        padding: '13px 36px', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', boxShadow: `0 6px 20px ${GOLD}40`,
        letterSpacing: 0.3,
      }}>
        Shop Premium Cashews →
      </button>
    </div>
  );
}

/* ── MyOrders page ─────────────────────────────────────────────── */
export default function MyOrders() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const avatarUrl = localStorage.getItem('avatar_url') || '';
  const initials  = (user.name || user.email || 'C').charAt(0).toUpperCase();

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/api/orders?limit=50')
      .then(r   => setOrders(r.data.data || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="acct-ns-page">

     

      {/* ── Horizontal nav ── */}
      <AccountNav active="orders" navigate={navigate} />

      {/* ── Content ── */}
      <div className="acct-ns-wrap">
        <div className="acct-ns-content">

          {/* Section header */}
          <div className="acct-ns-section-head">
            <h2 className="acct-ns-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Order History
            </h2>
            {!loading && orders.length > 0 && (
              <span className="acct-ns-section-count">
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div role="alert" style={{
              background: '#FEF2F2', color: '#B91C1C',
              border: '1px solid #FECACA', borderRadius: 12,
              padding: '14px 20px', fontSize: 13, fontFamily: FONT,
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12,
              flexWrap: 'wrap', marginBottom: 20,
            }}>
              <span>❌ {error}</span>
              <button onClick={fetchOrders} style={{
                background: '#B91C1C', color: '#fff', border: 'none',
                borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: FONT,
              }}>Retry</button>
            </div>
          )}

          {/* Skeletons */}
          {loading && (
            <div className="acct-ns-order-list">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && orders.length === 0 && (
            <EmptyState onShop={() => navigate('/home/shop')} />
          )}

          {/* Order cards — full width */}
          {!loading && orders.length > 0 && (
            <div className="acct-ns-order-list">
              {orders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={id  => navigate(`/home/orders/${id}`)}
                  onTrack={id => navigate(`/home/orders/${id}`)}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
