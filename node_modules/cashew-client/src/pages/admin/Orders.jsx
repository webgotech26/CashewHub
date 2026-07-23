import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

/* ── CSV export ─────────────────────────────────────────────── */
function downloadOrdersCSV(orders, filename) {
  const headers = ['ID', 'Customer', 'Items', 'Qty', 'Total', 'Status', 'Date'];
  const lines = [
    headers.join(','),
    ...orders.map(o => [
      o.id,
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      `"${(o.product_names || '').replace(/"/g, '""')}"`,
      o.total_qty ?? '',
      Number(o.total_amount).toFixed(2),
      o.status,
      new Date(o.created_at).toLocaleDateString('en-IN'),
    ].join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Print invoice ──────────────────────────────────────────── */
function printInvoice(order) {
  const items = (order.items || []).map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${i.product_name || `#${i.product_id}`}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">₹${Number(i.unit_price).toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700">₹${Number(i.line_total || i.unit_price * i.quantity).toFixed(2)}</td>
    </tr>`).join('');

  const win = window.open('', '_blank', 'width=700,height=900');
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${order.id}</title>
  <style>body{font-family:'Segoe UI',Arial,sans-serif;color:#111;margin:0;padding:32px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;border-bottom:2px solid #1a3c2e;padding-bottom:20px}
  h1{margin:0;color:#1a3c2e;font-size:22px}
  .meta{font-size:13px;color:#555;line-height:1.8}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  th{background:#f3f4f6;padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280}
  .total-row{display:flex;justify-content:flex-end;margin-top:16px;font-size:16px;font-weight:800}
  .footer{margin-top:40px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #f0f0f0;padding-top:16px}
  @media print{button{display:none}}</style></head><body>
  <div class="hdr">
    <div>
      <h1>H²B³ Cashew</h1>
      <div style="font-size:12px;color:#9ca3af;margin-top:4px">Premium Quality Nuts · Panruti, Tamil Nadu</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:800;color:#1a3c2e">Invoice #${order.id}</div>
      <div style="font-size:13px;color:#555;margin-top:4px">${new Date(order.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
    </div>
  </div>
  <div class="meta">
    <strong>Customer:</strong> ${order.customer_name || `#${order.customer_id}`}<br>
    ${order.customer_email ? `<strong>Email:</strong> ${order.customer_email}<br>` : ''}
    ${order.customer_mobile ? `<strong>Phone:</strong> ${order.customer_mobile}<br>` : ''}
    ${order.address ? `<strong>Delivery:</strong> ${order.address}<br>` : ''}
    ${order.notes ? `<strong>Payment:</strong> ${order.notes}` : ''}
  </div>
  <table>
    <thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <div class="total-row">Grand Total: ₹${Number(order.total_amount).toFixed(2)}</div>
  <div class="footer">Thank you for shopping with H²B³ Cashew!<br>This is a computer-generated invoice.</div>
  <br><button onclick="window.print()" style="padding:10px 24px;background:#1a3c2e;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer">🖨 Print</button>
  </body></html>`);
  win.document.close();
}

/* ── Constants ──────────────────────────────────────────────── */
const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_META = {
  pending:    { color: '#F59E0B', bg: '#FFFBEB', label: 'Pending'    },
  confirmed:  { color: '#3B82F6', bg: '#EFF6FF', label: 'Confirmed'  },
  processing: { color: '#8B5CF6', bg: '#F5F3FF', label: 'Processing' },
  shipped:    { color: '#06B6D4', bg: '#ECFEFF', label: 'Shipped'    },
  delivered:  { color: '#22C55E', bg: '#F0FDF4', label: 'Delivered'  },
  cancelled:  { color: '#EF4444', bg: '#FFF1F2', label: 'Cancelled'  },
};

/* ── StatusBadge ────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const m = STATUS_META[status] || { color: '#9CA3AF', bg: '#F3F4F6', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700,
      color: m.color, background: m.bg,
      padding: '3px 10px', borderRadius: 20,
      border: `1px solid ${m.color}30`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: m.color, flexShrink: 0,
      }} />
      {m.label}
    </span>
  );
}

/* ── Section heading inside modal ───────────────────────────── */
function ModalSection({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 10, fontWeight: 800, color: '#6B7280',
        textTransform: 'uppercase', letterSpacing: 1.2,
        margin: '0 0 10px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{icon}</span>{title}
      </p>
      {children}
    </div>
  );
}

/* ── Info grid cell ─────────────────────────────────────────── */
function InfoCell({ label, value, fullWidth = false, mono = false }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
      <p style={{
        fontSize: 10, fontWeight: 700, color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: 0.7, margin: '0 0 3px',
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 13, fontWeight: 600, color: '#111827',
        margin: 0, wordBreak: fullWidth ? 'break-word' : 'normal',
        fontFamily: mono ? "'Courier New', monospace" : 'inherit',
      }}>
        {value || <span style={{ color: '#9CA3AF', fontWeight: 400 }}>—</span>}
      </p>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function Orders() {
  const [orders,        setOrders]        = useState([]);
  const [filter,        setFilter]        = useState('all');
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [total,         setTotal]         = useState(0);
  const [selected,      setSelected]      = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mode,          setMode]          = useState('view'); // 'view' | 'manage'

  /* Status update state — kept inside the modal */
  const [newStatus,     setNewStatus]     = useState('');
  const [updating,      setUpdating]      = useState(false);
  const [updateMsg,     setUpdateMsg]     = useState(null); // { type, text }

  /* Bulk selection */
  const [checkedIds,    setCheckedIds]    = useState(new Set());
  const [bulkStatus,    setBulkStatus]    = useState('shipped');
  const [bulkUpdating,  setBulkUpdating]  = useState(false);

  /* ── Fetch orders list ──────────────────────────────────────── */
  const fetchOrders = useCallback(() => {
    api.get('/api/orders', {
      params: { status: filter !== 'all' ? filter : '', search, page, limit: 15 },
    })
      .then(r => {
        setOrders(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(() => {});
  }, [filter, search, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* ── Open detail modal ──────────────────────────────────────── */
  const openDetail = async (orderId, openMode = 'view') => {
    setMode(openMode);
    setDetailLoading(true);
    setSelected(null);
    setNewStatus('');
    setUpdateMsg(null);
    try {
      const res = await api.get(`/api/orders/${orderId}`);
      const data = res.data.data;
      setSelected(data);
      setNewStatus(data.status);
    } catch {
      const fallback = orders.find(o => o.id === orderId) || null;
      setSelected(fallback);
      if (fallback) setNewStatus(fallback.status);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setNewStatus('');
    setUpdateMsg(null);
    setMode('view');
  };

  /* ── Update status ──────────────────────────────────────────── */
  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === selected.status) return;
    setUpdating(true);
    setUpdateMsg(null);
    try {
      await api.patch(`/api/orders/${selected.id}/status`, { status: newStatus });
      setUpdateMsg({ type: 'success', text: `Status updated to "${newStatus}" successfully.` });
      setSelected(prev => ({ ...prev, status: newStatus }));
      fetchOrders();  // refresh list in background
    } catch (err) {
      setUpdateMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update status.',
      });
    } finally {
      setUpdating(false);
    }
  };

  /* ── Financials helpers ─────────────────────────────────────── */
  const calcSubtotal = (items = []) =>
    items.reduce((sum, i) =>
      sum + Number(i.unit_price || 0) * Number(i.quantity || 0), 0);

  /* ── Bulk actions ───────────────────────────────────────────── */
  const allChecked = orders.length > 0 && orders.every(o => checkedIds.has(o.id));
  const toggleAll  = () => {
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(orders.map(o => o.id)));
  };
  const toggleOne = (id) => {
    const next = new Set(checkedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setCheckedIds(next);
  };
  const applyBulk = async () => {
    if (checkedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      await api.patch('/api/orders/bulk-status', {
        ids: Array.from(checkedIds),
        status: bulkStatus,
      });
      setCheckedIds(new Set());
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk update failed.');
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <div>
      <h1 className="erp-page-title">🛒 Order Management</h1>

      {/* ── Filter toolbar ─────────────────────────────────────── */}
      <div className="erp-toolbar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', ...STATUSES].map(s => (
            <button key={s}
              className={`erp-btn erp-btn--sm ${filter === s ? 'erp-btn--primary' : 'erp-btn--secondary'}`}
              onClick={() => { setFilter(s); setPage(1); setCheckedIds(new Set()); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="erp-toolbar__search"
            placeholder="Search customer…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <button
            className="erp-btn erp-btn--secondary erp-btn--sm"
            onClick={() => downloadOrdersCSV(orders, `orders-p${page}.csv`)}
            disabled={orders.length === 0}
            title="Export current page to CSV"
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* ── Bulk action bar (visible when rows are selected) ─────── */}
      {checkedIds.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 18px', marginBottom: 12,
          background: '#1a3c2e', borderRadius: 10,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {checkedIds.size} order{checkedIds.size !== 1 ? 's' : ''} selected
          </span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            style={{
              padding: '7px 12px', borderRadius: 8, border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: STATUS_META[bulkStatus]?.color || '#374151',
              background: STATUS_META[bulkStatus]?.bg || '#fff',
            }}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button
            className="erp-btn erp-btn--primary erp-btn--sm"
            onClick={applyBulk}
            disabled={bulkUpdating}
          >
            {bulkUpdating ? 'Applying…' : '✓ Apply to Selected'}
          </button>
          <button
            className="erp-btn erp-btn--secondary erp-btn--sm"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            onClick={() => setCheckedIds(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Orders table ───────────────────────────────────────── */}
      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={allChecked}
                    onChange={toggleAll}
                    style={{ width: 16, height: 16, cursor: 'pointer' }} />
                </th>
                <th>#</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>
                    No orders found.
                  </td>
                </tr>
              ) : orders.map(o => (
                <tr key={o.id} style={{ background: checkedIds.has(o.id) ? '#f0fdf4' : undefined }}>
                  <td>
                    <input type="checkbox"
                      checked={checkedIds.has(o.id)}
                      onChange={() => toggleOne(o.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  </td>
                  <td style={{ fontWeight: 700 }}>#{o.id}</td>
                  <td>{o.customer_name || `Customer #${o.customer_id}`}</td>
                  <td>
                    <button
                      onClick={() => openDetail(o.id, 'view')}
                      style={{
                        background: 'none', border: 'none',
                        color: '#2d6a4f', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', padding: 0,
                        textDecoration: 'underline', textUnderlineOffset: 3,
                      }}
                    >
                      View details →
                    </button>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{Number(o.total_amount).toFixed(2)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ color: '#9ca3af', fontSize: 12 }}>
                    {new Date(o.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td>
                    <button
                      className="erp-btn erp-btn--secondary erp-btn--sm"
                      onClick={() => openDetail(o.id, 'manage')}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="erp-pagination">
          <span>{total} total</span>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page}</span>
          <button disabled={orders.length < 15} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ORDER DETAIL MODAL
          ══════════════════════════════════════════════════════════ */}
      {(selected || detailLoading) && (
        <div className="erp-modal-overlay" onClick={closeDetail}>
          <div
            className="erp-modal"
            style={{ maxWidth: 660, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">
                Order #{selected?.id || '…'}
                {selected && (
                  <span style={{ marginLeft: 10 }}>
                    <StatusBadge status={selected.status} />
                  </span>
                )}
                {/* Mode indicator pill */}
                <span style={{
                  marginLeft: 10,
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 9px', borderRadius: 20,
                  background: mode === 'manage' ? '#FFF7ED' : '#F0FDF4',
                  color:      mode === 'manage' ? '#C2410C'  : '#15803D',
                  border:     `1px solid ${mode === 'manage' ? '#FED7AA' : '#86EFAC'}`,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {mode === 'manage' ? '✏️ Manage' : '👁 View Only'}
                </span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Mode toggle — lets admin switch without reopening */}
                {selected && !detailLoading && (
                  <button
                    onClick={() => {
                      setMode(m => m === 'view' ? 'manage' : 'view');
                      setUpdateMsg(null);
                    }}
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '5px 12px',
                      borderRadius: 8, border: '1.5px solid #D1D5DB',
                      background: 'transparent', cursor: 'pointer',
                      color: '#374151', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2d6a4f'; e.currentTarget.style.color = '#2d6a4f'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#374151'; }}
                  >
                    {mode === 'view' ? '✏️ Switch to Manage' : '👁 View Only'}
                  </button>
                )}
                <button className="erp-modal__close" onClick={closeDetail}>×</button>
              </div>
            </div>

            {/* Loading spinner */}
            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                <div style={{
                  width: 32, height: 32,
                  border: '3px solid #e5e7eb', borderTopColor: '#2d6a4f',
                  borderRadius: '50%',
                  animation: 'erp-spin 0.7s linear infinite',
                  margin: '0 auto 12px',
                }} />
                Loading order details…
              </div>
            ) : selected && (
              <div style={{ padding: '4px 0 8px' }}>

                {/* ── 1. Customer Info ─────────────────────────── */}
                <ModalSection title="Customer Information" icon="👤">
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 14, padding: '14px 16px',
                    background: '#F9FAFB', borderRadius: 10,
                  }}>
                    <InfoCell
                      label="Name"
                      value={selected.customer_name || `Customer #${selected.customer_id}`}
                    />
                    <InfoCell
                      label="Phone"
                      value={selected.customer_mobile}
                      mono
                    />
                    <InfoCell
                      label="Email"
                      value={selected.customer_email}
                    />
                  </div>
                </ModalSection>

                {/* ── 2. Shipping Details ──────────────────────── */}
                <ModalSection title="Shipping Details" icon="📍">
                  <div style={{
                    padding: '14px 16px',
                    background: '#F9FAFB', borderRadius: 10,
                  }}>
                    <InfoCell
                      label="Delivery Address"
                      value={selected.address}
                      fullWidth
                    />
                  </div>
                </ModalSection>

                {/* ── 3. Payment Info ──────────────────────────── */}
                <ModalSection title="Payment" icon="💳">
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 14, padding: '14px 16px',
                    background: '#F9FAFB', borderRadius: 10,
                  }}>
                    <InfoCell
                      label="Payment Method"
                      value={selected.notes}
                    />
                    <InfoCell
                      label="Payment Status"
                      value={
                        selected.status === 'cancelled'
                          ? '❌ Cancelled'
                          : selected.status === 'delivered'
                            ? '✅ Paid'
                            : '⏳ Pending Confirmation'
                      }
                    />
                  </div>
                </ModalSection>

                {/* ── 4. Order Items ───────────────────────────── */}
                <ModalSection
                  title={`Order Items (${selected.items?.length || 0})`}
                  icon="📦"
                >
                  {/* Column headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 90px 90px',
                    padding: '7px 12px',
                    background: '#F3F4F6', borderRadius: 8,
                    fontSize: 10, fontWeight: 700, color: '#6B7280',
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    marginBottom: 6,
                  }}>
                    <span>Product</span>
                    <span style={{ textAlign: 'center' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Unit Price</span>
                    <span style={{ textAlign: 'right' }}>Line Total</span>
                  </div>

                  {/* Item rows */}
                  {selected.items && selected.items.length > 0 ? (
                    selected.items.map((item, idx) => (
                      <div key={item.product_id || idx} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 60px 90px 90px',
                        padding: '10px 12px',
                        background: idx % 2 === 0 ? '#fff' : '#FAFAFA',
                        border: '1px solid #F0F0F0',
                        borderRadius: 8, marginBottom: 4,
                        fontSize: 13, alignItems: 'center',
                      }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {item.product_name || `Product #${item.product_id}`}
                        </span>
                        <span style={{ textAlign: 'center', color: '#6B7280' }}>
                          {item.quantity}
                        </span>
                        <span style={{ textAlign: 'right', color: '#374151' }}>
                          ₹{Number(item.unit_price).toFixed(2)}
                        </span>
                        <span style={{ textAlign: 'right', fontWeight: 700, color: '#1a3c2e' }}>
                          ₹{Number(item.line_total || item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      textAlign: 'center', padding: '20px',
                      color: '#9ca3af', fontSize: 13,
                    }}>
                      No item details available.
                    </div>
                  )}

                  {/* Financials footer */}
                  {selected.items && selected.items.length > 0 && (() => {
                    const subtotal = calcSubtotal(selected.items);
                    const grandTotal = Number(selected.total_amount);
                    const shipping = grandTotal - subtotal;

                    return (
                      <div style={{
                        borderTop: '2px solid #E5E7EB', marginTop: 8,
                        padding: '10px 12px',
                      }}>
                        {/* Subtotal */}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: 13, color: '#6B7280', marginBottom: 4,
                        }}>
                          <span>Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {/* Shipping / other adjustments */}
                        {Math.abs(shipping) > 0.01 && (
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: 13, color: '#6B7280', marginBottom: 4,
                          }}>
                            <span>{shipping > 0 ? 'Shipping / Tax' : 'Discount'}</span>
                            <span style={{ color: shipping > 0 ? '#374151' : '#22C55E' }}>
                              {shipping > 0 ? '+' : '-'}₹{Math.abs(shipping).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {/* Grand total */}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: 15, fontWeight: 800,
                          color: '#1a3c2e',
                          borderTop: '1px solid #F0F0F0', paddingTop: 8, marginTop: 4,
                        }}>
                          <span>Grand Total</span>
                          <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </ModalSection>

                {/* ── 5. Status Management — only shown in 'manage' mode ── */}
                {mode === 'manage' && (
                <ModalSection title="Update Order Status" icon="🔄">
                  <div style={{
                    padding: '16px', background: '#F9FAFB',
                    borderRadius: 10, border: '1px solid #E5E7EB',
                  }}>
                    {/* Dropdown + button row */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={newStatus}
                        onChange={e => { setNewStatus(e.target.value); setUpdateMsg(null); }}
                        style={{
                          flex: 1, minWidth: 160,
                          padding: '9px 14px', borderRadius: 8,
                          border: '1.5px solid #D1D5DB',
                          fontSize: 13, fontWeight: 600,
                          color: STATUS_META[newStatus]?.color || '#374151',
                          background: STATUS_META[newStatus]?.bg || '#fff',
                          cursor: 'pointer', outline: 'none',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#2d6a4f'}
                        onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleUpdateStatus}
                        disabled={updating || newStatus === selected.status}
                        style={{
                          padding: '9px 20px', borderRadius: 8, border: 'none',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          background: (updating || newStatus === selected.status)
                            ? '#E5E7EB' : '#2d6a4f',
                          color: (updating || newStatus === selected.status)
                            ? '#9CA3AF' : '#fff',
                          transition: 'all 0.18s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {updating ? 'Updating…' : '✓ Update Status'}
                      </button>
                    </div>

                    {/* Status progress indicator */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((s, i, arr) => {
                          const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                          const currentIdx = steps.indexOf(selected.status);
                          const thisIdx    = steps.indexOf(s);
                          const isDone     = thisIdx <= currentIdx && selected.status !== 'cancelled';
                          const isCurrent  = s === selected.status;
                          const m          = STATUS_META[s];

                          return (
                            <div key={s} style={{
                              display: 'flex', alignItems: 'center',
                              flex: i < arr.length - 1 ? 1 : 'none',
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{
                                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                  background: isDone ? '#2d6a4f' : '#E5E7EB',
                                  border: isCurrent ? '2px solid #2d6a4f' : '2px solid transparent',
                                  boxShadow: isCurrent ? '0 0 0 3px #2d6a4f25' : 'none',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, color: isDone ? '#fff' : '#9CA3AF',
                                  fontWeight: 700, transition: 'all 0.3s',
                                }}>
                                  {isDone ? '✓' : i + 1}
                                </div>
                                <span style={{
                                  fontSize: 8, fontWeight: 600,
                                  color: isDone ? '#2d6a4f' : '#9CA3AF',
                                  textTransform: 'uppercase', letterSpacing: 0.3,
                                  whiteSpace: 'nowrap',
                                }}>
                                  {m.label}
                                </span>
                              </div>
                              {i < arr.length - 1 && (
                                <div style={{
                                  flex: 1, height: 2, marginBottom: 16,
                                  background: thisIdx < currentIdx && selected.status !== 'cancelled'
                                    ? '#2d6a4f' : '#E5E7EB',
                                  transition: 'background 0.3s',
                                }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {selected.status === 'cancelled' && (
                        <p style={{
                          marginTop: 6, fontSize: 11, color: '#EF4444',
                          fontWeight: 600, textAlign: 'center',
                        }}>
                          ✕ This order has been cancelled
                        </p>
                      )}
                    </div>

                    {/* Feedback message */}
                    {updateMsg && (
                      <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 8,
                        fontSize: 12, fontWeight: 600,
                        background: updateMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                        color:      updateMsg.type === 'success' ? '#15803D' : '#B91C1C',
                        border:     `1px solid ${updateMsg.type === 'success' ? '#86EFAC' : '#FECACA'}`,
                      }}>
                        {updateMsg.type === 'success' ? '✅' : '❌'} {updateMsg.text}
                      </div>
                    )}
                  </div>
                </ModalSection>
                )} {/* end mode === 'manage' */}

                {/* Footer — view mode shows a CTA to switch to Manage */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', paddingTop: 4, flexWrap: 'wrap', gap: 8,
                }}>
                  {mode === 'view' && (
                    <button
                      className="erp-btn erp-btn--primary erp-btn--sm"
                      onClick={() => { setMode('manage'); setUpdateMsg(null); }}
                    >
                      ✏️ Manage This Order
                    </button>
                  )}
                  <button
                    className="erp-btn erp-btn--secondary"
                    style={{ marginLeft: 'auto' }}
                    onClick={closeDetail}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
