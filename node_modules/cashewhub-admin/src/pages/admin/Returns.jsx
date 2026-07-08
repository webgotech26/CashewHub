import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Returns() {
  const [returns, setReturns]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [action, setAction]     = useState('approved');
  const [refundNote, setRefundNote] = useState('');
  const [alert, setAlert]       = useState(null);

  const fetch = () => api.get('/api/returns').then(r => setReturns(r.data.data || [])).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const handleAction = async () => {
    try {
      await api.patch(`/api/returns/${selected.id}`, { status: action, refund_note: refundNote });
      setAlert({ type:'success', msg:`Return ${action}.` });
      fetch();
      setTimeout(() => { setSelected(null); setAlert(null); }, 1000);
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.message || 'Error.' });
    }
  };

  const statusBadge = (s) => {
    const map = { pending:'yellow', approved:'green', rejected:'red', refunded:'blue' };
    return <span className={`erp-badge erp-badge--${map[s] || 'gray'}`}>{s}</span>;
  };

  return (
    <div>
      <h1 className="erp-page-title">↩️ Returns & Refunds</h1>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th><th>Order</th><th>Customer</th><th>Reason</th>
                <th>Refund Amt</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No return requests.</td></tr>
              ) : returns.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>#{r.order_id}</td>
                  <td>{r.customer_name || '—'}</td>
                  <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.reason}
                  </td>
                  <td>₹{Number(r.refund_amount || 0).toFixed(2)}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'pending' && (
                      <button className="erp-btn erp-btn--secondary erp-btn--sm"
                        onClick={() => { setSelected(r); setAlert(null); setRefundNote(''); setAction('approved'); }}>
                        Review
                      </button>
                    )}
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
              <h3 className="erp-modal__title">Review Return #{selected.id}</h3>
              <button className="erp-modal__close" onClick={() => setSelected(null)}>×</button>
            </div>
            {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}
            <table className="erp-table" style={{ marginBottom:16 }}>
              <tbody>
                {[
                  ['Order',    `#${selected.order_id}`],
                  ['Customer', selected.customer_name || '—'],
                  ['Reason',   selected.reason],
                  ['Amount',   `₹${Number(selected.refund_amount || 0).toFixed(2)}`],
                ].map(([k,v]) => (
                  <tr key={k}><td style={{ fontWeight:600, width:100 }}>{k}</td><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="erp-form-group" style={{ marginBottom:14 }}>
              <label>Decision</label>
              <select value={action} onChange={e => setAction(e.target.value)}>
                <option value="approved">Approve (Refund)</option>
                <option value="rejected">Reject</option>
              </select>
            </div>
            <div className="erp-form-group" style={{ marginBottom:16 }}>
              <label>Internal Note</label>
              <textarea value={refundNote} onChange={e => setRefundNote(e.target.value)} placeholder="Optional note…" />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="erp-btn erp-btn--secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button className={`erp-btn ${action === 'approved' ? 'erp-btn--primary' : 'erp-btn--danger'}`}
                onClick={handleAction}>
                {action === 'approved' ? 'Approve & Refund' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
