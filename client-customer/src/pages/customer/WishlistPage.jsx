/**
 * WishlistPage.jsx
 *
 * Data flow:
 *   • Items stored in localStorage under key "cashew_wishlist"
 *   • Shape: [{ id, name, price, unit, image_url, category_name }]
 *   • addToWishlist / removeFromWishlist exported for ProductCard
 */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { getProductVisual } from '../../utils/productVisual';
import '../../styles/pages/wishlist.css';

/* ─── Storage helpers (importable by other components) ──────── */
const WL_KEY = 'cashew_wishlist';

export function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); }
  catch { return []; }
}

export function addToWishlist(product) {
  const list = getWishlist();
  if (!list.find(i => i.id === product.id)) {
    localStorage.setItem(WL_KEY, JSON.stringify([...list, product]));
    window.dispatchEvent(new Event('wishlist-change'));
  }
}

export function removeFromWishlist(productId) {
  const list = getWishlist().filter(i => i.id !== productId);
  localStorage.setItem(WL_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('wishlist-change'));
}

export function isWishlisted(productId) {
  return getWishlist().some(i => i.id === productId);
}

/* ─── Icons ─────────────────────────────────────────────────── */
function HeartIcon({ filled = false, size = 18, color = '#E74C3C' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? color : 'none'} stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

/* ─── WishlistCard ──────────────────────────────────────────── */
function WishlistCard({ item, onRemove, onAddToCart, inCart }) {
  const [addedToCart, setAddedToCart] = useState(false);
  const visual = getProductVisual(item.name);

  const handleAddToCart = () => {
    onAddToCart(item);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1800);
  };

  return (
    <article className="wl-card" aria-label={item.name}>

      {/* ── Image ── */}
      <div className="wl-card__img-wrap">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="wl-card__img"
          />
        ) : (
          <div className="wl-card__img-fallback" style={{ background: visual.bg }}>
            <span>{visual.emoji}</span>
            <span>{visual.tag}</span>
          </div>
        )}

        {/* Remove — filled heart floats top-right */}
        <button
          className="wl-card__remove-img-btn"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name} from wishlist`}
          title="Remove from wishlist"
        >
          <HeartIcon filled size={15} />
        </button>

        {/* In-cart badge */}
        {inCart && (
          <span className="wl-card__cart-badge">
            ✓ In Cart ({inCart.qty})
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="wl-card__body">
        {item.category_name && (
          <p className="wl-card__category">{item.category_name}</p>
        )}
        <h3 className="wl-card__name">{item.name}</h3>
        <div className="wl-card__price-row">
          <span className="wl-card__price">
            ₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
          <span className="wl-card__unit">/ {item.unit || 'kg'}</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="wl-card__footer">
        <button
          className={`wl-btn-cart${addedToCart ? ' wl-btn-cart--added' : ''}`}
          onClick={handleAddToCart}
          disabled={addedToCart}
          aria-label={`Add ${item.name} to cart`}
        >
          {addedToCart ? '✓ Added!' : <><CartIcon /> Add to Cart</>}
        </button>

        <button
          className="wl-btn-delete"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
          title="Remove"
        >
          <TrashIcon />
        </button>
      </div>

    </article>
  );
}

/* ─── EmptyState ────────────────────────────────────────────── */
function EmptyState({ onShop }) {
  return (
    <div className="wl-empty">
      <div className="wl-empty__icon-wrap">
        <div className="wl-empty__icon-ring" />
        <div className="wl-empty__icon-inner" />
        <div className="wl-empty__icon-heart">
          <HeartIcon filled size={38} color="#E74C3C" />
        </div>
      </div>

      <h2 className="wl-empty__title">Your wishlist is empty</h2>
      <p className="wl-empty__desc">
        Save products you love by clicking the heart icon.
        They'll appear here for easy access.
      </p>

      <div className="wl-empty__pills">
        {['❤️ Save favourites', '🛒 Easy add to cart', '🔔 Price alerts soon'].map(f => (
          <span key={f} className="wl-empty__pill">{f}</span>
        ))}
      </div>

      <button className="wl-empty__cta" onClick={onShop}>
        Browse Products →
      </button>
    </div>
  );
}

/* ─── WishlistPage ──────────────────────────────────────────── */
export default function WishlistPage() {
  const navigate                 = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { showToast }            = useToast();
  const [items, setItems]        = useState(() => getWishlist());

  /* Stay in sync when ProductCard adds/removes items */
  useEffect(() => {
    const sync = () => setItems(getWishlist());
    window.addEventListener('wishlist-change', sync);
    return () => window.removeEventListener('wishlist-change', sync);
  }, []);

  const handleRemove = useCallback((id) => {
    removeFromWishlist(id);
    setItems(prev => prev.filter(i => i.id !== id));
    showToast('Removed from wishlist', 'info');
  }, [showToast]);

  const handleAddToCart = useCallback((item) => {
    addToCart(item);
    showToast(`"${item.name}" added to cart 🛒`, 'success');
  }, [addToCart, showToast]);

  const handleClearAll = () => {
    localStorage.setItem(WL_KEY, '[]');
    window.dispatchEvent(new Event('wishlist-change'));
    setItems([]);
    showToast('Wishlist cleared', 'info');
  };

  return (
    <div className="wl-page">
      <div className="wl-content">

        {/* ── Page header ── */}
        <div className="wl-header">
          <div>
            <p className="wl-header__eyebrow">My Account</p>
            <h1 className="wl-header__title">My Wishlist</h1>
            {items.length > 0 && (
              <p className="wl-header__count">
                {items.length} saved item{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {items.length > 0 && (
            <div className="wl-header__actions">
              <button className="wl-btn-clear" onClick={handleClearAll}>
                <TrashIcon /> Clear All
              </button>
              <button className="wl-btn-browse" onClick={() => navigate('/home/shop')}>
                + Add More
              </button>
            </div>
          )}
        </div>

        {/* ── Empty state ── */}
        {items.length === 0 && (
          <EmptyState onShop={() => navigate('/home/shop')} />
        )}

        {/* ── Product grid ── */}
        {items.length > 0 && (
          <div className="wl-grid">
            {items.map(item => (
              <WishlistCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onAddToCart={handleAddToCart}
                inCart={cartItems.find(c => c.id === item.id) || null}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
