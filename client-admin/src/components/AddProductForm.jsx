import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

/**
 * AddProductForm
 * Props:
 *  - onSuccess(product)  → called after a successful save
 *  - onClose()           → called when the modal should close
 *  - editData            → optional: pre-fill form for editing (pass null for add)
 *
 * Image upload:
 *  - Admin can pick a file (jpg/png/webp, ≤5 MB) — a live preview is shown
 *  - Or paste/type a direct URL into the image_url text field
 *  - File takes priority over typed URL when both are present
 *  - The form submits as multipart/form-data when a file is selected,
 *    or regular JSON when only a URL is provided
 */

const EMPTY = {
  name:           '',
  description:    '',
  price:          '',
  stock_quantity: '',
  category_id:    '',
  unit:           'kg',
  image_url:      '',
};

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function AddProductForm({ onSuccess, onClose, editData = null }) {
  const [form, setForm]           = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [alert, setAlert]         = useState(null);

  /* Image state */
  const [imageFile, setImageFile]     = useState(null);    // File object from <input>
  const [previewSrc, setPreviewSrc]   = useState(null);    // data: URL for preview
  const fileInputRef                  = useRef(null);

  /* Pre-fill when editing */
  useEffect(() => {
    if (editData) {
      setForm({
        name:           editData.name           || '',
        description:    editData.description    || '',
        price:          editData.price          || '',
        stock_quantity: editData.stock_quantity || '',
        category_id:    editData.category_id    || '',
        unit:           editData.unit           || 'kg',
        image_url:      editData.image_url      || '',
      });
      /* Show existing image as preview */
      if (editData.image_url) setPreviewSrc(editData.image_url);
    } else {
      setForm(EMPTY);
      setImageFile(null);
      setPreviewSrc(null);
    }
  }, [editData]);

  /* Fetch categories */
  useEffect(() => {
    api.get('/api/categories')
      .then(r => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  /* ── File picker handler ──────────────────────────────────────── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAlert({ type: 'error', msg: 'Please select an image file (jpg, png, webp…).' });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setAlert({ type: 'error', msg: 'Image must be under 5 MB.' });
      return;
    }

    setAlert(null);
    setImageFile(file);

    /* Generate an instant local preview using FileReader */
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewSrc(null);
    setForm(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Submit ───────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    /* Validation */
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setAlert({ type: 'error', msg: 'Product name is required.' });
      return;
    }
    const priceNum = Number(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0) {
      setAlert({ type: 'error', msg: 'Price must be a number greater than 0.' });
      return;
    }
    const stockNum = Number(form.stock_quantity);
    if (form.stock_quantity === '' || isNaN(stockNum) || stockNum < 0) {
      setAlert({ type: 'error', msg: 'Stock quantity must be 0 or more.' });
      return;
    }

    setLoading(true);

    try {
      let res;

      if (imageFile) {
        /* ── Multipart upload — file + fields ───────────────── */
        const fd = new FormData();
        fd.append('image',          imageFile);
        fd.append('name',           trimmedName);
        fd.append('description',    form.description.trim());
        fd.append('price',          priceNum);
        fd.append('stock_quantity', stockNum);
        fd.append('unit',           form.unit.trim() || 'kg');
        if (form.category_id) fd.append('category_id', form.category_id);

        if (editData) {
          res = await api.put(`/api/products/${editData.id}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          res = await api.post('/api/products/add', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        /* ── JSON — no file, image_url may be a typed URL ───── */
        const payload = {
          name:           trimmedName,
          description:    form.description.trim(),
          price:          priceNum,
          stock_quantity: stockNum,
          category_id:    form.category_id || null,
          unit:           form.unit.trim() || 'kg',
          image_url:      form.image_url.trim() || null,
        };

        if (editData) {
          res = await api.put(`/api/products/${editData.id}`, payload);
        } else {
          res = await api.post('/api/products/add', payload);
        }
      }

      setAlert({ type: 'success', msg: editData ? 'Product updated!' : 'Product added!' });
      if (onSuccess) onSuccess(res.data?.data || {});

      setTimeout(() => {
        setAlert(null);
        if (onClose) onClose();
      }, 900);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (editData) {
      setForm({
        name:           editData.name           || '',
        description:    editData.description    || '',
        price:          editData.price          || '',
        stock_quantity: editData.stock_quantity || '',
        category_id:    editData.category_id    || '',
        unit:           editData.unit           || 'kg',
        image_url:      editData.image_url      || '',
      });
      setPreviewSrc(editData.image_url || null);
    } else {
      setForm(EMPTY);
      setPreviewSrc(null);
    }
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAlert(null);
  };

  /* ── Resolved preview: file data URL > typed URL > existing DB url ── */
  const resolvedPreview = previewSrc || form.image_url || null;

  return (
    <div className="erp-modal-overlay" onClick={onClose}>
      <div
        className="erp-modal"
        style={{ maxWidth: 640, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
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
        <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
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

            {/* Stock */}
            <div className="erp-form-group">
              <label htmlFor="pf-stock">
                Stock Qty <span style={{ color: '#dc2626' }}>*</span>
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
                onChange={handleChange} placeholder="Write a short description…" rows={2} />
            </div>

            {/* ── Image section ─────────────────────────────── */}
            <div className="erp-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Product Image</label>

              <div style={{
                display: 'flex', gap: 16, alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}>

                {/* Preview box */}
                <div style={{
                  width: 110, height: 110, flexShrink: 0,
                  border: '2px dashed #d1d5db', borderRadius: 10,
                  background: '#f9fafb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'relative',
                }}>
                  {resolvedPreview ? (
                    <>
                      <img
                        src={resolvedPreview}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={clearImage}
                        title="Remove image"
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(0,0,0,0.55)', color: '#fff',
                          border: 'none', borderRadius: '50%',
                          width: 20, height: 20, cursor: 'pointer',
                          fontSize: 12, lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >×</button>
                    </>
                  ) : (
                    <span style={{ fontSize: 28, opacity: 0.25 }}>🖼️</span>
                  )}
                </div>

                {/* Controls */}
                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>

                  {/* File picker */}
                  <div>
                    <input
                      ref={fileInputRef}
                      id="pf-image-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      className="erp-btn erp-btn--secondary erp-btn--sm"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ width: '100%' }}
                    >
                      {imageFile ? `📎 ${imageFile.name}` : '📁 Choose image file…'}
                    </button>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      jpg / png / webp · max 5 MB
                    </p>
                  </div>

                  {/* Divider */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 11, color: '#9ca3af',
                  }}>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    <span>or paste URL</span>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  </div>

                  {/* URL input */}
                  <input
                    type="url"
                    name="image_url"
                    value={imageFile ? '' : form.image_url}
                    onChange={e => {
                      if (imageFile) return; // ignore typing when file is selected
                      handleChange(e);
                      setPreviewSrc(e.target.value || null);
                    }}
                    placeholder="https://example.com/image.jpg"
                    disabled={!!imageFile}
                    style={{
                      padding: '7px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: 7, fontSize: 12,
                      outline: 'none',
                      opacity: imageFile ? 0.4 : 1,
                      cursor: imageFile ? 'not-allowed' : 'text',
                    }}
                  />
                  {imageFile && (
                    <p style={{ fontSize: 11, color: '#6b7280' }}>
                      File selected — URL field disabled.{' '}
                      <button type="button" onClick={clearImage}
                        style={{ background: 'none', border: 'none', color: '#dc2626',
                          fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                        Remove file
                      </button>
                    </p>
                  )}
                </div>
              </div>
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
