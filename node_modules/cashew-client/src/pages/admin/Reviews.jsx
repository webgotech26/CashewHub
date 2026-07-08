import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter]   = useState('pending');
  const [alert, setAlert]     = useState(null);

  const fetch = () =>
    api.get(`/api/reviews?status=${filter}`)
      .then(r => setReviews(r.data.data || [])).catch(() => {});

  useEffect(() => { fetch(); }, [filter]);

  const moderate = async (id, status) => {
    try {
      await api.patch(`/api/reviews/${id}`, { status });
      setAlert({ type:'success', msg:`Review ${status}.` });
      fetch();
      setTimeout(() => setAlert(null), 2000);
    } catch {
      setAlert({ type:'error', msg:'Error.' });
    }
  };

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div>
      <h1 className="erp-page-title">⭐ Review Moderation</h1>

      {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}

      <div className="erp-toolbar">
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} className={`erp-btn erp-btn--sm ${filter === s ? 'erp-btn--primary' : 'erp-btn--secondary'}`}
            onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th><th>Customer</th><th>Product</th><th>Rating</th>
                <th>Review</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No reviews in this state.</td></tr>
              ) : reviews.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.customer_name || '—'}</td>
                  <td>{r.product_name  || '—'}</td>
                  <td style={{ color:'#f59e0b', letterSpacing:1 }}>{stars(r.rating)}</td>
                  <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.comment || '—'}
                  </td>
                  <td>
                    <span className={`erp-badge erp-badge--${r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'yellow'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    {r.status !== 'approved'  && <button className="erp-btn erp-btn--primary erp-btn--sm" onClick={() => moderate(r.id, 'approved')}>Approve</button>}
                    {r.status !== 'rejected'  && <button className="erp-btn erp-btn--danger erp-btn--sm"  onClick={() => moderate(r.id, 'rejected')}>Reject</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
