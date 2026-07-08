import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

const PAYMENT_METHODS = [
  { value: 'cod',    label: '🚚 Cash on Delivery' },
  { value: 'upi',    label: '📱 Simulated UPI Pay' },
  { value: 'card',   label: '💳 Simulated Card Pay' },
  { value: 'wallet', label: '👛 Simulated Wallet' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart, effectivePrice } = useCart();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress]             = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [success, setSuccess]             = useState(null);

  // Guard: go back to shop if cart is empty
  if (cartItems.length === 0 && !success) {
    return (
      <div className="shop-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
        <h2 style={{ color: '#1a3c2e', marginBottom: 8 }}>Your cart is empty</h2>
        <p style={{ color: '#9ca3af', marginBottom: 24 }}>
          Add some products before checking out.
        </p>
        <button
          className="shop-btn-cart"
          style={{ display: 'inline-flex', width: 'auto', padding: '12px 28px' }}
          onClick={() => navigate('/home')}
        >
          ← Browse Products
        </button>
      </div>
    );
  }

  // ── Success screen ─────────────────────────────────────────
  if (success) {
    return (
      <div className="shop-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: '#1a3c2e', marginBottom: 8 }}>Order Placed!</h2>
        <p style={{ color: '#555', marginBottom: 6 }}>
          Order <strong>#{success.orderId}</strong> has been confirmed.
        </p>
        <p style={{ color: '#9ca3af', marginBottom: 28, fontSize: 14 }}>
          Payment via <strong>{PAYMENT_METHODS.find(p => p.value === success.method)?.label}</strong>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            className="shop-btn-cart"
            style={{ display: 'inline-flex', width: 'auto', padding: '12px 28px' }}
            onClick={() => navigate('/home')}
          >
            🛒 Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ── Place order ────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setError(null);

    if (!address.trim()) {
      setError('Please enter a delivery address.');
      return;
    }

    setLoading(true);

    // Simulate payment processing delay for non-COD methods
    if (paymentMethod !== 'cod') {
      await new Promise(r => setTimeout(r, 1200));
    }

    try {
      // Build the items array the backend expects
      const items = cartItems.map(item => ({
        product_id: item.id,
        quantity:   item.qty,
      }));

      const payload = {
        customer_id:  user.id,
        items,
        total_amount: parseFloat(cartTotal.toFixed(2)),
        notes:        `Payment: ${paymentMethod.toUpperCase()} | Address: ${address}`,
      };

      console.log('[Checkout] POST /api/orders payload:', payload);

      const res = await api.post('/api/orders', payload);
      console.log('[Checkout] Order response:', res.data);

      const orderId = res.data.data?.id || res.data.id || '—';

      clearCart();
      setSuccess({ orderId, method: paymentMethod });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Order failed.';
      console.error('[Checkout] Error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const gst        = cartTotal * 0.05;          // 5% GST example
  const grandTotal = cartTotal + gst;

  return (
    <div className="shop-content">
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a3c2e', marginBottom: 24 }}>
        🧾 Checkout
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 24,
        alignItems: 'start',
      }}>

        {/* ── Left: cart review + address ─────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Cart items */}
          <div className="erp-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a3c2e', marginBottom: 16 }}>
              🛒 Order Items ({cartItems.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cartItems.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px', borderRadius: 10,
                  background: '#f9fafb', border: '1px solid #f0f0f0',
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 8, flexShrink: 0,
                    background: '#e8f5ef', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, overflow: 'hidden',
                  }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '🌰'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      ₹{effectivePrice(item).toFixed(2)} × {item.qty}
                    </p>
                  </div>

                  {/* Line total */}
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#1a3c2e', flexShrink: 0 }}>
                    ₹{(effectivePrice(item) * item.qty).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery address */}
          <div className="erp-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a3c2e', marginBottom: 14 }}>
              📍 Delivery Address
            </h3>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter your full delivery address…"
              rows={3}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid #d1d5db', borderRadius: 8,
                fontSize: 14, resize: 'vertical', outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* ── Right: order summary + payment ──────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Price breakdown */}
          <div className="erp-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a3c2e', marginBottom: 16 }}>
              💰 Price Summary
            </h3>

            {[
              ['Subtotal',    `₹${cartTotal.toFixed(2)}`],
              ['GST (5%)',    `₹${gst.toFixed(2)}`],
              ['Delivery',    'FREE'],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 14, color: '#555', marginBottom: 10,
              }}>
                <span>{label}</span>
                <span style={{ fontWeight: 500, color: value === 'FREE' ? '#16a34a' : '#374151' }}>
                  {value}
                </span>
              </div>
            ))}

            <div style={{
              borderTop: '2px solid #f3f4f6', paddingTop: 12, marginTop: 4,
              display: 'flex', justifyContent: 'space-between',
              fontSize: 16, fontWeight: 800, color: '#1a3c2e',
            }}>
              <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="erp-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a3c2e', marginBottom: 14 }}>
              💳 Payment Method
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PAYMENT_METHODS.map(m => (
                <label key={m.value} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${paymentMethod === m.value ? '#2d6a4f' : '#e5e7eb'}`,
                  background: paymentMethod === m.value ? '#f0fdf4' : '#fff',
                  transition: 'all 0.15s',
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value={m.value}
                    checked={paymentMethod === m.value}
                    onChange={() => setPaymentMethod(m.value)}
                    style={{ accentColor: '#2d6a4f' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{m.label}</span>
                </label>
              ))}
            </div>

            {paymentMethod !== 'cod' && (
              <p style={{
                fontSize: 11, color: '#9ca3af', marginTop: 10,
                padding: '8px 10px', background: '#f9fafb',
                borderRadius: 6, border: '1px dashed #e5e7eb',
              }}>
                🔒 This is a mock payment. No real transaction will occur.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', fontSize: 13,
            }}>
              ❌ {error}
            </div>
          )}

          {/* Place order CTA */}
          <button
            className="shop-btn-checkout"
            onClick={handlePlaceOrder}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? paymentMethod === 'cod' ? 'Placing Order…' : 'Processing Payment…'
              : `Place Order — ₹${grandTotal.toFixed(2)}`}
          </button>

          <button
            onClick={() => navigate('/home')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#9ca3af', textAlign: 'center',
              textDecoration: 'underline',
            }}
          >
            ← Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
