import { useEffect, useState } from 'react';
import api from '../../services/api';

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [selected, setSelected] = useState(null);

  const fetch = () =>
    api.get(`/api/orders?status=${filter !== 'all' ? filter : ''}&search=${search}&page=${page}&limit=15`)
      .then(r => { setOrders(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => {});

  useEffect(() => { fetch(); }, [filter, search, page]);

  const updateStatus = async (id, status) => {
    await api.patch(`/api/orders/${id}/status`, { status }).catch(() => {});
    fetch();
    setSelected(null);
  };

  const statusBadge = (s) => {
    const map = { pending:'yellow', confirmed:'blue', processing:'blue', shipped:'blue', delivered:'green', cancelled:'red' };
    return <span className={`erp-badge erp-badge--${map[s] || 'gray'}`}>{s}</span>;
  };

  return (
    <div>
      <h1 className="erp-page-title">🛒 Order Management</h1>

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
        <input className="erp-toolbar__search" placeholder="Search customer…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th><th>Customer</th><th>Product</th><th>Qty</th>
                <th>Total</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No orders found.</td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer_name || o.customer_id}</td>
                  <td>{o.product_name || o.product_id}</td>
                  <td>{o.quantity}</td>
                  <td>₹{Number(o.total_amount).toFixed(2)}</td>
                  <td>{statusBadge(o.status)}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="erp-btn erp-btn--secondary erp-btn--sm" onClick={() => setSelected(o)}>
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

      {/* Order Detail / Status Modal */}
      {selected && (
        <div className="erp-modal-overlay" onClick={() => setSelected(null)}>
          <div className="erp-modal" onClick={e => e.stopPropagation()}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">Order #{selected.id}</h3>
              <button className="erp-modal__close" onClick={() => setSelected(null)}>×</button>
            </div>
            <table className="erp-table" style={{ marginBottom:16 }}>
              <tbody>
                {[
                  ['Customer', selected.customer_name || selected.customer_id],
                  ['Product',  selected.product_name  || selected.product_id ],
                  ['Qty',      selected.quantity],
                  ['Total',    `₹${Number(selected.total_amount).toFixed(2)}`],
                  ['Notes',    selected.notes || '—'],
                  ['Status',   statusBadge(selected.status)],
                ].map(([k,v]) => (
                  <tr key={k}><td style={{ fontWeight:600, width:100 }}>{k}</td><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize:13, fontWeight:600, marginBottom:8, color:'#555' }}>Update Status:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {STATUSES.map(s => (
                <button key={s} className={`erp-btn erp-btn--sm ${selected.status === s ? 'erp-btn--primary' : 'erp-btn--secondary'}`}
                  onClick={() => updateStatus(selected.id, s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
