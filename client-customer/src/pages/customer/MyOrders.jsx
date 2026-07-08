import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_COLORS = {
  pending:    { bg: '#FEF9C3', color: '#A16207', label: 'Pending'    },
  confirmed:  { bg: '#DBEAFE', color: '#1D4ED8', label: 'Confirmed'  },
  processing: { bg: '#EDE9FE', color: '#6D28D9', label: 'Processing' },
  shipped:    { bg: '#E0F2FE', color: '#0369A1', label: 'Shipped'    },
  delivered:  { bg: '#DCFCE7', color: '#15803D', label: 'Delivered'  },
  cancelled:  { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled'  },
};

const STEP_ICONS = { pending:'🕐', confirmed:'✅', processing:'📦', shipped:'🚚', delivered:'🎉' };

function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] || { bg: '#F3F4F6', color: '#6B7280', label: status };
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
    }}>
      {style.label}
    </span>
  );
}

function OrderTracker({ status }) {
  if (status === 'cancelled') return (
    <div style={{ padding:'10px 0', display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:16 }}>❌</span>
      <span style={{ fontSize:13, color:'#B91C1C', fontWeight:600 }}>Order Cancelled</span>
    </div>
  );

  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div style={{ padding:'12px 0 4px' }}>
      <div style={{ display:'flex', alignItems:'center' }}>
        {STATUS_STEPS.map((step, i) => (
          <div key={step} style={{ display:'flex', alignItems:'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: i <= currentIdx ? 'linear-gradient(135deg,#C9972B,#F5C842)' : '#F0F0F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, border: i === currentIdx ? '3px solid #C9972B' : '3px solid transparent',
                boxShadow: i === currentIdx ? '0 0 0 3px rgba(201,151,43,0.2)' : 'none',
                transition: 'all 0.3s',
              }}>
                {i <= currentIdx ? STEP_ICONS[step] : <span style={{ fontSize:10, color:'#9CA3AF', fontWeight:700 }}>{i+1}</span>}
              </div>
              <span style={{ fontSize:9, fontWeight:600, color: i <= currentIdx ? '#C9972B' : '#9CA3AF',
                textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>
                {STATUS_COLORS[step]?.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ flex:1, height:3, borderRadius:2, marginBottom:18,
                background: i < currentIdx ? 'linear-gradient(90deg,#C9972B,#F5C842)' : '#F0F0F0',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/api/orders?limit=50')
      .then(r => setOrders(r.data.data || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) {
    return (
      <div className="shop-content">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          Loading your orders…
        </div>
      </div>
    );
  }

  return (
    <div className="shop-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#1A1A1A' }}>
          My Orders
        </h1>
        <button
          onClick={() => navigate('/home')}
          style={{
            background: '#1A1A1A', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 20px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Continue Shopping
        </button>
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
          borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 14,
        }}>
          ❌ {error}
        </div>
      )}

      {orders.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#4A4A4A', marginBottom: 8 }}>
            No orders yet
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: 24 }}>
            Place your first order to see it here.
          </p>
          <button
            onClick={() => navigate('/home')}
            style={{
              background: '#C9972B', color: '#fff', border: 'none',
              borderRadius: 30, padding: '12px 28px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Shop Now →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div key={order.id} style={{
              background: '#fff', border: '1px solid #EBEBEB',
              borderRadius: 14, padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              {/* Order header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A' }}>
                    Order #{order.id}
                  </p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #F0F0F0', margin: '14px 0' }} />

              {/* Product info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 8,
                  background: '#FAFAFA', border: '1px solid #EBEBEB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {order.image_url
                    ? <img src={order.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                    : <span style={{ fontSize: 28 }}>🌰</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>
                    {order.product_names || `Order #${order.id}`}
                  </p>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                    Qty: {order.total_qty || '—'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, fontSize: 16, color: '#1A1A1A' }}>
                    ₹{Number(order.total_amount).toFixed(2)}
                  </p>
                  <p style={{ fontSize: 11, color: '#9ca3af' }}>Total</p>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10, fontStyle: 'italic' }}>
                  {order.notes}
                </p>
              )}

              {/* Order tracker */}
              <OrderTracker status={order.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
