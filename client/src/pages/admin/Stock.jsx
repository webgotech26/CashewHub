import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Stock() {
  const [stock, setStock]   = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ product_id:'', quantity_in:0, quantity_out:0, notes:'' });
  const [products, setProducts] = useState([]);
  const [alert, setAlert]   = useState(null);

  const fetch = () =>
    api.get(`/api/stock?search=${search}`)
      .then(r => setStock(r.data.data || [])).catch(() => {});

  useEffect(() => {
    fetch();
    api.get('/api/products?limit=200').then(r => setProducts(r.data.data || [])).catch(() => {});
  }, [search]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/stock', form);
      setAlert({ type:'success', msg:'Stock entry recorded.' });
      fetch();
      setTimeout(() => { setModal(false); setAlert(null); }, 1000);
    } catch (err) {
      setAlert({ type:'error', msg: err.response?.data?.message || 'Error.' });
    }
  };

  const levelBadge = (qty) => {
    if (qty <= 0)  return <span className="erp-badge erp-badge--red">Out</span>;
    if (qty <= 10) return <span className="erp-badge erp-badge--yellow">Low</span>;
    return <span className="erp-badge erp-badge--green">OK</span>;
  };

  return (
    <div>
      <h1 className="erp-page-title">📦 Stock Management</h1>

      <div className="erp-toolbar">
        <input className="erp-toolbar__search" placeholder="Search products…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <button className="erp-btn erp-btn--primary" onClick={() => { setForm({ product_id:'', quantity_in:0, quantity_out:0, notes:'' }); setModal(true); }}>
          + Stock Entry
        </button>
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Product</th><th>Current Stock</th><th>Unit</th>
                <th>Total In</th><th>Total Out</th><th>Level</th>
              </tr>
            </thead>
            <tbody>
              {stock.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'#aaa', padding:30 }}>No stock data.</td></tr>
              ) : stock.map((s, i) => (
                <tr key={i}>
                  <td><strong>{s.product_name || s.product}</strong></td>
                  <td>{s.current_balance ?? s.stock_quantity}</td>
                  <td>{s.unit}</td>
                  <td>{s.total_in || '—'}</td>
                  <td>{s.total_out || '—'}</td>
                  <td>{levelBadge(s.current_balance ?? s.stock_quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="erp-modal-overlay" onClick={() => setModal(false)}>
          <div className="erp-modal" onClick={e => e.stopPropagation()}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">New Stock Entry</h3>
              <button className="erp-modal__close" onClick={() => setModal(false)}>×</button>
            </div>
            {alert && <div className={`erp-alert erp-alert--${alert.type}`}>{alert.msg}</div>}
            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="erp-form-group">
                <label>Product</label>
                <select value={form.product_id} onChange={e => setForm({...form, product_id:e.target.value})} required>
                  <option value="">-- Select --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="erp-form-grid">
                <div className="erp-form-group">
                  <label>Quantity In</label>
                  <input type="number" min={0} value={form.quantity_in}
                    onChange={e => setForm({...form, quantity_in:e.target.value})} />
                </div>
                <div className="erp-form-group">
                  <label>Quantity Out</label>
                  <input type="number" min={0} value={form.quantity_out}
                    onChange={e => setForm({...form, quantity_out:e.target.value})} />
                </div>
              </div>
              <div className="erp-form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="erp-btn erp-btn--secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="erp-btn erp-btn--primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
