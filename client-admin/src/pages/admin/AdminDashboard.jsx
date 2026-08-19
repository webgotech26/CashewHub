import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';

/* ── Socket server URL — same origin as the REST API ──────────────
   Reads VITE_API_URL (set in Vercel env vars) with the same
   normalisation used by services/api.js so it always points at
   the live Render backend in production and localhost:5000 locally.
   ─────────────────────────────────────────────────────────────── */
function resolveSocketURL() {
  return (import.meta.env.VITE_API_URL || 'https://cashewhub.onrender.com')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');
}

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
function SkeletonRows({ cols = 10, rows = 5 }) {
  const widths = [30, 100, 120, 40, 70, 150, 90, 70, 80, 50];
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
  const navigate = useNavigate();
  const [stats, setStats]               = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [chartData, setChartData]       = useState(null);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(r  => setStats(r.data.data || {}))
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    api.get('/api/orders?limit=8')
      .then(r  => setRecentOrders(r.data.data || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));

    /* Fetch low-stock products (stock ≤ 5, active) for the alert banner */
    api.get('/api/products', { params: { limit: 200, admin: true } })
      .then(r => {
        const low = (r.data.data || []).filter(
          p => Number(p.stock_quantity) <= 5 && Number(p.stock_quantity) >= 0
        );
        setLowStockProducts(low);
      })
      .catch(() => {});

    /* Fetch chart data */
    api.get('/api/admin/charts')
      .then(r => setChartData(r.data.data || null))
      .catch(() => setChartData(null))
      .finally(() => setChartsLoading(false));

    // Socket.io for live orders — connects to the same Render backend
    const socket = io(resolveSocketURL(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 20000,
    });

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

  // ── Fetch full order detail (with items array) on eye-icon click ─
  // Same pattern as Orders.jsx — hits GET /api/orders/:id which
  // JOINs order_items + products so product_name and unit_price are never undefined.
  const openOrderDetail = async (orderId) => {
    setDetailLoading(true);
    setSelectedOrder(null);
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      setSelectedOrder(res.data.data);   // { id, customer_name, total_amount, status, items: [...] }
    } catch {
      // Fallback: use the partial row data from the list
      const fallback = recentOrders.find(o => o.id === orderId) || null;
      setSelectedOrder(fallback);
    } finally {
      setDetailLoading(false);
    }
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

      {/* ── Low Stock Alert Banner ───────────────────────────────── */}
      {lowStockProducts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg,#FFF7ED,#FFFBEB)',
          border: '1px solid #FED7AA',
          borderLeft: '4px solid #F97316',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: 14, color: '#9A3412', margin: 0 }}>
                  Low Stock Alert — {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} need restocking
                </p>
                <p style={{ fontSize: 12, color: '#C2410C', margin: '2px 0 0' }}>
                  Stock is at 5 units or below. Restock before customers see "Out of Stock".
                </p>
              </div>
            </div>
            <button
              className="erp-btn erp-btn--sm"
              style={{ background: '#EA580C', color: '#fff', border: 'none' }}
              onClick={() => navigate('/admin/inventory')}
            >
              📦 Go to Inventory
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {lowStockProducts.slice(0, 8).map(p => (
              <button
                key={p.id}
                onClick={() => navigate('/admin/inventory')}
                style={{
                  background: '#fff', border: '1px solid #FED7AA',
                  borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  color: Number(p.stock_quantity) <= 0 ? '#B91C1C' : '#9A3412',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#F97316'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#FED7AA'}
                title={`Edit inventory for ${p.name}`}
              >
                {Number(p.stock_quantity) <= 0 ? '🔴' : '🟡'} {p.name}
                <span style={{ fontWeight: 800,
                  color: Number(p.stock_quantity) <= 0 ? '#DC2626' : '#EA580C' }}>
                  ({p.stock_quantity})
                </span>
              </button>
            ))}
            {lowStockProducts.length > 8 && (
              <span style={{ fontSize: 12, color: '#9CA3AF', alignSelf: 'center' }}>
                +{lowStockProducts.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}      {/* ── Sales Charts ─────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>

        {/* Section header */}
        <h2 style={{
          fontSize: 18, fontWeight: 800, color: '#1a3c2e',
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          📈 Sales Analytics
          <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>Last 30 days</span>
        </h2>

        {chartsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {[200, 200, 200].map((h, i) => (
              <div key={i} style={{
                height: h, borderRadius: 16,
                background: '#f3f4f6',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.6) 50%,transparent 100%)',
                  animation: 'erp-slide 1.4s infinite',
                  backgroundSize: '200% 100%',
                }} />
              </div>
            ))}
            <style>{`@keyframes erp-slide{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
          </div>
        ) : !chartData ? (
          <div className="erp-card" style={{ textAlign: 'center', padding: '32px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
            <div style={{ fontWeight: 600 }}>Chart data unavailable</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Place some orders to start seeing analytics here.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>

            {/* ── Revenue Bar Chart (last 30 days) ── */}
            <div className="erp-card" style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a3c2e', marginBottom: 4 }}>
                💰 Daily Revenue
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                Revenue per day (non-cancelled orders)
              </div>

              {chartData.dailyRevenue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 13 }}>
                  No revenue data yet.
                </div>
              ) : (() => {
                const data = chartData.dailyRevenue;
                const maxRev = Math.max(...data.map(d => d.revenue), 1);
                // Show last 14 days to avoid cramming
                const display = data.slice(-14);
                return (
                  <div>
                    {/* Bars */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-end', gap: 4,
                      height: 140, padding: '0 2px',
                    }}>
                      {display.map((d, i) => {
                        const pct = (d.revenue / maxRev) * 100;
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end',
                            position: 'relative', cursor: 'default' }}
                            title={`${d.date}\n₹${Number(d.revenue).toLocaleString('en-IN')}\n${d.orders} order${d.orders !== 1 ? 's' : ''}`}
                          >
                            <div style={{
                              width: '100%', borderRadius: '4px 4px 0 0',
                              background: 'linear-gradient(180deg,#2d6a4f,#52b788)',
                              height: `${Math.max(pct, 3)}%`,
                              transition: 'height 0.3s ease',
                              minHeight: 3,
                            }} />
                          </div>
                        );
                      })}
                    </div>

                    {/* X-axis labels — show day number */}
                    <div style={{ display: 'flex', gap: 4, padding: '6px 2px 0', justifyContent: 'space-between' }}>
                      {display.map((d, i) => {
                        const dt = new Date(d.date);
                        const showLabel = i === 0 || i === Math.floor(display.length / 2) || i === display.length - 1;
                        return (
                          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9ca3af' }}>
                            {showLabel ? dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1a3c2e' }}>
                          ₹{data.reduce((s, d) => s + d.revenue, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Total Revenue</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#2d6a4f' }}>
                          {data.reduce((s, d) => s + d.orders, 0)}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Total Orders</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0ea5e9' }}>
                          ₹{(data.reduce((s, d) => s + d.revenue, 0) / (data.reduce((s, d) => s + d.orders, 0) || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Avg Order Value</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Top 5 Products ── */}
            <div className="erp-card" style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a3c2e', marginBottom: 4 }}>
                🏆 Top Products by Revenue
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                Best-selling products (all time, non-cancelled)
              </div>

              {chartData.topProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 13 }}>
                  No sales data yet.
                </div>
              ) : (() => {
                const maxRev = Math.max(...chartData.topProducts.map(p => p.revenue), 1);
                const colors = ['#2d6a4f', '#52b788', '#0ea5e9', '#f59e0b', '#8b5cf6'];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {chartData.topProducts.map((p, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              background: colors[i], color: '#fff', fontSize: 11, fontWeight: 800,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {i + 1}
                            </span>
                            <span style={{
                              fontSize: 13, fontWeight: 600, color: '#1a1a1a',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                              title={p.name}>
                              {p.name}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a3c2e' }}>
                              ₹{p.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>
                              {p.units_sold} units
                            </div>
                          </div>
                        </div>
                        {/* Horizontal bar */}
                        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 4,
                            background: colors[i],
                            width: `${(p.revenue / maxRev) * 100}%`,
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* ── Orders by Status ── */}
            <div className="erp-card" style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a3c2e', marginBottom: 4 }}>
                📋 Orders by Status
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                All-time breakdown by order status
              </div>

              {chartData.ordersByStatus.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 13 }}>
                  No orders yet.
                </div>
              ) : (() => {
                const total = chartData.ordersByStatus.reduce((s, d) => s + d.count, 0) || 1;
                const statusColors = {
                  pending:    '#f97316',
                  confirmed:  '#0ea5e9',
                  processing: '#8b5cf6',
                  shipped:    '#06b6d4',
                  delivered:  '#22c55e',
                  cancelled:  '#ef4444',
                };
                const statusLabels = {
                  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
                  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
                };
                // Donut-style bar chart
                return (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {chartData.ordersByStatus.map((s, i) => {
                        const pct = Math.round((s.count / total) * 100);
                        const color = statusColors[s.status] || '#9ca3af';
                        return (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                                  {statusLabels[s.status] || s.status}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{s.count}</span>
                                <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 34, textAlign: 'right' }}>
                                  {pct}%
                                </span>
                              </div>
                            </div>
                            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 4,
                                background: color, width: `${pct}%`,
                                transition: 'width 0.4s ease',
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0',
                      display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>
                          {chartData.ordersByStatus.find(s => s.status === 'delivered')?.count || 0}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Delivered</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#f97316' }}>
                          {chartData.ordersByStatus.find(s => s.status === 'pending')?.count || 0}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Pending</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>
                          {chartData.ordersByStatus.find(s => s.status === 'cancelled')?.count || 0}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Cancelled</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        )}
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
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                        color: '#374151',
                      }}
                      title={o.product_names || 'No items'}
                    >
                      {o.product_names || 'No items'}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {o.total_qty ?? '—'}
                    </td>
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
                        onClick={() => openOrderDetail(o.id)}
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
      {(selectedOrder || detailLoading) && (
        <div
          className="erp-modal-overlay"
          onClick={() => { setSelectedOrder(null); }}
        >
          <div
            className="erp-modal"
            style={{ maxWidth: 580 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">
                Order #{selectedOrder?.id || '…'} Details
              </h3>
              <button
                className="erp-modal__close"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            {/* Loading state */}
            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                <div style={{
                  width: 32, height: 32, border: '3px solid #e5e7eb',
                  borderTopColor: '#2d6a4f', borderRadius: '50%',
                  animation: 'erp-spin 0.7s linear infinite',
                  margin: '0 auto 12px',
                }} />
                Loading order details…
              </div>
            ) : selectedOrder && (
              <>
                {/* ── Order summary row ─────────────────────── */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: 12, padding: '14px 16px',
                  background: '#f9fafb', borderRadius: 10, marginBottom: 20,
                }}>
                  {[
                    ['Customer',   selectedOrder.customer_name || `#${selectedOrder.customer_id}`],
                    ['Status',     statusBadge(selectedOrder.status)],
                    ['Order Date', new Date(selectedOrder.created_at).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric' })],
                    ['Total',      `₹${Number(selectedOrder.total_amount).toFixed(2)}`],
                    ['Address',    selectedOrder.address || '—'],
                    ['Payment',    selectedOrder.notes   || '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={label === 'Address' ? { gridColumn: '1 / -1' } : {}}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af',
                        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
                        {label}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a',
                        wordBreak: label === 'Address' ? 'break-word' : 'normal' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── Items list — .map() over items array ──── */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
                    Order Items ({selectedOrder.items?.length || 0})
                  </p>

                  {/* Column headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 90px 90px',
                    padding: '7px 12px',
                    background: '#f3f4f6', borderRadius: 7,
                    fontSize: 10, fontWeight: 700, color: '#9ca3af',
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    marginBottom: 6,
                  }}>
                    <span>Product</span>
                    <span style={{ textAlign: 'center' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Unit Price</span>
                    <span style={{ textAlign: 'right' }}>Line Total</span>
                  </div>

                  {/* Items — rendered with .map() */}
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div
                        key={item.product_id || idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 60px 90px 90px',
                          padding: '10px 12px',
                          background: idx % 2 === 0 ? '#fff' : '#fafafa',
                          border: '1px solid #f0f0f0',
                          borderRadius: 7,
                          marginBottom: 4,
                          fontSize: 13,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {/* product_name from JOIN — never undefined */}
                          {item.product_name || `Product #${item.product_id}`}
                        </span>
                        <span style={{ textAlign: 'center', color: '#6b7280' }}>
                          {item.quantity}
                        </span>
                        <span style={{ textAlign: 'right', color: '#374151' }}>
                          {/* unit_price aliased in SQL — never 0.00 */}
                          ₹{Number(item.unit_price).toFixed(2)}
                        </span>
                        <span style={{ textAlign: 'right', fontWeight: 700, color: '#1a3c2e' }}>
                          ₹{Number(item.line_total || item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: 13 }}>
                      No item details available.
                    </div>
                  )}

                  {/* Grand total row */}
                  {selectedOrder.items?.length > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end',
                      padding: '10px 12px',
                      borderTop: '2px solid #e5e7eb', marginTop: 6,
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#1a3c2e' }}>
                        Grand Total: ₹{Number(selectedOrder.total_amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Close button */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    className="erp-btn erp-btn--secondary"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
