import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import ProductGrid from '../../components/ProductGrid';
import { useCart } from '../../context/CartContext';

/* ── Product Detail Modal ──────────────────────────────────── */
function ProductModal({ product, onClose }) {
  const { addToCart } = useCart();
  if (!product) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 500, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580,
        overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Modal image */}
        {(() => {
          const n = (product.name || '').toLowerCase();
          let bg = 'linear-gradient(135deg,#C9972B,#F5C842)', emoji = '🥜';
          if (n.includes('w180')) { bg = 'linear-gradient(135deg,#7B3F00,#C68642)'; emoji = '🥇'; }
          else if (n.includes('w210')) { bg = 'linear-gradient(135deg,#8B4513,#D2691E)'; emoji = '⭐'; }
          else if (n.includes('w240')) { bg = 'linear-gradient(135deg,#A0522D,#DEB887)'; emoji = '✨'; }
          else if (n.includes('w320')) { bg = 'linear-gradient(135deg,#C9972B,#F5C842)'; emoji = '🏆'; }
          else if (n.includes('w450')) { bg = 'linear-gradient(135deg,#B8860B,#DAA520)'; emoji = '💛'; }
          else if (n.includes('roasted') && n.includes('salt')) { bg = 'linear-gradient(135deg,#8B0000,#CD5C5C)'; emoji = '🔥'; }
          else if (n.includes('roasted')) { bg = 'linear-gradient(135deg,#5C3317,#A0522D)'; emoji = '🍂'; }
          else if (n.includes('masala')) { bg = 'linear-gradient(135deg,#8B2500,#E25822)'; emoji = '🌶️'; }
          else if (n.includes('pepper')) { bg = 'linear-gradient(135deg,#2C2C2C,#696969)'; emoji = '🖤'; }
          else if (n.includes('broken')) { bg = 'linear-gradient(135deg,#6B6B3A,#B8B860)'; emoji = '💎'; }
          return (
            <div style={{ background: bg, height: 260, display: 'flex',
              alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
              {product.image_url
                ? <img src={product.image_url} alt={product.name}
                    style={{ height: '100%', width: '100%', objectFit: 'contain', padding: 20 }} />
                : <span style={{ fontSize: 90, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>{emoji}</span>
              }
              <button onClick={onClose} style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none',
                borderRadius: '50%', width: 32, height: 32, fontSize: 18,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>
          );
        })()}
        <div style={{ padding: '22px 26px', overflowY: 'auto' }}>
          {product.category_name && (
            <p style={{ fontSize: 10, fontWeight: 700, color: '#C9972B',
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
              {product.category_name}
            </p>
          )}
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22,
            fontWeight: 700, color: '#1A1A1A', marginBottom: 10 }}>{product.name}</h2>
          {product.description && (
            <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.7, marginBottom: 16 }}>
              {product.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22,
            padding: '12px 16px', background: '#FAFAFA', borderRadius: 10, border: '1px solid #EBEBEB' }}>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>
                ₹{Number(product.price).toFixed(2)}
              </p>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>per unit</p>
            </div>
            <p style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600,
              color: Number(product.stock_quantity) > 0 ? '#15803D' : '#B91C1C' }}>
              {Number(product.stock_quantity) > 0 ? `✓ In Stock` : '✗ Out of Stock'}
            </p>
          </div>
          <button
            disabled={Number(product.stock_quantity) <= 0}
            onClick={() => { addToCart(product); onClose(); }}
            style={{
              width: '100%', padding: 14, background: '#1A1A1A', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: Number(product.stock_quantity) <= 0 ? 'not-allowed' : 'pointer',
              opacity: Number(product.stock_quantity) <= 0 ? 0.5 : 1,
            }}
          >
            {Number(product.stock_quantity) <= 0 ? 'Out of Stock' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Catalog ──────────────────────────────────────────── */
export default function ProductCatalog() {
  const [products, setProducts]             = useState([]);
  const [categories, setCategories]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy]                 = useState('default');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { search = '' } = useOutletContext() || {};

  const fetchProducts = useCallback(() => {
    setLoading(true); setError(null);
    api.get('/api/products', { params: { limit: 100 } })
      .then(r => setProducts(r.data.data || []))
      .catch(err => {
        const s = err.response?.status;
        if (!err.response) setError('Cannot reach the server.');
        else if (s === 401 || s === 403) setError('Session expired. Please log in again.');
        else setError(`Failed to load products (${s}).`);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchCategories = useCallback(() => {
    api.get('/api/categories')
      .then(r => setCategories((r.data.data || []).filter(c => c.id && c.name)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

  // Filtered + sorted for main grid
  const filtered = products
    .filter(p => {
      const ms = p.name.toLowerCase().includes(search.toLowerCase());
      const mc = activeCategory === 'all' || String(p.category_id) === String(activeCategory);
      return ms && mc;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return Number(a.price) - Number(b.price);
      if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
      if (sortBy === 'name-asc')   return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <>
      {/* ── HERO ────────────────────────────────────────── */}
      <section className="shop-hero">
        <img src="/assets/Home.png" alt="" className="shop-hero__bg" aria-hidden="true" />
        
      </section>

      {/* ── TRUST BAR ───────────────────────────────────── */}
      <div className="shop-trust-bar">
        {[['🚚','Free Delivery above ₹499'],['✅','100% Natural & Fresh'],['🔒','Secure Payments'],['↩️','Easy Returns']].map(([icon, text]) => (
          <div key={text} className="shop-trust-item"><span>{icon}</span> {text}</div>
        ))}
      </div>

      {/* ── ALL PRODUCTS ─────────────────────────────────── */}
      <section id="products-section" className="home-section">
        <div className="home-section__inner">
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div className="shop-filter-bar" style={{ margin: 0 }}>
              <span className="shop-filter-bar__label">Filter:</span>
              <button className={`shop-filter-chip ${activeCategory === 'all' ? 'shop-filter-chip--active' : ''}`}
                onClick={() => setActiveCategory('all')}>All</button>
              {categories.map(c => (
                <button key={c.id}
                  className={`shop-filter-chip ${activeCategory === String(c.id) ? 'shop-filter-chip--active' : ''}`}
                  onClick={() => setActiveCategory(String(c.id))}>{c.name}</button>
              ))}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '8px 14px', border: '1.5px solid #EBEBEB', borderRadius: 30,
                fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans,sans-serif',
                outline: 'none', cursor: 'pointer', background: '#fff', color: '#4A4A4A' }}>
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A–Z</option>
            </select>
          </div>

          <div className="home-section__header" style={{ marginBottom: 20 }}>
            <div>
              <span className="home-section__label">🌰 Our Range</span>
              <h2 className="home-section__title">All Products</h2>
            </div>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>
              {loading ? 'Loading…' : `${filtered.length} products`}
            </span>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
              borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              ❌ {error}
              <button onClick={fetchProducts} style={{ marginLeft: 'auto', background: '#B91C1C',
                color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px',
                cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Retry</button>
            </div>
          )}

          <ProductGrid products={filtered} loading={loading} onCardClick={setSelectedProduct} />
        </div>
      </section>

      {/* ── ABOUT US ─────────────────────────────────────── */}
      

      {/* ── Product Detail Modal ────────────────────────── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
