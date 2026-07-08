import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Delivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [otp, setOtp]               = useState('');
  const [alert, setAlert]           = useState(null);

  const fetch = () => api.get('/api/delivery').then(r => setDeliveries(r.data.data || [])).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const verifyOtp = async (id) => {
    try {
      await api.post(`/api/delivery/${id}/verify-otp`, { otp });
      setAlert({ type:'success', msg:'Delivery confirmed!' });
      fetch();
      setTimeout(() => { setSelected(null); setAlert(null); setOtp(''); }, 1000);
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.message || 'OTP mismatch.' });
    }
  };

  const updateTracking = async (id, status) => {
    await api.patch(`/api/delivery/${id}/status`, { status }).catch(() => {});
    fetch();
  };

  const statusBadge = (s) => {
    const map = { pending:'yellow', dispatched:'blue', out_for_delivery:'blue', delivered:'green', failed:'red' };
    return <span className={`erp-badge erp-badge--${map[s] || 'gray'}`}>{s || '—'}</span>;
  };

  return (
    <div>
      <h1 className="erp-page-title">🚚 Delivery Management</h1>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th><th>Order</th><th>Customer</th><th>Address</th>
                <th>Tracking</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No deliveries yet.</td></tr>
              ) : deliveries.map(d => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>#{d.order_id}</td>
                  <td>{d.customer_name || '—'}</td>
                  <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {d.delivery_address || '—'}
                  </td>
                  <td>{d.tracking_number || '—'}</td>
                  <td>{statusBadge(d.status)}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="erp-btn erp-btn--secondary erp-btn--sm" onClick={() => { setSelected(d); setAlert(null); }}>
                      OTP Verify
                    </button>
                    <select
                      style={{ fontSize:12, padding:'4px 8px', borderRadius:5, border:'1px solid #d1d5db' }}
                      value={d.status}
                      onChange={e => updateTracking(d.id, e.target.value)}
                    >
                      {['pending','dispatched','out_for_delivery','delivered','failed'].map(s =>
                        <option key={s} value={s}>{s}</option>
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="erp-modal-overlay" onClick={() => setSelected(null)}>
          <div className="erp-modal" onClick={e => e.stopPropagation()}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">OTP Verification — Delivery #{selected.id}</h3>
              <button className="erp-modal__close" onClick={() => setSelected(null)}>×</button>
            </div>
            {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}
            <p style={{ fontSize:13, color:'#555', marginBottom:14 }}>
              Enter the 6-digit OTP provided by the customer to confirm delivery.
            </p>
            <div className="erp-form-group" style={{ marginBottom:16 }}>
              <label>OTP</label>
              <input type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="Enter OTP" style={{ letterSpacing:6, fontSize:20, textAlign:'center' }} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="erp-btn erp-btn--secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button className="erp-btn erp-btn--primary" onClick={() => verifyOtp(selected.id)}>
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
