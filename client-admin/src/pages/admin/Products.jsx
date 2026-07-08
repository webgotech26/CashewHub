import { useEffect, useState } from 'react';
import api from '../../services/api';
import AddProductForm from '../../components/AddProductForm';

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState(false);   // add modal
  const [editData, setEditData]   = useState(null);    // null = add, object = edit
  const [alert, setAlert]         = useState(null);    // page-level alert

  const fetchProducts = () =>
    api.get(`/api/products?search=${search}&page=${page}&limit=15`)
      .then(r => setProducts(r.data.data || []))
      .catch(() => {});

  useEffect(() => { fetchProducts(); }, [search, page]);

  // Open modal for ADD
  const openAdd = () => {
    setEditData(null);
    setModal(true);
  };

  // Open modal for EDIT
  const openEdit = (p) => {
    setEditData(p);
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditData(null);
  };

  // Called by AddProductForm on success
  const handleFormSuccess = () => {
    fetchProducts();
    setAlert({ type: 'success', msg: editData ? 'Product updated.' : 'Product added.' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      fetchProducts();
      setAlert({ type: 'success', msg: 'Product deleted.' });
      setTimeout(() => setAlert(null), 2500);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Delete failed.' });
    }
  };

  const stockBadge = (qty) => {
    const n = Number(qty);
    if (n <= 0)  return <span className="erp-badge erp-badge--red">Out of Stock</span>;
    if (n <= 10) return <span className="erp-badge erp-badge--yellow">Low ({n})</span>;
    return <span className="erp-badge erp-badge--green">{n}</span>;
  };

  return (
    <div>
      <h1 className="erp-page-title">🥜 Product Management</h1>

      {/* Page-level alert */}
      {alert && (
        <div className={`erp-alert erp-alert--${alert.type}`}>
          {alert.type === 'success' ? '✅ ' : '❌ '}{alert.msg}
        </div>
      )}

      <div className="erp-toolbar">
        <input
          className="erp-toolbar__search"
          placeholder="Search products…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <button className="erp-btn erp-btn--primary" onClick={openAdd}>
          + Add Product
        </button>
      </div>

      <div className="erp-card">
        <div className="erp-table-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price (₹)</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="erp-empty">
                      <div className="erp-empty__icon">📭</div>
                      <div className="erp-empty__text">No products found.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>{p.id}</td>
                    <td>
                      <strong style={{ color: '#1a3c2e' }}>{p.name}</strong>
                      {p.description && (
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {p.description.slice(0, 50)}{p.description.length > 50 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td>{p.category_name || (p.category_id ? `Cat #${p.category_id}` : '—')}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(p.price).toFixed(2)}</td>
                    <td>{stockBadge(p.stock_quantity)}</td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{p.unit}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="erp-btn erp-btn--secondary erp-btn--sm"
                          onClick={() => openEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="erp-btn erp-btn--danger erp-btn--sm"
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="erp-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page}</span>
          <button disabled={products.length < 15} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>

      {/* Add / Edit modal — uses AddProductForm component */}
      {modal && (
        <AddProductForm
          editData={editData}
          onSuccess={handleFormSuccess}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
