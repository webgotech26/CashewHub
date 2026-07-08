import { useEffect, useState } from 'react';
import api from '../../services/api';

const EMPTY = { name:'', username:'', password:'', role:'manager' };

export default function AdminUsers() {
  const [admins, setAdmins]   = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [alert, setAlert]     = useState(null);

  const fetch = () => api.get('/api/admins').then(r => setAdmins(r.data.data || [])).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const close = () => { setModal(false); setAlert(null); setForm(EMPTY); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admins', form);
      setAlert({ type:'success', msg:'Admin user created.' });
      fetch();
      setTimeout(close, 800);
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.message || 'Error.' });
    }
  };

  const del = async (id) => {
    if (!confirm('Remove this admin?')) return;
    await api.delete(`/api/admins/${id}`).catch(() => {});
    fetch();
  };

  return (
    <div>
      <h1 className="erp-page-title">🛡️ Admin User Management (RBAC)</h1>

      <div className="erp-toolbar">
        <span style={{ fontSize:13, color:'#555' }}>{admins.length} admin users</span>
        <button className="erp-btn erp-btn--primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          + Add Admin
        </button>
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Username</th><th>Role</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No admin users.</td></tr>
              ) : admins.map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td><strong>{a.name}</strong></td>
                  <td>{a.username}</td>
                  <td><span className="erp-badge erp-badge--blue">{a.role || 'admin'}</span></td>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="erp-btn erp-btn--danger erp-btn--sm" onClick={() => del(a.id)}>Remove</button>
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
              <h3 className="erp-modal__title">Add Admin User</h3>
              <button className="erp-modal__close" onClick={close}>×</button>
            </div>
            {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}
            <form onSubmit={handleSave} className="erp-form-grid">
              {[
                { key:'name',     label:'Full Name',  type:'text'     },
                { key:'username', label:'Username',   type:'text'     },
                { key:'password', label:'Password',   type:'password' },
              ].map(f => (
                <div key={f.key} className="erp-form-group">
                  <label>{f.label}</label>
                  <input type={f.type} value={form[f.key]} required
                    onChange={e => setForm({...form, [f.key]: e.target.value})} />
                </div>
              ))}
              <div className="erp-form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
                  <option value="admin">Admin (Full Access)</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff (View Only)</option>
                </select>
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="erp-btn erp-btn--secondary" onClick={close}>Cancel</button>
                <button type="submit" className="erp-btn erp-btn--primary">Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
