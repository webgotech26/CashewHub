import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../services/api';
import '../../styles/pages/inventory.css';

/* ════════════════════════════════════════════════════════════════
   Admin Mobile Inventory — /admin/inventory
   Features:
   • 1→2→4 column responsive card grid
   • SVG cashew icon placeholder (no text)
   • Price hierarchy: current / strikethrough / % OFF badge
   • Inline stock stepper (- qty +) with debounced auto-save
   • ProtectedRoute (admin only) — enforced in App.jsx
   ════════════════════════════════════════════════════════════════ */

/* ── SVG Cashew Placeholder Icon ─────────────────────────────── */
function CashewIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Outer nut shape */}
      <path
        d="M32 8C20 8 12 18 14 30C16 42 26 56 32 56C38 56 48 42 50 30C52 18 44 8 32 8Z"
        fill="#A3A3A3" opacity="0.4"
      />
      {/* Inner detail */}
      <path
        d="M32 14C23 14 17 22 18.5 30C20 38 27 49 32 49C37 49 44 38 45.5 30C47 22 41 14 32 14Z"
        fill="#D1D5DB" opacity="0.5"
      />
      {/* Stem */}
      <path d="M32 8 C32 8 30 4 28 3 C26 2 25 4 27 5 C29 6 30 6 32 8Z"
        fill="#A3A3A3" opacity="0.4" />
    </svg>
  );
}

/* ── Skeleton Card ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="inv-card" style={{ pointerEvents: 'none' }}>
      <div className="inv-card__img-wrap">
        <div className="inv-skeleton" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="inv-card__body">
        <div className="inv-skeleton" style={{ height: 10, width: '40%' }} />
        <div className="inv-skeleton" style={{ height: 14, width: '75%', marginTop: 4 }} />
        <div className="inv-skeleton" style={{ height: 20, width: '50%', marginTop: 10 }} />
      </div>
      <div className="inv-card__footer">
        <div className="inv-skeleton" style={{ height: 34, borderRadius: 8 }} />
      </div>
    </div>
  );
}

/* ── Stock Stepper with Debounced Auto-Save ──────────────────── */
function StockControl({ productId, initialQty, onSaved }) {
  const [qty, setQty]       = useState(Number(initialQty) || 0);
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const debounceRef         = useRef(null);

  // Debounced save — fires 1 second after last change
  const scheduleSave = useCallback((newQty) => {
    clearTimeout(debounceRef.current);
    setStatus('saving');
    debounceRef.current = setTimeout(async () => {
      try {
        await api.put(`/api/products/${productId}`, { stock_quantity: newQty });
        setStatus('saved');
        if (onSaved) onSaved(productId, newQty);
        setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 1000);
  }, [productId, onSaved]);

  // Cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const change = (delta) => {
    const next = Math.max(0, qty + delta);
    setQty(next);
    scheduleSave(next);
  };

  const handleInput = (e) => {
    const val = parseInt(e.target.value, 10);
    const next = isNaN(val) || val < 0 ? 0 : val;
    setQty(next);
    scheduleSave(next);
  };

  const statusText = {
    idle:   '',
    saving: 'Saving…',
    saved:  '✓ Saved',
    error:  '✗ Save failed — retry',
  }[status];

  const statusClass = {
    saving: 'inv-stock-saving--active',
    saved:  'inv-stock-saving--active',
    error:  'inv-stock-saving--error',
  }[status] || '';

  return (
    <div>
      <span className="inv-card__footer-label">Stock Quantity</span>

      <div className="inv-stock-control" role="group" aria-label="Adjust stock quantity">
        <button
          type="button"
          className="inv-stock-btn inv-stock-btn--minus"
          onClick={() => change(-1)}
          disabled={qty <= 0}
          aria-label="Decrease stock by 1"
        >
          −
        </button>

        <input
          type="number"
          className="inv-stock-input"
          value={qty}
          min={0}
          onChange={handleInput}
          aria-label="Stock quantity"
        />

        <button
          type="button"
          className="inv-stock-btn"
          onClick={() => change(+1)}
          aria-label="Increase stock by 1"
        >
          +
        </button>
      </div>

      <div className={`inv-stock-saving ${statusClass}`}>
        {status === 'saving' && <span className="inv-spinner" aria-hidden="true" />}
        {statusText}
      </div>
    </div>
  );
}

/* ── Individual Product Card ─────────────────────────────────── */
function InventoryCard({ product, onStockSaved }) {
  const displayPrice = Number(product.price);
  const stock        = Number(product.stock_quantity);

  const stockBadge = () => {
    if (stock <= 0)  return { cls: 'inv-card__stock-badge--out',  label: 'Out of Stock' };
    if (stock <= 5)  return { cls: 'inv-card__stock-badge--low',  label: `Low: ${stock}` };
    if (stock <= 15) return { cls: 'inv-card__stock-badge--low',  label: `${stock} left` };
    return           { cls: 'inv-card__stock-badge--ok',   label: `${stock} in stock` };
  };

  const { cls, label } = stockBadge();

  return (
    <article className="inv-card" aria-label={`Product: ${product.name}`}>
      {/* Image */}
      <div className="inv-card__img-wrap">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="inv-card__img"
            loading="lazy"
          />
        ) : (
          <div className="inv-card__placeholder" role="img" aria-label="No image available">
            <CashewIcon size={64} />
          </div>
        )}

        {/* Discount badge removed — offer_price column dropped from DB */}

        {/* Stock badge */}
        <span className={`inv-card__stock-badge ${cls}`}>{label}</span>
      </div>

      {/* Body */}
      <div className="inv-card__body">
        {product.category_name && (
          <span className="inv-card__category">{product.category_name}</span>
        )}

        <h3 className="inv-card__name" title={product.name}>
          {product.name}
        </h3>

        {/* Price */}
        <div className="inv-card__price-row">
          <span className="inv-card__price" aria-label={`Price ₹${displayPrice.toFixed(2)}`}>
            ₹{displayPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Stock stepper */}
      <footer className="inv-card__footer">
        <StockControl
          productId={product.id}
          initialQty={product.stock_quantity}
          onSaved={onStockSaved}
        />
      </footer>
    </article>
  );
}

/* ── Main Inventory Page ─────────────────────────────────────── */
export default function Inventory() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');

  // Fetch all products
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/api/products', { params: { limit: 200 } })
      .then(r  => setProducts(r.data.data || []))
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load products.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Update local stock after debounced save
  const handleStockSaved = useCallback((productId, newQty) => {
    setProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, stock_quantity: newQty } : p)
    );
  }, []);

  // Client-side search
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category_name || '').toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalProducts = products.length;
  const lowStock      = products.filter(p => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 10).length;
  const outOfStock    = products.filter(p => Number(p.stock_quantity) <= 0).length;

  return (
    <main>
      {/* Header */}
      <header className="inv-header">
        <h1 className="inv-title">📦 Inventory</h1>
        <input
          type="search"
          className="inv-search"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search inventory"
        />
      </header>

      {/* Stats summary */}
      <div className="inv-stats" role="region" aria-label="Inventory summary">
        <div className="inv-stat">
          <span className="inv-stat__val">{totalProducts}</span>
          <span className="inv-stat__lbl">Total Products</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat__val inv-stat__val--warn">{lowStock}</span>
          <span className="inv-stat__lbl">Low Stock</span>
        </div>
        <div className="inv-stat">
          <span className="inv-stat__val inv-stat__val--danger">{outOfStock}</span>
          <span className="inv-stat__lbl">Out of Stock</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10,
        }} role="alert">
          ❌ {error}
          <button
            onClick={fetchProducts}
            style={{ marginLeft: 'auto', background: '#B91C1C', color: '#fff',
              border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Product card grid */}
      <div className="inv-grid" role="list" aria-label="Product inventory list">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="inv-empty">
            <span className="inv-empty__icon">🔍</span>
            <p className="inv-empty__text">No products found</p>
            <p className="inv-empty__sub">Try a different search term</p>
          </div>
        ) : (
          filtered.map(product => (
            <InventoryCard
              key={product.id}
              product={product}
              onStockSaved={handleStockSaved}
            />
          ))
        )}
      </div>
    </main>
  );
}
