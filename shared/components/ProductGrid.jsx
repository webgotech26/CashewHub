import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

/* ══════════════════════════════════════════════════════════════
   ProductGrid — renders a 3-col responsive grid of product cards.
   Props:
     products  (array)   — product objects from GET /api/products
     loading   (boolean) — show skeleton cards while fetching
   ══════════════════════════════════════════════════════════════ */

/* ── Product image helper ─────────────────────────────────────── */
function getProductVisual(name = '') {
  const n = name.toLowerCase();
  if (n.includes('w180'))    return { bg: 'linear-gradient(135deg,#7B3F00,#C68642)', emoji: '🥇', label: 'W180' };
  if (n.includes('w210'))    return { bg: 'linear-gradient(135deg,#8B4513,#D2691E)', emoji: '⭐', label: 'W210' };
  if (n.includes('w240'))    return { bg: 'linear-gradient(135deg,#A0522D,#DEB887)', emoji: '✨', label: 'W240' };
  if (n.includes('w320'))    return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🏆', label: 'W320' };
  if (n.includes('w450'))    return { bg: 'linear-gradient(135deg,#B8860B,#DAA520)', emoji: '💛', label: 'W450' };
  if (n.includes('roasted') && n.includes('salt')) return { bg: 'linear-gradient(135deg,#8B0000,#CD5C5C)', emoji: '🔥', label: 'Salted' };
  if (n.includes('roasted')) return { bg: 'linear-gradient(135deg,#5C3317,#A0522D)', emoji: '🍂', label: 'Roasted' };
  if (n.includes('masala'))  return { bg: 'linear-gradient(135deg,#8B2500,#E25822)', emoji: '🌶️', label: 'Masala' };
  if (n.includes('pepper'))  return { bg: 'linear-gradient(135deg,#2C2C2C,#696969)', emoji: '🖤', label: 'Pepper' };
  if (n.includes('broken'))  return { bg: 'linear-gradient(135deg,#6B6B3A,#B8B860)', emoji: '💎', label: 'Broken' };
  if (n.includes('flavour') || n.includes('flavor')) return { bg: 'linear-gradient(135deg,#7B2D8B,#C879D8)', emoji: '🎨', label: 'Flavour' };
  return { bg: 'linear-gradient(135deg,#C9972B,#F5C842)', emoji: '🥜', label: 'Cashew' };
}

/* ── Single Product Card ──────────────────────────────────────── */
function ProductCard({ product, onCardClick }) {
  const { addToCart, cartItems } = useCart();
  const [flash, setFlash] = useState(false);

  const inCart     = cartItems.find(i => i.id === product.id);
  const outOfStock = Number(product.stock_quantity) <= 0;
  const displayPrice = Number(product.price);
  const visual = getProductVisual(product.name);

  const handleAdd = () => {
    if (outOfStock) return;
    addToCart(product);
    setFlash(true);
    setTimeout(() => setFlash(false), 1600);
  };

  return (
    <div className="shop-product-card">
      {/* ── Image — click to open detail modal ────────── */}
      <div
        className="shop-product-card__img-wrap"
        onClick={() => onCardClick && onCardClick(product)}
        style={{ cursor: onCardClick ? 'pointer' : 'default' }}
        title="View details"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="shop-product-card__img"
            loading="lazy"
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: visual.bg,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 64, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
              {visual.emoji}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
              textTransform: 'uppercase', letterSpacing: 2,
              background: 'rgba(0,0,0,0.2)', padding: '3px 10px',
              borderRadius: 20,
            }}>
              {visual.label}
            </span>
          </div>
        )}

        {outOfStock && (
          <span className="shop-product-card__stock-badge">Out of Stock</span>
        )}

        {inCart && !outOfStock && (
          <span style={{
            position: 'absolute', bottom: 8, right: 8,
            background: '#16a34a', color: '#fff', fontSize: 11,
            fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          }}>
            ✓ In Cart ({inCart.qty})
          </span>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="shop-product-card__body">
        {product.category_name && (
          <span className="shop-product-card__category">
            {product.category_name}
          </span>
        )}

        <h3 className="shop-product-card__name" title={product.name}>
          {product.name}
        </h3>

        {product.description && (
          <p className="shop-product-card__desc">{product.description}</p>
        )}

        <div className="shop-product-card__price-row">
          <span className="shop-product-card__price">
            ₹{displayPrice.toFixed(2)}
          </span>
          <span className="shop-product-card__unit">
            / {product.unit || 'unit'}
          </span>
        </div>

        {/* Stock indicator */}
        {!outOfStock && Number(product.stock_quantity) <= 10 && (
          <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>
            ⚠ Only {product.stock_quantity} left
          </p>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="shop-product-card__footer">
        <button
          className={`shop-btn-cart ${flash ? 'shop-btn-cart--added' : ''}`}
          onClick={handleAdd}
          disabled={outOfStock}
          aria-label={outOfStock ? 'Out of stock' : `Add ${product.name} to cart`}
        >
          {outOfStock
            ? '✗ Out of Stock'
            : flash
              ? '✓ Added!'
              : inCart
                ? `🛒 Add More`
                : '🛒 Add to Cart'}
        </button>

        <button
          className="shop-btn-wishlist"
          title="Save to wishlist"
          aria-label="Add to wishlist"
        >
          ♡
        </button>
      </div>
    </div>
  );
}

/* ── Skeleton Card ────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="shop-product-card" style={{ pointerEvents: 'none' }}>
      <div className="shop-product-card__img-wrap">
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(90deg,#e8edf0 25%,#f4f6f8 50%,#e8edf0 75%)',
          backgroundSize: '200% 100%',
          animation: 'skeleton-shimmer 1.4s infinite',
        }} />
      </div>
      <div className="shop-product-card__body" style={{ gap: 10 }}>
        {[45, 80, 65, 50].map((w, i) => (
          <div key={i} style={{
            height: i === 1 ? 16 : 12,
            width: `${w}%`,
            borderRadius: 4,
            background: '#e8edf0',
          }} />
        ))}
      </div>
      <div className="shop-product-card__footer">
        <div style={{ flex: 1, height: 44, borderRadius: 10, background: '#e8edf0' }} />
      </div>
    </div>
  );
}

/* ── ProductGrid ──────────────────────────────────────────────── */
export default function ProductGrid({ products = [], loading = false, onCardClick }) {
  if (loading) {
    return (
      <div className="shop-product-grid">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="shop-product-grid">
        <div className="shop-empty" style={{ gridColumn: '1 / -1' }}>
          <div className="shop-empty__icon">🔍</div>
          <div className="shop-empty__text">No products found</div>
          <div className="shop-empty__sub">
            Try a different search term or select "All" categories.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-product-grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} onCardClick={onCardClick} />
      ))}
    </div>
  );
}
