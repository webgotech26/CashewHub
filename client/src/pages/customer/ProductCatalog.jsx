import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

/* ── Static product data (fallback + category mapping) ────── */
const STATIC_PRODUCTS = [
  { id: 1, name: 'Premium 210',    price: 1100, weight: '1 kg',   category: 'Premium',  image: '/assets/1kg.png'   },
  { id: 2, name: 'Premium 210',    price:  550, weight: '500 g',  category: 'Premium',  image: '/assets/1.5kg.png' },
  { id: 3, name: 'Standard 240',   price:  970, weight: '1 kg',   category: 'Standard', image: '/assets/1kg.png'   },
  { id: 4, name: 'Standard 240',   price:  485, weight: '500 g',  category: 'Standard', image: '/assets/1.5kg.png' },
  { id: 5, name: 'Economy 320',    price:  890, weight: '1 kg',   category: 'Economy',  image: '/assets/1kg.png'   },
  { id: 6, name: 'Economy 320',    price:  445, weight: '500 g',  category: 'Economy',  image: '/assets/1.5kg.png' },
  { id: 7, name: 'Roasted Cashew', price: 1200, weight: '1 kg',   category: 'Roasted',  image: '/assets/1kg.png'   },
  { id: 8, name: 'Roasted Cashew', price:  600, weight: '500 g',  category: 'Roasted',  image: '/assets/1.5kg.png' },
];

const TABS = ['All', 'Premium', 'Standard', 'Economy', 'Roasted'];

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(price);

/* ── Product Card ──────────────────────────────────────────── */
function ProductCard({ product, onView }) {
  const { addToCart } = useCart();
  const [flash, setFlash] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product);
    setFlash(true);
    setTimeout(() => setFlash(false), 1600);
  };

  const outOfStock = Number(product.stock_quantity) === 0;
  const imgSrc = product.image || product.image_url;

  return (
    <div className="pcat-card" role="listitem">
      <div className="pcat-card__img-wrap" onClick={() => onView(product)}>
        {imgSrc ? (
          <img src={imgSrc} alt={product.name} className="pcat-card__img" loading="lazy" />
        ) : (
          <div className="pcat-card__placeholder">🌰</div>
        )}
        <span className="pcat-card__cat-badge">{product.category}</span>
      </div>

      <div className="pcat-card__body">
        <p className="pcat-card__name">{product.name}</p>
        <p className="pcat-card__weight">{product.weight || product.unit || '—'}</p>
        <p className="pcat-card__price">{formatPrice(product.price)}</p>
      </div>

      <div className="pcat-card__footer">
        <button
          className={`pcat-card__btn${flash ? ' pcat-card__btn--added' : ''}`}
          onClick={handleAdd}
          disabled={outOfStock}
          aria-label={`Add ${product.name} to cart`}
        >
          {flash ? '✓ Added!' : outOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}

/* ── Product Detail Modal ──────────────────────────────────── */
function ProductModal({ product, onClose }) {
  const { addToCart } = useCart();
  if (!product) return null;
  const outOfStock = Number(product.stock_quantity) === 0;
  const imgSrc = product.image || product.image_url;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 500, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
        overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Image */}
        <div style={{ background: '#FAFAFA', height: 240, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', flexShrink: 0 }}>
          {imgSrc
            ? <img src={imgSrc} alt={product.name} style={{ height: '100%', width: '100%', objectFit: 'contain', padding: 20 }} />
            : <span style={{ fontSize: 72 }}>🌰</span>}
          <button onClick={onClose} aria-label="Close" style={{
            position: 'absolute', top: 12, right: 12, background: '#1A1A1A', color: '#fff',
            border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
          <span style={{
            position: 'absolute', top: 12, left: 12, background: '#C9972B', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            textTransform: 'uppercase', letterSpacing: 1,
          }}>{product.category}</span>
        </div>

        {/* Details */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22,
            fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>{product.name}</h2>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 14 }}>
            Weight: <strong>{product.weight || product.unit || '—'}</strong>
          </p>
          {product.description && (
            <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.7, marginBottom: 16 }}>
              {product.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: '#FAFAFA', borderRadius: 10,
            border: '1px solid #EBEBEB', marginBottom: 18 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A' }}>
              {formatPrice(product.price)}
            </span>
            {product.stock_quantity !== undefined && (
              <span style={{ fontSize: 13, fontWeight: 600, color: outOfStock ? '#B91C1C' : '#15803D' }}>
                {outOfStock ? '✗ Out of Stock' : '✓ In Stock'}
              </span>
            )}
          </div>

          <button
            disabled={outOfStock}
            onClick={() => { addToCart(product); onClose(); }}
            style={{
              width: '100%', padding: 13, background: '#1A1A1A', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: outOfStock ? 'not-allowed' : 'pointer', opacity: outOfStock ? 0.5 : 1,
            }}
          >
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PRODUCT CATALOG PAGE
   ══════════════════════════════════════════════════════════════ */
export default function ProductCatalog() {
  const [products, setProducts]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [activeTab, setActiveTab]             = useState('All');
  const [sortBy, setSortBy]                   = useState('default');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast]                     = useState(null);

  const { search = '' } = useOutletContext() || {};

  /* ── Fetch products from API, fallback to static ── */
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('http://localhost:5000/api/products', { params: { limit: 100 } })
      .then(r => {
        const raw = r.data.data || [];
        if (raw.length === 0) {
          setProducts(STATIC_PRODUCTS);
        } else {
          const merged = raw.map(p => ({
            ...p,
            category: p.name.includes('Premium') ? 'Premium'
                    : p.name.includes('Standard') ? 'Standard'
                    : p.name.includes('Economy')  ? 'Economy'
                    : p.name.includes('Roasted')  ? 'Roasted'
                    : 'Standard',
            weight: p.name.match(/\(([^)]+)\)/)?.[1] || p.unit || '—',
          }));
          setProducts(merged);
        }
      })
      .catch(() => {
        setProducts(STATIC_PRODUCTS);
        setError('Using sample data — server unreachable.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Handle add to cart with toast ── */
  const handleAddToCart = (product) => {
    setToast(`${product.name} added!`);
    setTimeout(() => setToast(null), 2000);
  };

  /* ── Tab filter + search + sort ── */
  const filtered = products
    .filter(p => {
      const matchTab    = activeTab === 'All' || p.category === activeTab;
      const matchSearch = p.name.toLowerCase().includes((search || '').toLowerCase());
      return matchTab && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc')   return a.name.localeCompare(b.name);
      return 0;
    });

  /* ── Count per tab ── */
  const tabCount = (tab) =>
    tab === 'All' ? products.length : products.filter(p => p.category === tab).length;

  return (
    <>
      {/* ── HERO ──────────────────────────────────────── */}
      <section className="shop-hero">
        <img src="/assets/Home.png" alt="" className="shop-hero__bg" aria-hidden="true" />
       
      </section>

      {/* ── TRUST BAR ─────────────────────────────────── */}
      <div className="shop-trust-bar">
        {[['🚚','Free Delivery above ₹499'],['✅','100% Natural & Fresh'],['🔒','Secure Payments'],['↩️','Easy Returns']].map(([icon, text]) => (
          <div key={text} className="shop-trust-item"><span>{icon}</span> {text}</div>
        ))}
      </div>

      {/* ── PRODUCTS SECTION ──────────────────────────── */}
      <section id="products-section" className="home-section">
        <div className="home-section__inner">

          {/* Header row */}
          <div className="home-section__header" style={{ marginBottom: 0 }}>
            <div>
              <span className="home-section__label">🌰 Our Range</span>
              <h2 className="home-section__title">Our Products</h2>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="pcat-sort" aria-label="Sort products">
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name-asc">Name: A–Z</option>
            </select>
          </div>

          {/* ── TABS ────────────────────────────────── */}
          <div className="pcat-tabs" role="tablist" aria-label="Filter by category">
            {TABS.map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`pcat-tab${activeTab === tab ? ' pcat-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'All' && '🌰 '}
                {tab === 'Premium' && '⭐ '}
                {tab === 'Standard' && '✅ '}
                {tab === 'Economy' && '💰 '}
                {tab === 'Roasted' && '🔥 '}
                {tab}
                <span className="pcat-tab__count">{tabCount(tab)}</span>
              </button>
            ))}
          </div>

          {/* Error notice */}
          {error && (
            <div style={{ background: '#FEF9C3', color: '#A16207', border: '1px solid #FDE68A',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          {/* ── GRID ────────────────────────────────── */}
          {loading ? (
            <div className="pcat-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="pcat-card">
                  <div className="pcat-card__img-wrap" style={{
                    background: 'linear-gradient(90deg,#e8edf0 25%,#f4f6f8 50%,#e8edf0 75%)',
                    backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.4s infinite',
                  }} />
                  <div className="pcat-card__body">
                    {[70, 40, 55].map((w, j) => (
                      <div key={j} style={{ height: 13, width: `${w}%`, borderRadius: 4,
                        background: '#e8edf0', marginBottom: 8 }} />
                    ))}
                  </div>
                  <div className="pcat-card__footer">
                    <div style={{ height: 44, borderRadius: 8, background: '#e8edf0' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>No {activeTab !== 'All' ? activeTab : ''} products found</p>
            </div>
          ) : (
            <div className="pcat-grid" role="list">
              {filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={setSelectedProduct}
                />
              ))}
            </div>
          )}

          {!loading && (
            <p className="pcat-result-count">
              Showing {filtered.length} of {products.length} products
              {activeTab !== 'All' ? ` · ${activeTab}` : ''}
            </p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ABOUT US — Premium Glassmorphism Design
         ══════════════════════════════════════════════════════ */}
      <section id="about-section" className="about-section">
        <div className="about-section__inner">

          {/* LEFT: Text ──────────────────────────────── */}
          <div className="about-section__content">
            <span className="about-section__eyebrow">🌱 Our Story</span>
            <h2 className="about-section__heading">About CashewHub</h2>
            <p className="about-section__body">
              At CashewHub, we believe premium quality should be accessible to everyone.
              Founded with a farm-to-table mission, we partner directly with India's finest
              cashew farmers in Kerala and Goa — cutting out middlemen to bring you the
              freshest, most flavourful cashews at honest prices. Every batch is hand-graded,
              naturally processed, and packed within 24 hours of dispatch. No preservatives.
              No compromise. Just pure, wholesome goodness from the farm to your doorstep.
            </p>

            {/* 2×2 Glassmorphism stat cards */}
            <div className="about-section__stats-grid">
              {[
                { icon: '🌾', title: 'Farm-Direct Sourcing',  desc: 'Straight from our trusted farm partners'        },
                { icon: '⭐', title: 'Premium Quality',       desc: 'Hand-graded W210 & W240 grade cashews'          },
                { icon: '🍃', title: '100% Natural',          desc: 'Zero preservatives, zero artificial additives'  },
                { icon: '🚀', title: 'Same Day Dispatch',     desc: 'Orders packed & shipped within 24 hours'        },
              ].map(card => (
                <div key={card.title} className="about-glass-card">
                  <span className="about-glass-card__icon">{card.icon}</span>
                  <h4 className="about-glass-card__title">{card.title}</h4>
                  <p className="about-glass-card__desc">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Image ────────────────────────────── */}
          <div className="about-section__img-col">
            <div className="about-section__img-wrap">
              <img
                src="/assets/About.jpg"
                alt="CashewHub — Farm to Table"
                className="about-section__img"
              />
              
            </div>
          </div>

        </div>
      </section>

      {/* ── Modals / Toast ────────────────────────────── */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
      {toast && <div className="shop-toast">🛒 {toast}</div>}
    </>
  );
}
