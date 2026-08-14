/**
 * ProductCard — shared card used on HomePage and ShopPage.
 *
 * Supports variant products (e.g. 1/2kg vs 1kg of the same cashew).
 * When `product.variants` is present, renders variant-selector buttons
 * and updates price/stock/cart state dynamically.
 *
 * Clicking the image/body navigates to /home/product/:id (of the selected variant).
 * onView prop opens QuickView modal (ShopPage only); pass null for HomePage.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getProductVisual } from '../utils/productVisual';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import {
  addToWishlist,
  removeFromWishlist,
  isWishlisted,
} from '../pages/customer/WishlistPage';
import './ProductCard.css';

export default function ProductCard({ product, onView }) {
  const navigate                 = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { showToast }            = useToast();
  const [added, setAdded]        = useState(false);

  /* ── Variant state ────────────────────────────────────────────
     If the product has variants, we track which is selected.
     selectedVariant is null for products without variants.
  ─────────────────────────────────────────────────────────────── */
  const hasVariants   = Array.isArray(product?.variants) && product.variants.length > 1;
  const [selectedIdx, setSelectedIdx] = useState(0);

  /* The "active" product data — either the variant or the product itself */
  const active = hasVariants ? {
    ...product,
    ...product.variants[selectedIdx],
    /* Keep the base name on the card, not the variant name */
    name: product.name,
  } : product;

  /* Wishlist tracks the canonical (base) product id */
  const [wishlisted, setWishlisted] = useState(
    () => product?.id != null ? isWishlisted(product.id) : false
  );

  if (!product) return null;

  const visual     = getProductVisual(active?.name ?? '', active?.category_name ?? product?.category_name ?? '');
  const inCart     = cartItems.find(i => i.id === active.id);
  const outOfStock = Number(active?.stock_quantity ?? 0) <= 0;
  const lowStock   = !outOfStock && Number(active?.stock_quantity ?? 0) <= 10;

  /* Resolve image URL: handles relative /uploads paths, Cloudinary URLs, and null */
  const resolvedImg = resolveImageUrl(active.image_url || product.image_url);

  /* ── Add the SELECTED variant to cart ─────────────────────── */
  const handleAdd = (e) => {
    e.stopPropagation();
    if (outOfStock) return;

    /* Build the cart item from the active variant */
    const cartItem = hasVariants
      ? {
          id:             active.id,
          name:           active.name,       /* e.g. "Roasted Cashew" */
          price:          active.price,
          image_url:      active.image_url || product.image_url,
          unit:           active.unit || product.unit,
          stock_quantity: active.stock_quantity,
          category_id:    product.category_id,
          category_name:  product.category_name,
          /* Carry variant weight label so cart shows "Roasted Cashew · 1/2 kg" */
          variant_label:  product.variants[selectedIdx].weight_label,
        }
      : product;

    addToCart(cartItem);
    const label = hasVariants
      ? `"${product.name} · ${product.variants[selectedIdx].weight_label}"`
      : `"${product?.name ?? 'Item'}"`;
    showToast(`${label} added to cart 🛒`, 'success');
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (wishlisted) {
      removeFromWishlist(product.id);
      setWishlisted(false);
      showToast('Removed from wishlist', 'info');
    } else {
      addToWishlist(product);
      setWishlisted(true);
      showToast(`"${product.name}" saved to wishlist ❤️`, 'success');
    }
  };

  /* Navigate to the product detail page of the currently selected variant */
  const goToDetail = () => navigate(`/home/product/${active.id}`);

  return (
    <div className="pc-card">

      {/* ── Image area ───────────────────────────────────────── */}
      <div className="pc-img-outer">

        <button
          className={`pc-wish-btn${wishlisted ? ' pc-wish-btn--active' : ''}`}
          onClick={handleWishlist}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wishlisted}
          title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            size={16}
            fill={wishlisted ? '#E74C3C' : 'none'}
            stroke={wishlisted ? '#E74C3C' : '#9CA3AF'}
            strokeWidth={2}
          />
        </button>

        <div
          className="pc-img-wrap"
          onClick={onView ? () => onView({ ...active, name: product.name }) : goToDetail}
          style={{ cursor: 'pointer' }}
        >
          {resolvedImg ? (
            <img
              src={resolvedImg}
              alt={product.name ?? 'Product'}
              className="pc-img"
              onError={e => {
                e.currentTarget.onerror = null;
                /* Fall back to local asset image derived from product name */
                e.currentTarget.src = visual.localImage;
              }}
            />
          ) : visual.localImage ? (
            <img
              src={visual.localImage}
              alt={product.name ?? 'Product'}
              className="pc-img"
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="pc-img-fallback" style={{ background: visual.bg }}>
              <span className="pc-img-fallback__emoji">{visual.emoji}</span>
              <span className="pc-img-fallback__tag">{visual.tag}</span>
            </div>
          )}

          {outOfStock && (
            <div className="pc-overlay">
              <span className="pc-overlay__label">Out of Stock</span>
            </div>
          )}

          {inCart && !outOfStock && (
            <span className="pc-badge pc-badge--cart">✓ In Cart ({inCart.qty})</span>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="pc-body" onClick={goToDetail} style={{ cursor: 'pointer' }}>
        {product.category_name && (
          <span className="pc-category">{product.category_name}</span>
        )}
        <h3 className="pc-name" title={product.name}>{product.name}</h3>
        {product.description && (
          <p className="pc-desc">{product.description}</p>
        )}

        {/* ── Variant selector buttons ─────────────────────── */}
        {hasVariants && (
          <div
            className="pc-variants"
            onClick={e => e.stopPropagation()} /* don't navigate when clicking variants */
          >
            {product.variants.map((v, idx) => {
              const variantOutOfStock = Number(v.stock_quantity ?? 0) <= 0;
              return (
                <button
                  key={v.id}
                  className={[
                    'pc-variant-btn',
                    idx === selectedIdx ? 'pc-variant-btn--active' : '',
                    variantOutOfStock  ? 'pc-variant-btn--oos'    : '',
                  ].join(' ').trim()}
                  onClick={() => setSelectedIdx(idx)}
                  title={variantOutOfStock ? `${v.weight_label} — Out of Stock` : v.weight_label}
                  disabled={variantOutOfStock}
                >
                  {v.weight_label}
                </button>
              );
            })}
          </div>
        )}

        <div className="pc-price-row">
          <span className="pc-price">₹{Number(active.price).toFixed(0)}</span>
          <span className="pc-unit">/ {active.unit || product.unit || 'kg'}</span>
          {lowStock && (
            <span className="pc-low-stock">Only {active.stock_quantity} left!</span>
          )}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="pc-footer">
        <button
          className={[
            'pc-btn-cart',
            added      ? 'pc-btn-cart--added'    : '',
            outOfStock ? 'pc-btn-cart--disabled' : '',
          ].join(' ').trim()}
          onClick={handleAdd}
          disabled={outOfStock}
          aria-label={outOfStock ? 'Out of stock' : `Add ${product.name} to cart`}
        >
          {outOfStock ? '✗ Out of Stock' : added ? '✓ Added!' : inCart ? '🛒 Add More' : '🛒 Add to Cart'}
        </button>
      </div>

    </div>
  );
}
