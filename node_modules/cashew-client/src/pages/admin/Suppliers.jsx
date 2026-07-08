import { useEffect, useState } from 'react';
import api from '../../services/api';

const EMPTY = { name:'', contact_person:'', phone:'', email:'', address:'', gstin:'' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editing, setEditing]     = useState(null);
  const [alert, setAlert]         = useState(null);

  const fetch = () => api.get('/api/suppliers').then(r => setSuppliers(r.data.data || [])).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (s) => { setForm({...s}); setEditing(s.id); setModal(true); };
  const close    = () => { setModal(false); setAlert(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/api/suppliers/${editing}`, form);
      else         await api.post('/api/suppliers', form);
      setAlert({ type:'success', msg:'Saved.' });
      fetch();
      setTimeout(close, 800);
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.message || 'Error.' });
    }
  };

  const del = async (id) => {
    if (!confirm('Delete supplier?')) return;
    await api.delete(`/api/suppliers/${id}`).catch(() => {});
    fetch();
  };

  return (
    <div>
      <h1 className="erp-page-title">🤝 Supplier Management</h1>

      <div className="erp-toolbar">
        <span style={{ fontSize:13, color:'#555' }}>{suppliers.length} suppliers</span>
        <button className="erp-btn erp-btn--primary" onClick={openAdd}>+ Add Supplier</button>
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>GSTIN</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No suppliers yet.</td></tr>
              ) : suppliers.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.contact_person || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.gstin || '—'}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="erp-btn erp-btn--secondary erp-btn--sm" onClick={() => openEdit(s)}>Edit</button>
                    <button className="erp-btn erp-btn--danger erp-btn--sm" onClick={() => del(s.id)}>Delete</button>
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
              <h3 className="erp-modal__title">{editing ? 'Edit' : 'Add'} Supplier</h3>
              <button className="erp-modal__close" onClick={close}>×</button>
            </div>
            {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}
            <form onSubmit={handleSave} className="erp-form-grid">
              {[
                { key:'name',           label:'Company Name',    required:true  },
                { key:'contact_person', label:'Contact Person',  required:false },
                { key:'phone',          label:'Phone',           required:false },
                { key:'email',          label:'Email',           required:false },
                { key:'gstin',          label:'GSTIN',           required:false },
              ].map(f => (
                <div key={f.key} className="erp-form-group">
                  <label>{f.label}</label>
                  <input value={form[f.key]} required={f.required}
                    onChange={e => setForm({...form, [f.key]: e.target.value})} />
                </div>
              ))}
              <div className="erp-form-group" style={{ gridColumn:'1/-1' }}>
                <label>Address</label>
                <textarea value={form.address} onChange={e => setForm({...form, address:e.target.value})} />
              </div>
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
