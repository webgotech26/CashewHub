import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * AddProductForm
 * Props:
 *  - onSuccess(product)  → called after a successful save
 *  - onClose()           → called when the modal should close
 *  - editData            → optional: pre-fill form for editing (pass null for add)
 *
 * Note: offer_price removed — column dropped from the products table.
 */

const EMPTY = {
  name:           '',
  description:    '',
  price:          '',
  stock_quantity: '',
  category_id:    '',
  unit:           'kg',
};

export default function AddProductForm({ onSuccess, onClose, editData = null }) {
  const [form, setForm]             = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [alert, setAlert]           = useState(null);

  // Pre-fill when editing
  useEffect(() => {
    if (editData) {
      setForm({
        name:           editData.name           || '',
        description:    editData.description    || '',
        price:          editData.price          || '',
        stock_quantity: editData.stock_quantity || '',
        category_id:    editData.category_id    || '',
        unit:           editData.unit           || 'kg',
      });
    } else {
      setForm(EMPTY);
    }
  }, [editData]);

  // Fetch categories for the dropdown
  useEffect(() => {
    api.get('/api/categories')
      .then(r  => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    const payload = {
      name:           form.name.trim(),
      description:    form.description.trim(),
      price:          Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      category_id:    form.category_id || null,
      unit:           form.unit.trim(),
    };

    try {
      let res;
      if (editData) {
        res = await api.put(`/api/products/${editData.id}`, payload);
      } else {
        res = await api.post('/api/products/add', payload);
      }

      setAlert({ type: 'success', msg: editData ? 'Product updated successfully!' : 'Product added successfully!' });
      if (onSuccess) onSuccess(res.data?.data || payload);
      setTimeout(() => { setAlert(null); if (onClose) onClose(); }, 1400);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(editData ? {
      name:           editData.name           || '',
      description:    editData.description    || '',
      price:          editData.price          || '',
      stock_quantity: editData.stock_quantity || '',
      category_id:    editData.category_id    || '',
      unit:           editData.unit           || 'kg',
    } : EMPTY);
    setAlert(null);
  };

  return (
    <div className="erp-modal-overlay" onClick={onClose}>
      <div className="erp-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="erp-modal__header">
          <div>
            <h3 className="erp-modal__title">
              {editData ? '✏️ Edit Product' : '🥜 Add New Product'}
            </h3>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
              {editData ? 'Update the product details below.' : 'Fill in the details to add a product to your catalogue.'}
            </p>
          </div>
          <button className="erp-modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`erp-alert erp-alert--${alert.type}`} role="alert">
            {alert.type === 'success' ? '✅ ' : '❌ '}{alert.msg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="erp-form-grid" style={{ marginBottom: 16 }}>

            {/* Name */}
            <div className="erp-form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="pf-name">
                Product Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input id="pf-name" type="text" name="name" value={form.name}
                onChange={handleChange} placeholder="e.g. Premium Cashew W240"
                required maxLength={150} />
            </div>

            {/* Price */}
            <div className="erp-form-group">
              <label htmlFor="pf-price">
                Price (₹) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input id="pf-price" type="number" name="price" value={form.price}
                onChange={handleChange} placeholder="0.00" min="0" step="0.01" required />
            </div>

            {/* Stock Quantity */}
            <div className="erp-form-group">
              <label htmlFor="pf-stock">
                Stock Quantity <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input id="pf-stock" type="number" name="stock_quantity" value={form.stock_quantity}
                onChange={handleChange} placeholder="0" min="0" step="0.01" required />
            </div>

            {/* Unit */}
            <div className="erp-form-group">
              <label htmlFor="pf-unit">Unit</label>
              <select id="pf-unit" name="unit" value={form.unit} onChange={handleChange}>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="pcs">pcs</option>
                <option value="box">box</option>
                <option value="packet">packet</option>
              </select>
            </div>

            {/* Category */}
            <div className="erp-form-group">
              <label htmlFor="pf-cat">Category</label>
              <select id="pf-cat" name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">-- Select Category --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="erp-form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="pf-desc">Description</label>
              <textarea id="pf-desc" name="description" value={form.description}
                onChange={handleChange} placeholder="Write a short description…" rows={3} />
            </div>

          </div>

          {/* Price preview */}
          {form.price && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 13,
            }}>
              <span style={{ color: '#6b7280' }}>Price:</span>
              <span style={{ fontWeight: 700, color: '#1a3c2e', fontSize: 16 }}>
                ₹{Number(form.price).toFixed(2)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <button type="button" className="erp-btn erp-btn--secondary erp-btn--sm"
              onClick={handleReset} disabled={loading}>
              Reset
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="erp-btn erp-btn--secondary"
                onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="erp-btn erp-btn--primary"
                disabled={loading} style={{ minWidth: 120 }}>
                {loading
                  ? (editData ? 'Updating…' : 'Adding…')
                  : (editData ? 'Update Product' : '+ Add Product')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
