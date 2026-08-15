import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../utils/resolveImageUrl';

export default function CartDrawer({ onClose }) {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQty, clearCart, cartTotal, effectivePrice } = useCart();

  const handleCheckout = () => {
    onClose();
    navigate('/home/checkout');
  };

  return (
    <>
      {/* Overlay */}
      <div className="shop-cart-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="shop-cart-drawer">
        {/* Header */}
        <div className="shop-cart-drawer__header">
          <h2 className="shop-cart-drawer__title">
            🛒 Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </h2>
          <button className="shop-cart-drawer__close" onClick={onClose} aria-label="Close cart">
            ×
          </button>
        </div>

        {/* Items */}
        {cartItems.length === 0 ? (
          <div className="shop-cart-empty">
            <span className="shop-cart-empty__icon">🛒</span>
            <span className="shop-cart-empty__text">Your cart is empty</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              Browse our products and add something!
            </span>
          </div>
        ) : (
          <div className="shop-cart-drawer__items">
            {cartItems.map(item => {
              const price = effectivePrice ? effectivePrice(item) : Number(item.price);
              return (
                <div key={item.id} className="shop-cart-item">
                  {/* Thumbnail — resolveImageUrl handles relative /uploads paths */}
                  {(() => {
                    const src = resolveImageUrl(item.image_url);
                    return src ? (
                      <img
                        src={src}
                        alt={item.name}
                        className="shop-cart-item__img"
                        onError={e => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null;
                  })()}
                  <div
                    className="shop-cart-item__img"
                    style={{ display: resolveImageUrl(item.image_url) ? 'none' : 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 22 }}
                  >
                    🌰
                  </div>

                  {/* Info */}
                  <div className="shop-cart-item__info">
                    <div className="shop-cart-item__name">{item.name}</div>
                    <div className="shop-cart-item__price">
                      ₹{price.toFixed(2)} / {item.unit || 'unit'}
                    </div>

                    {/* Qty controls */}
                    <div className="shop-cart-item__qty">
                      <button onClick={() => updateQty(item.id, -1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, +1)}>+</button>
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#9ca3af' }}>
                        = ₹{(price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    className="shop-cart-item__remove"
                    onClick={() => removeFromCart(item.id)}
                    title="Remove item"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="shop-cart-drawer__footer">
            <div className="shop-cart-total">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>

            <button className="shop-btn-checkout" onClick={handleCheckout}>
              Proceed to Checkout →
            </button>

            <button
              onClick={clearCart}
              style={{
                background: '#1C1917',
                border: '1.5px solid #292524',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                color: '#F5F5F4',
                textAlign: 'center',
                padding: '10px 16px',
                width: '100%',
                letterSpacing: 0.2,
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.borderColor = '#DC2626'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1C1917'; e.currentTarget.style.borderColor = '#292524'; }}
            >
              🗑 Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
