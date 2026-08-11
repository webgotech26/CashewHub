import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

/* ── Status helpers ─────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: 'pending',          label: 'Pending' },
  { value: 'dispatched',       label: 'Dispatched' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered',        label: 'Delivered' },
  { value: 'failed',           label: 'Failed' },
];

const STATUS_BADGE_MAP = {
  pending:          'yellow',
  dispatched:       'blue',
  out_for_delivery: 'orange',
  delivered:        'green',
  failed:           'red',
};

function StatusBadge({ status }) {
  const color = STATUS_BADGE_MAP[status] || 'gray';
  const label = STATUS_OPTIONS.find(o => o.value === status)?.label || status || '—';
  return <span className={`erp-badge erp-badge--${color}`}>{label}</span>;
}

export default function Delivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  /* OTP modal state */
  const [selected, setSelected] = useState(null);
  const [otp,      setOtp]      = useState('');
  const [otpAlert, setOtpAlert] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);

  /* Per-row status update loading */
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDeliveries = useCallback(() => {
    setLoading(true);
    api.get('/api/delivery')
      .then(r => setDeliveries(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  /* ── Status dropdown change ─────────────────────────────────── */
  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/api/delivery/${id}/status`, { status: newStatus });
      /* Optimistically update UI */
      setDeliveries(prev =>
        prev.map(d => d.id === id ? { ...d, status: newStatus } : d)
      );
    } catch {
      fetchDeliveries(); // revert on error
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── OTP verification ───────────────────────────────────────── */
  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setOtpLoading(true);
    setOtpAlert(null);
    try {
      await api.post(`/api/delivery/${selected.id}/verify-otp`, { otp: otp.trim() });
      setOtpAlert({ type: 'success', msg: '✅ Delivery confirmed via OTP!' });
      setDeliveries(prev =>
        prev.map(d => d.id === selected.id ? { ...d, status: 'delivered' } : d)
      );
      setTimeout(() => {
        setSelected(null);
        setOtp('');
        setOtpAlert(null);
      }, 1500);
    } catch (err) {
      setOtpAlert({ type: 'error', msg: err.response?.data?.message || 'Invalid OTP. Please try again.' });
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── Filter ─────────────────────────────────────────────────── */
  const filtered = deliveries.filter(d => {
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q
      || String(d.order_id).includes(q)
      || (d.customer_name  || '').toLowerCase().includes(q)
      || (d.customer_phone || '').includes(q)
      || (d.delivery_address || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div>
      {/* ── Page title ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <h1 className="erp-page-title" style={{ margin: 0 }}>🚚 Delivery Management</h1>
        <button className="erp-btn erp-btn--secondary erp-btn--sm" onClick={fetchDeliveries}>
          ↺ Refresh
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="erp-toolbar">
        <input
          type="text"
          className="erp-toolbar__search"
          placeholder="Search by order, customer, phone, address…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #d1d5db',
            fontSize: 13, outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 'auto' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="erp-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Phone</th>
                <th style={{ minWidth: 180 }}>Delivery Address</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Tracking / Waybill</th>
                <th>Status</th>
                <th style={{ minWidth: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(10)].map((__, j) => (
                      <td key={j}>
                        <div className="erp-skeleton erp-skeleton--cell" style={{ width: '80%', height: 13 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
                    {search || filterStatus !== 'all' ? 'No deliveries match your filters.' : 'No deliveries yet.'}
                  </td>
                </tr>
              ) : filtered.map(d => (
                <tr key={d.id}>
                  <td style={{ color: '#9ca3af', fontSize: 12 }}>{d.id}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#1a3c2e' }}>
                      #{d.order_id < 100000 ? d.order_id + 100000 : d.order_id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{d.customer_name || '—'}</div>
                    {d.customer_email && (
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{d.customer_email}</div>
                    )}
                  </td>
                  <td>
                    {d.customer_phone
                      ? <a href={`tel:${d.customer_phone}`} style={{ color: '#2d6a4f', fontWeight: 600, fontSize: 13 }}>
                          {d.customer_phone}
                        </a>
                      : <span style={{ color: '#9ca3af' }}>—</span>
                    }
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {d.delivery_address || '—'}
                    </div>
                  </td>
                  <td style={{ maxWidth: 160, fontSize: 12, color: '#374151',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.product_names || '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: '#1a3c2e', whiteSpace: 'nowrap' }}>
                    {d.total_amount ? `₹${Number(d.total_amount).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td>
                    {d.tracking_number
                      ? <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                          {d.tracking_number}
                        </code>
                      : <span style={{ color: '#9ca3af', fontSize: 12 }}>Not assigned</span>
                    }
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Status dropdown */}
                      <select
                        value={d.status || 'pending'}
                        disabled={updatingId === d.id}
                        onChange={e => handleStatusChange(d.id, e.target.value)}
                        style={{ fontSize: 12, padding: '5px 8px', borderRadius: 6,
                          border: '1px solid #d1d5db', cursor: 'pointer',
                          opacity: updatingId === d.id ? 0.5 : 1 }}
                      >
                        {STATUS_OPTIONS.map(o =>
                          <option key={o.value} value={o.value}>{o.label}</option>
                        )}
                      </select>

                      {/* OTP verify button */}
                      <button
                        className="erp-btn erp-btn--primary erp-btn--sm"
                        onClick={() => { setSelected(d); setOtp(''); setOtpAlert(null); }}
                        title="Verify delivery via OTP"
                        disabled={d.status === 'delivered'}
                      >
                        🔐 OTP
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── OTP Modal ── */}
      {selected && (
        <div className="erp-modal-overlay" onClick={() => setSelected(null)}>
          <div className="erp-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">
                🔐 OTP Verification
                <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                  Order #{selected.order_id < 100000 ? selected.order_id + 100000 : selected.order_id}
                </span>
              </h3>
              <button className="erp-modal__close" onClick={() => setSelected(null)}>×</button>
            </div>

            {/* Delivery summary */}
            <div style={{ background: '#f8faf9', borderRadius: 8, padding: '12px 16px',
              marginBottom: 16, fontSize: 13, border: '1px solid #e5e7eb' }}>
              <div><strong>Customer:</strong> {selected.customer_name || '—'}</div>
              {selected.customer_phone && <div><strong>Phone:</strong> {selected.customer_phone}</div>}
              {selected.delivery_address && (
                <div style={{ marginTop: 4, color: '#555', lineHeight: 1.5 }}>
                  <strong>Address:</strong> {selected.delivery_address}
                </div>
              )}
            </div>

            {otpAlert && (
              <div className={`erp-alert erp-alert--${otpAlert.type}`} style={{ marginBottom: 14 }}>
                {otpAlert.msg}
              </div>
            )}

            <p style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>
              Ask the customer for their 6-digit delivery OTP to confirm receipt.
            </p>

            <div className="erp-form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Enter OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="● ● ● ● ● ●"
                style={{ letterSpacing: 10, fontSize: 24, textAlign: 'center',
                  fontWeight: 800, padding: '12px', borderRadius: 10,
                  border: '2px solid #d1d5db', outline: 'none', width: '100%',
                  boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#2d6a4f'; }}
                onBlur={e  => { e.target.style.borderColor = '#d1d5db'; }}
                onKeyDown={e => { if (e.key === 'Enter' && otp.length === 6) handleVerifyOtp(); }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="erp-btn erp-btn--secondary"
                onClick={() => { setSelected(null); setOtp(''); setOtpAlert(null); }}>
                Cancel
              </button>
              <button
                className="erp-btn erp-btn--primary"
                onClick={handleVerifyOtp}
                disabled={otp.length < 4 || otpLoading}
              >
                {otpLoading ? 'Verifying…' : '✓ Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
