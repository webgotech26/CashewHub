import { useEffect, useState } from 'react';
import api from '../../services/api';

const EMPTY = { code:'', discount_type:'percentage', discount_value:'', min_order:'', max_uses:'', expiry_date:'', active:true };

export default function Coupons() {
  const [coupons, setCoupons]   = useState([]);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [alert, setAlert]       = useState(null);

  const fetch = () => api.get('/api/coupons').then(r => setCoupons(r.data.data || [])).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const openEdit = (c) => { setForm({...c}); setEditing(c.id); setModal(true); };
  const close    = () => { setModal(false); setAlert(null); setForm(EMPTY); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/api/coupons/${editing}`, form);
      else         await api.post('/api/coupons', form);
      setAlert({ type:'success', msg:'Coupon saved.' });
      fetch();
      setTimeout(close, 800);
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.message || 'Error.' });
    }
  };

  const toggle = async (c) => {
    await api.patch(`/api/coupons/${c.id}`, { active: !c.active }).catch(() => {});
    fetch();
  };

  return (
    <div>
      <h1 className="erp-page-title">🎟️ Coupon Management</h1>

      <div className="erp-toolbar">
        <span style={{ fontSize:13, color:'#555' }}>{coupons.length} coupons</span>
        <button className="erp-btn erp-btn--primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}>
          + Add Coupon
        </button>
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Code</th><th>Type</th><th>Value</th><th>Min Order</th>
                <th>Max Uses</th><th>Used</th><th>Expiry</th><th>Active</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No coupons yet.</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.discount_type}</td>
                  <td>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                  <td>{c.min_order ? `₹${c.min_order}` : '—'}</td>
                  <td>{c.max_uses || '∞'}</td>
                  <td>{c.used_count || 0}</td>
                  <td>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className={`erp-badge erp-badge--${c.active ? 'green' : 'gray'}`}>
                      {c.active ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="erp-btn erp-btn--secondary erp-btn--sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="erp-btn erp-btn--sm" style={{ background: c.active ? '#6b7280' : '#2d6a4f', color:'#fff' }}
                      onClick={() => toggle(c)}>
                      {c.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="erp-modal-overlay" onClick={close}>
          <div className="erp-modal" onClick={e => e.stopPropagation()}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">{editing ? 'Edit' : 'Add'} Coupon</h3>
              <button className="erp-modal__close" onClick={close}>×</button>
            </div>
            {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}
            <form onSubmit={handleSave} className="erp-form-grid">
              <div className="erp-form-group">
                <label>Code</label>
                <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required />
              </div>
              <div className="erp-form-group">
                <label>Discount Type</label>
                <select value={form.discount_type} onChange={e => setForm({...form, discount_type:e.target.value})}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              {[
                { key:'discount_value', label:'Discount Value',    type:'number' },
                { key:'min_order',      label:'Min Order Amt (₹)', type:'number' },
                { key:'max_uses',       label:'Max Uses',          type:'number' },
                { key:'expiry_date',    label:'Expiry Date',       type:'date'   },
              ].map(f => (
                <div key={f.key} className="erp-form-group">
                  <label>{f.label}</label>
                  <input type={f.type} value={form[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    required={f.key === 'discount_value'} />
                </div>
              ))}
              <div style={{ gridColumn:'1/-1', display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="erp-btn erp-btn--secondary" onClick={close}>Cancel</button>
                <button type="submit" className="erp-btn erp-btn--primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
