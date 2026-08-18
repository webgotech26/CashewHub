import { useEffect, useState } from 'react';
import api from '../../services/api';
import AddProductForm from '../../components/AddProductForm';

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState(false);
  const [editData, setEditData]   = useState(null);
  const [alert, setAlert]         = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { product, type }

  const fetchProducts = () =>
    api.get(`/api/products?admin=true&search=${search}&page=${page}&limit=15`)
      .then(r => setProducts(r.data.data || []))
      .catch(() => {});

  useEffect(() => { fetchProducts(); }, [search, page]);

  const openAdd  = () => { setEditData(null); setModal(true); };
  const openEdit = (p) => { setEditData(p); setModal(true); };

  const closeModal = () => { setModal(false); setEditData(null); };

  const handleFormSuccess = () => {
    closeModal();
    fetchProducts();
    setAlert({ type: 'success', msg: editData ? 'Product updated.' : 'Product added.' });
    setTimeout(() => setAlert(null), 3000);
  };

  /* ── Delete — catches FK errors and prompts deactivate instead ── */
  const handleDelete = async (product) => {
    if (!confirm(`Permanently delete "${product.name}"?`)) return;
    try {
      await api.delete(`/api/products/${product.id}`);
      fetchProducts();
      setAlert({ type: 'success', msg: 'Product deleted.' });
      setTimeout(() => setAlert(null), 2500);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.has_orders) {
        /* Product has orders — offer safe alternatives */
        setConfirmModal({ product, type: 'deactivate_prompt' });
      } else {
        setAlert({ type: 'error', msg: err.response?.data?.message || 'Delete failed.' });
      }
    }
  };

  /* ── Deactivate — set stock = 0 and is_active = 0 ── */
  const handleDeactivate = async (product) => {
    try {
      await api.patch(`/api/products/${product.id}/deactivate`);
      fetchProducts();
      setConfirmModal(null);
      setAlert({ type: 'success', msg: `"${product.name}" deactivated — hidden from shop.` });
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Deactivation failed.' });
      setConfirmModal(null);
    }
  };

  /* ── Reactivate — set is_active = 1 ── */
  const handleReactivate = async (product) => {
    try {
      await api.patch(`/api/products/${product.id}/reactivate`);
      fetchProducts();
      setAlert({ type: 'success', msg: `"${product.name}" reactivated.` });
      setTimeout(() => setAlert(null), 2500);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Reactivation failed.' });
    }
  };

  const stockBadge = (qty, isActive) => {
    if (isActive === 0 || isActive === false) {
      return <span className="erp-badge erp-badge--gray">Inactive</span>;
    }
    const n = Number(qty);
    if (n <= 0)  return <span className="erp-badge erp-badge--red">Out of Stock</span>;
    if (n <= 10) return <span className="erp-badge erp-badge--yellow">Low ({n})</span>;
    return <span className="erp-badge erp-badge--green">{n}</span>;
  };

  return (
    <div>
      <h1 className="erp-page-title">🥜 Product Management</h1>

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
                  <td colSpan={7}>
                    <div className="erp-empty">
                      <div className="erp-empty__icon">📭</div>
                      <div className="erp-empty__text">No products found.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const inactive = p.is_active === 0 || p.is_active === false;
                  return (
                    <tr key={p.id} style={{ opacity: inactive ? 0.6 : 1 }}>
                      <td style={{ color: '#9ca3af', fontSize: 12 }}>{p.id}</td>
                      <td>
                        <strong style={{ color: '#1a3c2e' }}>{p.name}</strong>
                        {inactive && (
                          <span style={{ marginLeft:6, fontSize:10, fontWeight:700,
                            color:'#6b7280', background:'#f3f4f6',
                            padding:'1px 6px', borderRadius:8 }}>
                            inactive
                          </span>
                        )}
                        {p.description && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                            {p.description.slice(0, 50)}{p.description.length > 50 ? '…' : ''}
                          </div>
                        )}
                      </td>
                      <td>{p.category_name || (p.category_id ? `Cat #${p.category_id}` : '—')}</td>
                      <td style={{ fontWeight: 700 }}>₹{Number(p.price).toFixed(2)}</td>
                      <td>{stockBadge(p.stock_quantity, p.is_active)}</td>
                      <td style={{ color: '#6b7280', fontSize: 12 }}>{p.unit}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="erp-btn erp-btn--secondary erp-btn--sm"
                            onClick={() => openEdit(p)}
                          >
                            Edit
                          </button>
                          {inactive ? (
                            <button
                              className="erp-btn erp-btn--sm"
                              style={{ background: '#2d6a4f', color: '#fff' }}
                              onClick={() => handleReactivate(p)}
                              title="Set is_active = 1"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              className="erp-btn erp-btn--sm"
                              style={{ background: '#6b7280', color: '#fff' }}
                              onClick={() => {
                                if (confirm(`Deactivate "${p.name}"? It will be hidden and stock set to 0.`)) {
                                  handleDeactivate(p);
                                }
                              }}
                              title="Set stock = 0 and hide from shop"
                            >
                              Deactivate
                            </button>
                          )}
                          <button
                            className="erp-btn erp-btn--danger erp-btn--sm"
                            onClick={() => handleDelete(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* ── Add / Edit modal ── */}
      {modal && (
        <AddProductForm
          editData={editData}
          onSuccess={handleFormSuccess}
          onClose={closeModal}
        />
      )}

      {/* ── FK conflict modal — offer deactivate instead of delete ── */}
      {confirmModal?.type === 'deactivate_prompt' && (
        <div className="erp-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="erp-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">⚠️ Cannot Delete Product</h3>
              <button className="erp-modal__close" onClick={() => setConfirmModal(null)}>×</button>
            </div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 20 }}>
              <strong>"{confirmModal.product.name}"</strong> has existing order records and
              cannot be permanently deleted.
              <br /><br />
              You can <strong>deactivate</strong> it instead — this sets the stock to 0 and
              hides it from the customer shop while keeping order history intact.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="erp-btn erp-btn--secondary" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                className="erp-btn"
                style={{ background: '#2d6a4f', color: '#fff' }}
                onClick={() => handleDeactivate(confirmModal.product)}
              >
                Deactivate Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
