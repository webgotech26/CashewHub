import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];

const STATUS_COLOR = {
  pending:'yellow', confirmed:'blue', processing:'blue',
  shipped:'blue', delivered:'green', cancelled:'red',
};

function StatusBadge({ status }) {
  return <span className={`erp-badge erp-badge--${STATUS_COLOR[status] || 'gray'}`}>{status}</span>;
}

export default function Orders() {
  const [orders, setOrders]         = useState([]);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [selected, setSelected]     = useState(null);   // full order detail
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Fetch orders list ──────────────────────────────────────────
  const fetchOrders = useCallback(() => {
    api.get('/api/orders', {
      params: {
        status: filter !== 'all' ? filter : '',
        search,
        page,
        limit: 15,
      },
    })
      .then(r => {
        setOrders(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(() => {});
  }, [filter, search, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Fetch full order detail when "Manage" is clicked ──────────
  // This hits GET /api/orders/:id which JOINs order_items + products
  const openDetail = async (orderId) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      setSelected(res.data.data);   // { id, customer_name, total_amount, status, items: [...] }
    } catch {
      setSelected(orders.find(o => o.id === orderId) || null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Update status ──────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    await api.patch(`/api/orders/${id}/status`, { status }).catch(() => {});
    fetchOrders();
    // Refresh the modal with the updated status
    openDetail(id);
  };

  return (
    <div>
      <h1 className="erp-page-title">🛒 Order Management</h1>

      {/* Toolbar */}
      <div className="erp-toolbar">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['all', ...STATUSES].map(s => (
            <button key={s}
              className={`erp-btn erp-btn--sm ${filter === s ? 'erp-btn--primary' : 'erp-btn--secondary'}`}
              onClick={() => { setFilter(s); setPage(1); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <input
          className="erp-toolbar__search"
          placeholder="Search customer…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Orders table */}
      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th><th>Customer</th><th>Items</th>
                <th>Total</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'#aaa', padding:30 }}>
                  No orders found.
                </td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight:700 }}>#{o.id}</td>
                  <td>{o.customer_name || `Customer #${o.customer_id}`}</td>
                  <td>
                    <button
                      onClick={() => openDetail(o.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2d6a4f',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                        textUnderlineOffset: 3,
                      }}
                    >
                      View details →
                    </button>
                  </td>
                  <td style={{ fontWeight:700 }}>₹{Number(o.total_amount).toFixed(2)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ color:'#9ca3af', fontSize:12 }}>
                    {new Date(o.created_at).toLocaleDateString('en-IN', {
                      day:'2-digit', month:'short', year:'numeric',
                    })}
                  </td>
                  <td>
                    <button
                      className="erp-btn erp-btn--secondary erp-btn--sm"
                      onClick={() => openDetail(o.id)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="erp-pagination">
          <span>{total} total</span>
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
          <span>Page {page}</span>
          <button disabled={orders.length < 15} onClick={() => setPage(p => p+1)}>Next →</button>
        </div>
      </div>

      {/* ── Order Detail Modal ────────────────────────────────── */}
      {(selected || detailLoading) && (
        <div className="erp-modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="erp-modal"
            style={{ maxWidth: 600 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">
                Order #{selected?.id || '…'}
              </h3>
              <button className="erp-modal__close" onClick={() => setSelected(null)}>×</button>
            </div>

            {detailLoading ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:'#9ca3af' }}>
                Loading order details…
              </div>
            ) : selected && (
              <>
                {/* Order summary */}
                <div style={{
                  display:'grid', gridTemplateColumns:'1fr 1fr', gap:12,
                  padding:'14px 16px', background:'#f9fafb',
                  borderRadius:10, marginBottom:20, fontSize:13,
                }}>
                  <div>
                    <p style={{ color:'#9ca3af', fontWeight:600, fontSize:11,
                      textTransform:'uppercase', letterSpacing:0.5 }}>Customer</p>
                    <p style={{ fontWeight:700, marginTop:4 }}>
                      {selected.customer_name || `#${selected.customer_id}`}
                    </p>
                  </div>
                  <div>
                    <p style={{ color:'#9ca3af', fontWeight:600, fontSize:11,
                      textTransform:'uppercase', letterSpacing:0.5 }}>Status</p>
                    <div style={{ marginTop:4 }}><StatusBadge status={selected.status} /></div>
                  </div>
                  <div>
                    <p style={{ color:'#9ca3af', fontWeight:600, fontSize:11,
                      textTransform:'uppercase', letterSpacing:0.5 }}>Order Date</p>
                    <p style={{ fontWeight:600, marginTop:4 }}>
                      {new Date(selected.created_at).toLocaleDateString('en-IN', {
                        day:'2-digit', month:'long', year:'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p style={{ color:'#9ca3af', fontWeight:600, fontSize:11,
                      textTransform:'uppercase', letterSpacing:0.5 }}>Order Total</p>
                    <p style={{ fontWeight:800, fontSize:16, color:'#1a3c2e', marginTop:4 }}>
                      ₹{Number(selected.total_amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* ── Items array — mapped with .map() ── */}
                <div style={{ marginBottom:20 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#374151',
                    marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 }}>
                    Order Items ({selected.items?.length || 0})
                  </p>

                  {/* Header row */}
                  <div style={{
                    display:'grid', gridTemplateColumns:'1fr 80px 80px 90px',
                    padding:'8px 12px', background:'#f3f4f6', borderRadius:8,
                    fontSize:11, fontWeight:700, color:'#6b7280',
                    textTransform:'uppercase', letterSpacing:0.5, marginBottom:6,
                  }}>
                    <span>Product</span>
                    <span style={{ textAlign:'center' }}>Qty</span>
                    <span style={{ textAlign:'right' }}>Unit Price</span>
                    <span style={{ textAlign:'right' }}>Line Total</span>
                  </div>

                  {/* Items list — .map() over items array */}
                  {selected.items && selected.items.length > 0 ? (
                    selected.items.map((item, index) => (
                      <div
                        key={item.product_id || index}
                        style={{
                          display:'grid',
                          gridTemplateColumns:'1fr 80px 80px 90px',
                          padding:'10px 12px',
                          background: index % 2 === 0 ? '#fff' : '#fafafa',
                          borderRadius:8,
                          fontSize:13,
                          border:'1px solid #f0f0f0',
                          marginBottom:4,
                          alignItems:'center',
                        }}
                      >
                        {/* Product name */}
                        <span style={{ fontWeight:600, color:'#1a1a1a' }}>
                          {item.product_name || `Product #${item.product_id}`}
                        </span>

                        {/* Quantity */}
                        <span style={{ textAlign:'center', color:'#6b7280' }}>
                          {item.quantity}
                        </span>

                        {/* Unit price */}
                        <span style={{ textAlign:'right', color:'#374151' }}>
                          ₹{Number(item.unit_price).toFixed(2)}
                        </span>

                        {/* Line total */}
                        <span style={{ textAlign:'right', fontWeight:700, color:'#1a3c2e' }}>
                          ₹{Number(item.line_total || item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign:'center', padding:'20px', color:'#9ca3af', fontSize:13 }}>
                      No item details available.
                    </div>
                  )}

                  {/* Total row */}
                  {selected.items && selected.items.length > 0 && (
                    <div style={{
                      display:'flex', justifyContent:'flex-end',
                      padding:'10px 12px', borderTop:'2px solid #e5e7eb', marginTop:6,
                    }}>
                      <span style={{ fontSize:14, fontWeight:800, color:'#1a3c2e' }}>
                        Total: ₹{Number(selected.total_amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status update buttons */}
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:'#6b7280',
                    marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>
                    Update Status
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        className={`erp-btn erp-btn--sm ${selected.status === s ? 'erp-btn--primary' : 'erp-btn--secondary'}`}
                        onClick={() => updateStatus(selected.id, s)}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
