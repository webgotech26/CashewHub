import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Categories() {
  const [cats, setCats]       = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState({ name:'', description:'' });
  const [editing, setEditing] = useState(null);
  const [alert, setAlert]     = useState(null);

  const fetch = () => api.get('/api/categories').then(r => setCats(r.data.data || [])).catch(() => {});

  useEffect(() => { fetch(); }, []);

  const openAdd  = () => { setForm({ name:'', description:'' }); setEditing(null); setModal(true); };
  const openEdit = (c) => { setForm({ name: c.name, description: c.description||'' }); setEditing(c.id); setModal(true); };
  const close    = () => { setModal(false); setAlert(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/api/categories/${editing}`, form);
      else         await api.post('/api/categories', form);
      setAlert({ type:'success', msg: 'Saved.' });
      fetch();
      setTimeout(close, 800);
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.message || 'Error.' });
    }
  };

  const del = async (id) => {
    if (!confirm('Delete category?')) return;
    await api.delete(`/api/categories/${id}`).catch(() => {});
    fetch();
  };

  return (
    <div>
      <h1 className="erp-page-title">🗂️ Category Management</h1>

      <div className="erp-toolbar">
        <span style={{ color:'#555', fontSize:13 }}>{cats.length} categories</span>
        <button className="erp-btn erp-btn--primary" onClick={openAdd}>+ Add Category</button>
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {cats.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No categories yet.</td></tr>
              ) : cats.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.description || '—'}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="erp-btn erp-btn--secondary erp-btn--sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="erp-btn erp-btn--danger erp-btn--sm" onClick={() => del(c.id)}>Delete</button>
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
              <h3 className="erp-modal__title">{editing ? 'Edit' : 'Add'} Category</h3>
              <button className="erp-modal__close" onClick={close}>×</button>
            </div>
            {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}
            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="erp-form-group">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
              </div>
              <div className="erp-form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
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
