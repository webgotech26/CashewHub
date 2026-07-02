import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';

// ── Stat card definitions ────────────────────────────────────────────
const STATS = [
  { key: 'totalOrders',    label: 'Total Orders',    icon: '🛒', accent: '#2d6a4f' },
  { key: 'todayOrders',    label: "Today's Orders",  icon: '📋', accent: '#0ea5e9' },
  { key: 'totalRevenue',   label: 'Total Revenue',   icon: '💰', accent: '#f59e0b' },
  { key: 'totalCustomers', label: 'Customers',        icon: '👥', accent: '#8b5cf6' },
  { key: 'lowStock',       label: 'Low Stock Items',  icon: '⚠️', accent: '#ef4444' },
  { key: 'pendingOrders',  label: 'Pending Orders',   icon: '⏳', accent: '#f97316' },
];

// ── Status → badge colour mapping ────────────────────────────────────
const STATUS_MAP = {
  pending:    { cls: 'yellow', label: 'Pending'    },
  confirmed:  { cls: 'blue',   label: 'Confirmed'  },
  processing: { cls: 'blue',   label: 'Processing' },
  shipped:    { cls: 'blue',   label: 'Shipped'    },
  delivered:  { cls: 'green',  label: 'Delivered'  },
  cancelled:  { cls: 'red',    label: 'Cancelled'  },
};

// ── Skeleton row component ───────────────────────────────────────────
function SkeletonRows({ cols = 8, rows = 5 }) {
  const widths = [30, 100, 120, 40, 70, 70, 80, 50];
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="erp-skeleton--row">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j}>
          <span
            className="erp-skeleton erp-skeleton--cell"
            style={{ width: widths[j] || 80 }}
          />
        </td>
      ))}
    </tr>
  ));
}

export default function AdminDashboard() {
  const [stats, setStats]             = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // Fetch dashboard stats
    api.get('/api/admin/stats')
      .then(r  => setStats(r.data.data || {}))
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    // Fetch recent orders
    api.get('/api/orders?limit=8')
      .then(r  => setRecentOrders(r.data.data || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));

    // Socket.io for live orders
    const socket = io('http://localhost:5000');

    socket.on('new-order', (order) => {
      setRecentOrders(prev => [order, ...prev.slice(0, 7)]);
      setNotification(order);
      new Audio('/notify.mp3').play().catch(() => {});
      setTimeout(() => setNotification(null), 6000);
    });

    return () => socket.disconnect();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────
  const getStatValue = (key) => {
    if (key === 'totalRevenue') {
      return `₹${Number(stats[key] || 0).toLocaleString('en-IN')}`;
    }
    return stats[key] ?? 0;
  };

  const statusBadge = (status) => {
    const s = STATUS_MAP[status] || { cls: 'gray', label: status };
    return <span className={`erp-badge erp-badge--${s.cls}`}>{s.label}</span>;
  };

  return (
    <div>

      {/* ── Toast Notification ────────────────────────────────────── */}
      {notification && (
        <div className="erp-toast">
          <span className="erp-toast__icon">🔔</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>New Order Received!</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Order #{notification.id} — ₹{Number(notification.total_amount).toFixed(2)}
            </div>
          </div>
          <button className="erp-toast__close" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* ── Page Title ───────────────────────────────────────────── */}
      <h1 className="erp-page-title">
        📊 Dashboard Overview
      </h1>

      {/* ── Stat Cards ───────────────────────────────────────────── */}
      <div className="erp-stats-grid">
        {STATS.map((s) => (
          <div
            key={s.key}
            className="erp-stat-card"
            style={{ '--accent': s.accent }}
          >
            <span className="erp-stat-card__icon">{s.icon}</span>

            {statsLoading ? (
              <>
                <span className="erp-skeleton erp-skeleton--value" />
                <span className="erp-skeleton erp-skeleton--label" />
              </>
            ) : (
              <>
                <span className="erp-stat-card__value">{getStatValue(s.key)}</span>
                <span className="erp-stat-card__label">{s.label}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Recent Orders Table ───────────────────────────────────── */}
      <div className="erp-card">
        <div className="erp-card__header">
          <div>
            <div className="erp-card__title">
              <span className="erp-live-dot" />
              Recent Orders
              <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>
                (Live via Socket.io)
              </span>
            </div>
            <div className="erp-card__subtitle">
              Last 8 orders across all customers
            </div>
          </div>
          <span
            style={{
              fontSize: 12, fontWeight: 600, color: '#2d6a4f',
              background: '#f0fdf4', padding: '4px 10px',
              borderRadius: 20, border: '1px solid #bbf7d0'
            }}
          >
            {recentOrders.length} orders
          </span>
        </div>

        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <SkeletonRows cols={8} rows={5} />
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="erp-empty">
                      <div className="erp-empty__icon">📭</div>
                      <div className="erp-empty__text">No orders yet.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                recentOrders.map((o, i) => (
                  <tr key={o.id || i}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#1a3c2e' }}>
                        #{o.id}
                      </span>
                    </td>
                    <td>{o.customer_name || `Customer #${o.customer_id}`}</td>
                    <td
                      style={{
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {o.product_name || `Product #${o.product_id}`}
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.quantity}</td>
                    <td style={{ fontWeight: 700, color: '#1a3c2e' }}>
                      ₹{Number(o.total_amount).toFixed(2)}
                    </td>
                    <td>{statusBadge(o.status)}</td>
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>
                      {new Date(o.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td>
                      <button
                        className="erp-btn-icon"
                        title="View Order Details"
                        onClick={() => setSelectedOrder(o)}
                      >
                        👁
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Order Detail Modal ────────────────────────────────────── */}
      {selectedOrder && (
        <div
          className="erp-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="erp-modal"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">
                Order #{selectedOrder.id} Details
              </h3>
              <button
                className="erp-modal__close"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="erp-detail-grid">
              {[
                ['Customer',  selectedOrder.customer_name || `#${selectedOrder.customer_id}`],
                ['Product',   selectedOrder.product_name  || `#${selectedOrder.product_id}`],
                ['Quantity',  selectedOrder.quantity],
                ['Unit Price', `₹${Number(selectedOrder.unit_price || 0).toFixed(2)}`],
                ['Total',     `₹${Number(selectedOrder.total_amount).toFixed(2)}`],
                ['Status',    statusBadge(selectedOrder.status)],
                ['Notes',     selectedOrder.notes || '—'],
                ['Ordered On', new Date(selectedOrder.created_at).toLocaleString('en-IN')],
              ].map(([k, v]) => (
                <>
                  <div key={`k-${k}`} className="erp-detail-grid__key">{k}</div>
                  <div key={`v-${k}`} className="erp-detail-grid__val">{v}</div>
                </>
              ))}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                className="erp-btn erp-btn--secondary"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
