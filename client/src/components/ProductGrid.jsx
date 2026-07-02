import { useState } from 'react';
import { useCart } from '../context/CartContext';

/* ══════════════════════════════════════════════════════════════
   ProductGrid — renders a 3-col responsive grid of product cards.
   Props:
     products  (array)   — product objects from GET /api/products
     loading   (boolean) — show skeleton cards while fetching
   ══════════════════════════════════════════════════════════════ */

/* ── Single Product Card ──────────────────────────────────────── */
function ProductCard({ product, onCardClick }) {
  const { addToCart, cartItems } = useCart();
  const [flash, setFlash] = useState(false);

  const inCart     = cartItems.find(i => i.id === product.id);
  const outOfStock = Number(product.stock_quantity) <= 0;
  const displayPrice = Number(product.price);

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
          <div className="shop-product-card__img-placeholder" role="img" aria-label="Product image unavailable">
            <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* Cashew shape */}
              <path
                d="M48 14C35 14 24 24 26 37C28 50 37 66 45 70C46 70.5 47 71 48 71
                   C49 71 50 70.5 51 70C59 66 68 50 70 37C72 24 61 14 48 14Z"
                fill="#C8CDD4"
              />
              <path
                d="M48 22C39 22 30 30 32 39C34 48 41 60 47 63C47.5 63.2 48 63.3 48 63.3
                   C48 63.3 48.5 63.2 49 63C55 60 62 48 64 39C66 30 57 22 48 22Z"
                fill="#DDE0E5"
              />
              {/* Stem */}
              <path
                d="M48 14C48 14 46 9 43 8C40 7 39.5 9.5 42 11C44.5 12.5 46 12.8 48 14Z"
                fill="#B8BEC6"
              />
            </svg>
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
