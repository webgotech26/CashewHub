import { useEffect, useState } from 'react';
import api from '../../services/api';

const EMPTY = { supplier_id:'', product_id:'', quantity:'', unit_cost:'', batch_number:'', expiry_date:'', notes:'' };

export default function Purchases() {
  const [purchases, setPurchases]   = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [products, setProducts]     = useState([]);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [alert, setAlert]           = useState(null);

  const fetch = () => api.get('/api/purchases').then(r => setPurchases(r.data.data || [])).catch(() => {});

  useEffect(() => {
    fetch();
    api.get('/api/suppliers').then(r => setSuppliers(r.data.data || [])).catch(() => {});
    api.get('/api/products?limit=200').then(r => setProducts(r.data.data || [])).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/purchases', form);
      setAlert({ type:'success', msg:'Purchase recorded. Stock updated.' });
      fetch();
      setTimeout(() => { setModal(false); setAlert(null); setForm(EMPTY); }, 1200);
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.message || 'Error.' });
    }
  };

  const statusBadge = (s) => {
    const map = { received:'green', ordered:'yellow', partial:'blue', returned:'red' };
    return <span className={`erp-badge erp-badge--${map[s] || 'gray'}`}>{s || '—'}</span>;
  };

  return (
    <div>
      <h1 className="erp-page-title">🏭 Purchase Management</h1>

      <div className="erp-toolbar">
        <span style={{ fontSize:13, color:'#555' }}>{purchases.length} purchase records</span>
        <button className="erp-btn erp-btn--primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          + New Purchase
        </button>
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th><th>Supplier</th><th>Product</th><th>Qty</th>
                <th>Unit Cost</th><th>Total</th><th>Batch</th><th>Expiry</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No purchases yet.</td></tr>
              ) : purchases.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.supplier_name || p.supplier_id}</td>
                  <td>{p.product_name  || p.product_id}</td>
                  <td>{p.quantity}</td>
                  <td>₹{Number(p.unit_cost).toFixed(2)}</td>
                  <td>₹{Number(p.total_cost || p.quantity * p.unit_cost).toFixed(2)}</td>
                  <td>{p.batch_number || '—'}</td>
                  <td>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '—'}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="erp-modal-overlay" onClick={() => setModal(false)}>
          <div className="erp-modal" style={{ maxWidth:620 }} onClick={e => e.stopPropagation()}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">Record Purchase</h3>
              <button className="erp-modal__close" onClick={() => setModal(false)}>×</button>
            </div>
            {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}
            <form onSubmit={handleSave} className="erp-form-grid">
              <div className="erp-form-group">
                <label>Supplier</label>
                <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id:e.target.value})} required>
                  <option value="">-- Select --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="erp-form-group">
                <label>Product</label>
                <select value={form.product_id} onChange={e => setForm({...form, product_id:e.target.value})} required>
                  <option value="">-- Select --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {[
                { key:'quantity',     label:'Quantity',      type:'number' },
                { key:'unit_cost',    label:'Unit Cost (₹)', type:'number' },
                { key:'batch_number', label:'Batch Number',  type:'text'   },
                { key:'expiry_date',  label:'Expiry Date',   type:'date'   },
              ].map(f => (
                <div key={f.key} className="erp-form-group">
                  <label>{f.label}</label>
                  <input type={f.type} value={form[f.key]} required={['quantity','unit_cost'].includes(f.key)}
                    onChange={e => setForm({...form, [f.key]: e.target.value})} />
                </div>
              ))}
              <div className="erp-form-group" style={{ gridColumn:'1/-1' }}>
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} />
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="erp-btn erp-btn--secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="erp-btn erp-btn--primary">Record Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
