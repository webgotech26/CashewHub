/**
 * ProductCard — shared card used on HomePage and ShopPage.
 * Clicking the image/body navigates to /home/product/:id
 * onView prop opens QuickView modal (ShopPage only); pass null for HomePage
 *
 * NOTE: this file exports ONLY a default React component so Vite Fast Refresh works.
 * The getProductVisual helper lives in src/utils/productVisual.js
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getProductVisual } from '../utils/productVisual';
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

  /* Wishlist — initialised from localStorage, toggled locally */
  const [wishlisted, setWishlisted] = useState(() => isWishlisted(product.id));

  const visual     = getProductVisual(product.name);
  const inCart     = cartItems.find(i => i.id === product.id);
  const outOfStock = Number(product.stock_quantity) <= 0;
  const lowStock   = !outOfStock && Number(product.stock_quantity) <= 10;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product);
    showToast(`"${product.name}" added to cart 🛒`, 'success');
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  /* Toggle wishlist — updates localStorage + fires wishlist-change event */
  const handleWishlist = (e) => {
    e.stopPropagation();
    if (wishlisted) {
      removeFromWishlist(product.id);
      setWishlisted(false);
      showToast(`Removed from wishlist`, 'info');
    } else {
      addToWishlist(product);
      setWishlisted(true);
      showToast(`"${product.name}" saved to wishlist ❤️`, 'success');
    }
  };

  const goToDetail = () => navigate(`/home/product/${product.id}`);

  return (
    <div className="pc-card">

      {/* ── Image area ─────────────────────────────────────────── */}
      {/* pc-img-outer is position:relative but has NO overflow:hidden,   */}
      {/* so the absolutely-placed heart is never clipped.                */}
      <div className="pc-img-outer">

        {/* Floating wishlist heart — top-right, z-50, always visible */}
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

        {/* pc-img-wrap keeps overflow:hidden to clip the zoom-on-hover */}
        <div
          className="pc-img-wrap"
          onClick={onView ? () => onView(product) : goToDetail}
          style={{ cursor: 'pointer' }}
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="pc-img" />
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

      {/* ── Body — click → product detail ──────────────────────── */}
      <div className="pc-body" onClick={goToDetail} style={{ cursor: 'pointer' }}>
        {product.category_name && (
          <span className="pc-category">{product.category_name}</span>
        )}
        <h3 className="pc-name" title={product.name}>{product.name}</h3>
        {product.description && (
          <p className="pc-desc">{product.description}</p>
        )}
        <div className="pc-price-row">
          <span className="pc-price">₹{Number(product.price).toFixed(0)}</span>
          <span className="pc-unit">/ {product.unit || 'kg'}</span>
          {lowStock && (
            <span className="pc-low-stock">Only {product.stock_quantity} left!</span>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="pc-footer">
        <button
          className={`pc-btn-cart${added ? ' pc-btn-cart--added' : ''}${outOfStock ? ' pc-btn-cart--disabled' : ''}`}
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
