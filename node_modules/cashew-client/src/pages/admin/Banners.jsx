import { useEffect, useState } from 'react';
import api from '../../services/api';

const EMPTY = { title:'', image_url:'', link_url:'', position:'home_top', active:true };

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [alert, setAlert]     = useState(null);

  const fetch = () => api.get('/api/banners').then(r => setBanners(r.data.data || [])).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const openEdit = (b) => { setForm({...b}); setEditing(b.id); setModal(true); };
  const close    = () => { setModal(false); setAlert(null); setEditing(null); setForm(EMPTY); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/api/banners/${editing}`, form);
      else         await api.post('/api/banners', form);
      setAlert({ type:'success', msg:'Banner saved.' });
      fetch();
      setTimeout(close, 800);
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.message || 'Error.' });
    }
  };

  const del = async (id) => {
    if (!confirm('Delete banner?')) return;
    await api.delete(`/api/banners/${id}`).catch(() => {});
    fetch();
  };

  return (
    <div>
      <h1 className="erp-page-title">🖼️ Banner / CMS Management</h1>

      <div className="erp-toolbar">
        <span style={{ fontSize:13, color:'#555' }}>{banners.length} banners</span>
        <button className="erp-btn erp-btn--primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}>
          + Add Banner
        </button>
      </div>

      <div className="erp-card">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16 }}>
          {banners.length === 0 ? (
            <p style={{ color:'#aaa', padding:20, gridColumn:'1/-1', textAlign:'center' }}>No banners yet.</p>
          ) : banners.map(b => (
            <div key={b.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden', background:'#fff' }}>
              {b.image_url && (
                <img src={b.image_url} alt={b.title}
                  style={{ width:'100%', height:120, objectFit:'cover', display:'block' }} />
              )}
              <div style={{ padding:'12px 14px' }}>
                <p style={{ fontWeight:600, marginBottom:4 }}>{b.title}</p>
                <p style={{ fontSize:12, color:'#888', marginBottom:8 }}>{b.position}</p>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span className={`erp-badge erp-badge--${b.active ? 'green' : 'gray'}`}>
                    {b.active ? 'Active' : 'Hidden'}
                  </span>
                  <button className="erp-btn erp-btn--secondary erp-btn--sm" onClick={() => openEdit(b)}>Edit</button>
                  <button className="erp-btn erp-btn--danger erp-btn--sm" onClick={() => del(b.id)}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="erp-modal-overlay" onClick={close}>
          <div className="erp-modal" onClick={e => e.stopPropagation()}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">{editing ? 'Edit' : 'Add'} Banner</h3>
              <button className="erp-modal__close" onClick={close}>×</button>
            </div>
            {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}
            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { key:'title',     label:'Title',     required:true  },
                { key:'image_url', label:'Image URL', required:false },
                { key:'link_url',  label:'Link URL',  required:false },
              ].map(f => (
                <div key={f.key} className="erp-form-group">
                  <label>{f.label}</label>
                  <input value={form[f.key]} required={f.required}
                    onChange={e => setForm({...form, [f.key]: e.target.value})} />
                </div>
              ))}
              <div className="erp-form-group">
                <label>Position</label>
                <select value={form.position} onChange={e => setForm({...form, position:e.target.value})}>
                  {['home_top','home_mid','home_bottom','sidebar','popup'].map(p =>
                    <option key={p} value={p}>{p}</option>
                  )}
                </select>
              </div>
              <div className="erp-form-group">
                <label>
                  <input type="checkbox" checked={form.active}
                    onChange={e => setForm({...form, active: e.target.checked})}
                    style={{ marginRight:6 }} />
                  Active
                </label>
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
