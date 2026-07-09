import ProductCard from './ProductCard';

/* ══════════════════════════════════════════════════════════════
   ProductGrid — renders a 3-col responsive grid of product cards.
   Props:
     products  (array)   — product objects from GET /api/products
     loading   (boolean) — show skeleton cards while fetching
   ══════════════════════════════════════════════════════════════ */

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
        <ProductCard key={product.id} product={product} onView={onCardClick} />
      ))}
    </div>
  );
}
