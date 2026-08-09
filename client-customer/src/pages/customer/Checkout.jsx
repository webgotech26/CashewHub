/**
 * Checkout.jsx — Premium 2-column checkout
 *
 * Left  (65%): Delivery Address form  +  Order Review
 * Right (35%, sticky): Price Summary  +  Online Payment  +  Pay Now
 *
 * Hooks into CartContext (cartItems, cartTotal, effectivePrice, clearCart)
 * Submits to POST /api/orders (unchanged backend contract)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getProductVisual } from '../../utils/productVisual';
import api from '../../services/api';

/* ─── Payment options ───────────────────────────────────────── */
const PAYMENT_OPTIONS = [
  {
    value: 'upi',
    label: 'UPI',
    desc:  'GPay · PhonePe · Paytm',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    value: 'card',
    label: 'Credit / Debit Card',
    desc:  'Visa · Mastercard · RuPay',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    value: 'netbanking',
    label: 'Net Banking',
    desc:  'All major banks supported',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

/* ─── Indian states list ────────────────────────────────────── */
const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

/* ─── Shared input style ────────────────────────────────────── */
const inputStyle = {
  width: '100%',
  padding: '10px 13px',
  border: '1.5px solid #E5E7EB',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  background: '#FAFAFA',
  color: '#111',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#4B5563',
  marginBottom: 5,
  letterSpacing: 0.2,
};

/* ─── Section card ──────────────────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #F0F0F0',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      padding: '24px 28px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <h2 style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 15, fontWeight: 700, color: '#111',
      marginBottom: 20, letterSpacing: -0.1,
    }}>
      <span style={{ color: '#C9972B' }}>{icon}</span>
      {children}
    </h2>
  );
}

/* ─── AddressField — MODULE SCOPE (never inside another component) ──
   Defining components inside a render function gives them a new
   identity every render → React unmounts + remounts → focus lost.
   ──────────────────────────────────────────────────────────────── */
function AddressField({ id, label, placeholder, type = 'text', colSpan = 2, value, onChange }) {
  return (
    <div style={{ gridColumn: `span ${colSpan}` }}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        style={inputStyle}
        onFocus={e => { e.target.style.borderColor = '#C9972B'; }}
        onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
      />
    </div>
  );
}

/* ─── Address form ──────────────────────────────────────────── */
function AddressForm({ addr, onFieldChange, saved, onSave }) {
  return (
    <div>
      <div className="checkout-addr-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>

        <AddressField id="name"  label="Full Name *"                placeholder="e.g. Ramesh Kumar"        value={addr.name}    onChange={e => onFieldChange('name',  e.target.value)}              />
        <AddressField id="phone" label="Phone Number *"             placeholder="10-digit mobile number"   value={addr.phone}   onChange={e => onFieldChange('phone', e.target.value)} type="tel"   />
        <AddressField id="house" label="House / Flat / Block No *"  placeholder="e.g. 12B, 3rd Floor"      value={addr.house}   onChange={e => onFieldChange('house', e.target.value)}              />
        <AddressField id="area"  label="Area / Street / Locality *" placeholder="e.g. Anna Nagar"          value={addr.area}    onChange={e => onFieldChange('area',  e.target.value)}              />

        {/* Pincode — half width */}
        <div>
          <label htmlFor="pincode" style={labelStyle}>Pincode *</label>
          <input
            id="pincode"
            type="text"
            maxLength={6}
            value={addr.pincode}
            placeholder="6-digit PIN"
            onChange={e => onFieldChange('pincode', e.target.value.replace(/\D/g, ''))}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#C9972B'; }}
            onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
          />
        </div>

        {/* City — half width */}
        <div>
          <label htmlFor="city" style={labelStyle}>City *</label>
          <input
            id="city"
            type="text"
            value={addr.city}
            placeholder="e.g. Chennai"
            onChange={e => onFieldChange('city', e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#C9972B'; }}
            onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
          />
        </div>

        {/* State — full width */}
        <div style={{ gridColumn: 'span 2' }}>
          <label htmlFor="state" style={labelStyle}>State *</label>
          <select
            id="state"
            value={addr.state}
            onChange={e => onFieldChange('state', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={e => { e.target.style.borderColor = '#C9972B'; }}
            onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
          >
            <option value="">Select state…</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

      </div>

      {/* Save address button */}
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={onSave}
          style={{
            padding: '9px 22px', borderRadius: 8,
            border: '1.5px solid #1A1A1A',
            background: saved ? '#1A1A1A' : 'transparent',
            color: saved ? '#fff' : '#1A1A1A',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {saved ? '✓ Address Saved' : 'Save Address'}
        </button>
        {saved && (
          <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
            Will be used for this order
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Helper: parse image_url (may be JSON array string) ─────── */
function parseImageUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
  } catch {
    return raw.startsWith('http') || raw.startsWith('/') ? raw : null;
  }
}

/* ─── Order review item row ─────────────────────────────────── */
function OrderItem({ item, effectivePrice }) {
  const visual    = getProductVisual(item.name ?? '');
  const imgSrc    = parseImageUrl(item.image_url) || visual.localImage || null;
  const unitPrice = effectivePrice(item);
  const lineTotal = unitPrice * item.qty;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '13px 0',
      borderBottom: '1px solid #F5F5F5',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 60, height: 60, borderRadius: 10, flexShrink: 0,
        background: imgSrc ? '#F7F4EF' : visual.bg,
        border: '1px solid #EDE8DE',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }}
            onError={e => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span style={{
          fontSize: 26,
          display: imgSrc ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%',
        }}>
          {visual.emoji}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 700, fontSize: 14, color: '#111',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </p>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>
          ₹{unitPrice.toLocaleString('en-IN')} × {item.qty} {item.unit || 'kg'}
        </p>
      </div>

      {/* Line total */}
      <p style={{ fontWeight: 800, fontSize: 15, color: '#111', flexShrink: 0 }}>
        ₹{lineTotal.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

/* ─── Main Checkout component ───────────────────────────────── */
export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart, effectivePrice } = useCart();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  /* Saved addresses from Profile page (stored in localStorage) */
  const [savedAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saved_addresses') || '[]'); }
    catch { return []; }
  });
  const [selectedSavedId, setSelectedSavedId] = useState(() => {
    // Auto-select the default address if one exists
    try {
      const addrs = JSON.parse(localStorage.getItem('saved_addresses') || '[]');
      const def = addrs.find(a => a.isDefault);
      return def ? def.id : null;
    } catch { return null; }
  });

  /* Address state */
  const [addr, setAddr] = useState(() => {
    // Pre-fill from default saved address if available
    try {
      const addrs = JSON.parse(localStorage.getItem('saved_addresses') || '[]');
      const def = addrs.find(a => a.isDefault);
      if (def?.fields) return { ...def.fields };
    } catch {}
    return {
      name: user.name || '', phone: user.mobile || '',
      house: '', area: '', pincode: '', city: '', state: '',
    };
  });
  const [addrSaved, setAddrSaved] = useState(false);

  /* Payment + form state */
  const [payMethod, setPayMethod] = useState('upi');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(null);

  /* Coupon state */
  const [couponCode,     setCouponCode]     = useState('');
  const [couponLoading,  setCouponLoading]  = useState(false);
  const [couponError,    setCouponError]    = useState(null);
  const [appliedCoupon,  setAppliedCoupon]  = useState(null); // { code, discount_amount, ... }

  /* ── Stable field change handler — avoids new function on every render ── */
  const handleFieldChange = (field, val) => {
    setAddr(prev => ({ ...prev, [field]: val }));
    setAddrSaved(false);
  };
  const subtotal      = cartTotal;
  const gst           = subtotal * 0.05;
  const discount      = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const grandTotal    = subtotal + gst - discount;

  /* ── Apply coupon ─────────────────────────────────────────── */
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setAppliedCoupon(null);
    try {
      const res = await api.post('/api/coupons/validate', {
        code: couponCode.trim(),
        order_total: subtotal + gst,
      });
      setAppliedCoupon(res.data.data);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  /* ── Validate address fields ─────────────────────────────── */
  const buildAddressString = () => {
    const { name, phone, house, area, pincode, city, state } = addr;
    if (!name.trim() || !phone.trim() || !house.trim() ||
        !area.trim() || !pincode.trim() || !city.trim() || !state) {
      return null;
    }
    return `${name}, ${phone} | ${house}, ${area}, ${city} - ${pincode}, ${state}`;
  };

  /* ── Load Razorpay checkout script once ─────────────────── */
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  /* ── Place order ─────────────────────────────────────────── */
  const handlePay = async () => {
    setError(null);
    const addressStr = buildAddressString();

    if (!addressStr) {
      setError('Please fill in all required address fields.');
      return;
    }

    setLoading(true);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Failed to load Razorpay. Check your internet connection.');
        setLoading(false);
        return;
      }

      // 2. Create Razorpay order on backend
      const amountPaise = Math.round(grandTotal * 100); // ₹ → paise
      const rzpOrderRes = await api.post('/api/payment/create-order', {
        amount:   amountPaise,
        currency: 'INR',
        receipt:  `rcpt_${Date.now()}`,
      });

      const { order_id, key } = rzpOrderRes.data;

      // 3. Open Razorpay checkout modal
      await new Promise((resolve, reject) => {
        const options = {
          key,
          amount:   amountPaise,
          currency: 'INR',
          name:     'Petrichor Naturals',
          description: `Order — ${cartItems.map(i => i.name).join(', ')}`,
          image:    '/assets/logoo.png',
          order_id,
          prefill: {
            name:    addr.name  || user.name  || '',
            contact: addr.phone || user.mobile || '',
          },
          theme: { color: '#C9972B' },
          modal: {
            ondismiss: () => {
              setError('Payment cancelled. Please try again.');
              setLoading(false);
              resolve('dismissed');
            },
          },
          handler: async (response) => {
            try {
              // 4. Verify payment signature on backend
              const verifyRes = await api.post('/api/payment/verify', {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              });

              if (!verifyRes.data.success) {
                setError('Payment verification failed. Contact support.');
                setLoading(false);
                resolve('failed');
                return;
              }

              // 5. Place the order in our DB
              const items = cartItems.map(item => ({
                product_id: item.id,
                quantity:   item.qty,
              }));

              const orderRes = await api.post('/api/orders', {
                customer_id:    user.id,
                items,
                address:        addressStr,
                payment_method: payMethod,
                total_amount:   parseFloat(grandTotal.toFixed(2)),
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              });

              const orderId = orderRes.data.data?.display_id || orderRes.data.data?.id || orderRes.data.id || '—';
              clearCart();
              setSuccess({ orderId, paymentId: response.razorpay_payment_id });
              resolve('success');
            } catch (err) {
              setError(err.response?.data?.message || err.message || 'Order failed after payment.');
              setLoading(false);
              resolve('error');
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          setError(`Payment failed: ${resp.error.description}`);
          setLoading(false);
          resolve('failed');
        });
        rzp.open();
      });

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  /* ── Empty cart guard ─────────────────────────────────────── */
  if (cartItems.length === 0 && !success) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#111', marginBottom: 8 }}>
          Your cart is empty
        </h2>
        <p style={{ color: '#9CA3AF', marginBottom: 28, fontSize: 14 }}>
          Add some products before checking out.
        </p>
        <button onClick={() => navigate('/home/shop')} style={{
          background: '#1A1A1A', color: '#fff', border: 'none',
          borderRadius: 30, padding: '13px 32px', fontSize: 14,
          fontWeight: 700, cursor: 'pointer',
        }}>
          Browse Products →
        </button>
      </div>
    );
  }

  /* ── Success screen ──────────────────────────────────────── */
  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          background: 'linear-gradient(135deg,#C9972B,#F5C842)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 42, margin: '0 auto 28px',
          boxShadow: '0 8px 32px rgba(201,151,43,0.35)',
        }}>
          🎉
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display',serif", fontSize: 26,
          fontWeight: 800, color: '#111', marginBottom: 10,
        }}>
          Order Confirmed!
        </h2>
        <p style={{ fontSize: 15, color: '#4B5563', marginBottom: 6 }}>
          Order has been placed successfully.
        </p>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>
          Payment ID: <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>
            {success.paymentId}
          </code>
        </p>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 36 }}>
          We'll pack and dispatch your order soon.
        </p>
        <div className="checkout-success-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/home/orders')} style={{
            background: '#1A1A1A', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px 28px', fontSize: 14,
            fontWeight: 700, cursor: 'pointer',
          }}>
            Track Order →
          </button>
          <button onClick={() => navigate('/home/shop')} style={{
            background: 'transparent', color: '#1A1A1A',
            border: '1.5px solid #E5E7EB', borderRadius: 10,
            padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  /* ── Main checkout layout ────────────────────────────────── */
  return (
    <div style={{
      maxWidth: 1160,
      margin: '0 auto',
      padding: 'clamp(20px,3vw,40px) clamp(16px,3vw,40px) 80px',
      fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
    }}>

      {/* ── Page title ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#C9972B',
          textTransform: 'uppercase', letterSpacing: 2.5, margin: '0 0 4px' }}>
          Secure Checkout
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800,
          color: '#111', letterSpacing: -0.5, margin: 0,
        }}>
          Complete Your Order
        </h1>
      </div>

      {/* ── 2-column grid ── */}
      <div className="checkout-grid">

        {/* ══════════════════════════════════════════════
            LEFT COLUMN — Address + Order Review
            ══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── 1. Delivery Address ── */}
          <Card>
            <SectionTitle icon="📍">Delivery Address</SectionTitle>

            {/* ── Saved address picker (only when addresses exist) ── */}
            {savedAddresses.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#4B5563',
                  marginBottom: 10, letterSpacing: 0.2 }}>
                  Select a saved address:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {savedAddresses.map(a => (
                    <label key={a.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${selectedSavedId === a.id ? '#C9972B' : '#E5E7EB'}`,
                      background: selectedSavedId === a.id ? '#FDF8F0' : '#FAFAFA',
                      transition: 'all 0.18s',
                    }}>
                      <input
                        type="radio"
                        name="saved_address"
                        checked={selectedSavedId === a.id}
                        onChange={() => {
                          setSelectedSavedId(a.id);
                          // If the saved address has structured fields, fill them in
                          if (a.fields) {
                            setAddr({ ...a.fields });
                          } else {
                            // Legacy: plain text address — put it in 'area' field
                            setAddr(prev => ({ ...prev, area: a.text || '' }));
                          }
                          setAddrSaved(true);
                        }}
                        style={{ accentColor: '#C9972B', marginTop: 2, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: '#111', margin: 0, lineHeight: 1.6 }}>
                          {a.fields
                            ? `${a.fields.name} · ${a.fields.phone} | ${a.fields.house}, ${a.fields.area}, ${a.fields.city} - ${a.fields.pincode}, ${a.fields.state}`
                            : a.text}
                        </p>
                        {a.isDefault && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#C9972B',
                            background: 'rgba(201,151,43,0.1)', padding: '2px 8px',
                            borderRadius: 20, marginTop: 4, display: 'inline-block',
                            textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}

                  {/* Option to fill in a new address manually */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${selectedSavedId === 'new' ? '#1A1A1A' : '#E5E7EB'}`,
                    background: selectedSavedId === 'new' ? '#F9F9F9' : '#FAFAFA',
                    transition: 'all 0.18s',
                  }}>
                    <input
                      type="radio"
                      name="saved_address"
                      checked={selectedSavedId === 'new'}
                      onChange={() => {
                        setSelectedSavedId('new');
                        setAddr({ name: user.name || '', phone: user.mobile || '',
                          house: '', area: '', pincode: '', city: '', state: '' });
                        setAddrSaved(false);
                      }}
                      style={{ accentColor: '#1A1A1A', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                      + Use a different address
                    </span>
                  </label>
                </div>

                {/* Divider before manual form */}
                {(selectedSavedId === 'new' || !selectedSavedId) && (
                  <div style={{ borderTop: '1px dashed #E5E7EB', margin: '18px 0 0' }} />
                )}
              </div>
            )}

            {/* Show form when: no saved addresses OR "new address" selected */}
            {(savedAddresses.length === 0 || selectedSavedId === 'new' || !selectedSavedId) && (
              <AddressForm
                addr={addr}
                onFieldChange={(field, val) => {
                  handleFieldChange(field, val);
                  // Save structured fields so this can be persisted later
                }}
                saved={addrSaved}
                onSave={() => {
                  if (buildAddressString()) {
                    setAddrSaved(true);
                    // Save structured fields to localStorage for future orders
                    try {
                      const existing = JSON.parse(localStorage.getItem('saved_addresses') || '[]');
                      const newEntry = {
                        id: Date.now(),
                        text: buildAddressString(),
                        fields: { ...addr },
                        isDefault: existing.length === 0,
                      };
                      const updated = [...existing, newEntry];
                      localStorage.setItem('saved_addresses', JSON.stringify(updated));
                    } catch {}
                  } else {
                    setError('Please fill in all required fields before saving.');
                  }
                }}
              />
            )}
          </Card>

          {/* ── 2. Order Review ── */}
          <Card>
            <SectionTitle icon="🛒">
              Order Review
              <span style={{ marginLeft: 4, fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>
                ({cartItems.reduce((s, i) => s + i.qty, 0)} items)
              </span>
            </SectionTitle>

            <div>
              {cartItems.map(item => (
                <OrderItem key={item.id} item={item} effectivePrice={effectivePrice} />
              ))}
            </div>

            {/* Mini total under items */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 14, marginTop: 4,
              fontSize: 14, fontWeight: 700, color: '#111',
            }}>
              <span>Items Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
          </Card>

        </div>

        {/* ══════════════════════════════════════════════
            RIGHT COLUMN — Sticky summary + Payment
            ══════════════════════════════════════════════ */}
        <div className="checkout-sticky" style={{
          display: 'flex', flexDirection: 'column', gap: 20,
          position: 'sticky', top: 88,
        }}>

          {/* ── Price Summary ── */}
          <Card>
            <SectionTitle icon="💰">Price Summary</SectionTitle>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Subtotal',         value: `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,     green: false, strike: false },
                { label: 'GST (5%)',          value: `₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,          green: false, strike: false },
                { label: 'Delivery Charges', value: 'FREE',                                                                    green: true,  strike: false },
              ].map(({ label, value, green }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 14, color: '#4B5563',
                }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: 600, color: green ? '#16A34A' : '#1F2937' }}>
                    {value}
                  </span>
                </div>
              ))}

              {/* Coupon discount row — shown only when applied */}
              {appliedCoupon && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 14, color: '#15803D',
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: 8, padding: '8px 10px', marginTop: 4,
                }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🎟 {appliedCoupon.code}
                    <button onClick={removeCoupon} title="Remove coupon" style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#DC2626', fontSize: 13, padding: '0 2px', lineHeight: 1,
                    }}>×</button>
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    − ₹{appliedCoupon.discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '2px solid #F3F4F6', margin: '16px 0 14px' }} />

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Total Amount</span>
              <span style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: -0.5,
              }}>
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {appliedCoupon && (
              <p style={{ fontSize: 12, color: '#15803D', fontWeight: 600, marginTop: 4 }}>
                🎉 You save ₹{appliedCoupon.discount_amount.toFixed(2)} with coupon!
              </p>
            )}

            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
              Inclusive of all taxes
            </p>
          </Card>

          {/* ── Coupon Code ── */}
          <Card>
            <SectionTitle icon="🎟">Promo Code</SectionTitle>

            {appliedCoupon ? (
              /* Applied state */
              <div style={{
                background: '#F0FDF4', border: '1.5px solid #86EFAC',
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#15803D', margin: 0 }}>
                      {appliedCoupon.code} applied!
                    </p>
                    <p style={{ fontSize: 12, color: '#16A34A', margin: '2px 0 0' }}>
                      {appliedCoupon.discount_type === 'percentage'
                        ? `${appliedCoupon.discount_value}% off`
                        : `₹${appliedCoupon.discount_value} flat off`}
                      {' · '}saving ₹{appliedCoupon.discount_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button onClick={removeCoupon} style={{
                  background: 'none', border: '1.5px solid #FCA5A5', color: '#DC2626',
                  borderRadius: 8, padding: '6px 14px', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                }}>Remove</button>
              </div>
            ) : (
              /* Input state */
              <div>
              <div className="coupon-row" style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') applyCoupon(); }}
                    placeholder="Enter promo code"
                    maxLength={30}
                    style={{
                      flex: 1, padding: '11px 14px',
                      border: `1.5px solid ${couponError ? '#FECACA' : '#E5E7EB'}`,
                      borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
                      outline: 'none', background: '#FAFAFA', color: '#111',
                      letterSpacing: 1, fontWeight: 600, textTransform: 'uppercase',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#C9972B'; }}
                    onBlur={e  => { e.target.style.borderColor = couponError ? '#FECACA' : '#E5E7EB'; }}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{
                      padding: '11px 20px', borderRadius: 10, border: 'none',
                      background: couponLoading || !couponCode.trim()
                        ? '#E5E7EB'
                        : 'linear-gradient(135deg,#1A1A1A,#333)',
                      color: couponLoading || !couponCode.trim() ? '#9CA3AF' : '#fff',
                      fontSize: 13, fontWeight: 700, cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer',
                      flexShrink: 0, transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>

                {/* Error */}
                {couponError && (
                  <p style={{ fontSize: 12, color: '#DC2626', marginTop: 8,
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ❌ {couponError}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* ── Payment Options ── */}
          <Card>
            <SectionTitle icon="🔒">Payment</SectionTitle>

            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14, marginTop: -10 }}>
              Online payment only. 100% secure.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PAYMENT_OPTIONS.map(opt => {
                const selected = payMethod === opt.value;
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `2px solid ${selected ? '#1A1A1A' : '#E5E7EB'}`,
                      background: selected ? '#F9F9F9' : '#fff',
                      cursor: 'pointer',
                      transition: 'border-color 0.18s ease, background 0.18s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setPayMethod(opt.value)}
                      style={{ accentColor: '#1A1A1A', width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{
                      color: selected ? '#1A1A1A' : '#6B7280',
                      display: 'flex', alignItems: 'center',
                      flexShrink: 0,
                    }}>
                      {opt.icon}
                    </span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0 }}>
                        {opt.label}
                      </p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Security note */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 14, padding: '9px 12px',
              background: '#F9FAFB', borderRadius: 8,
              border: '1px dashed #E5E7EB',
            }}>
              <span style={{ fontSize: 15 }}>🔒</span>
              <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>
                Your payment info is secured with 256-bit SSL encryption.
              </p>
            </div>
          </Card>

          {/* ── Error banner ── */}
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#B91C1C',
              border: '1px solid #FECACA', borderRadius: 10,
              padding: '12px 16px', fontSize: 13,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span>❌</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Pay Now CTA ── */}
          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              border: 'none',
              background: loading
                ? '#9CA3AF'
                : 'linear-gradient(135deg,#1A1A1A 0%,#333 100%)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3,
              boxShadow: loading ? 'none' : '0 6px 20px rgba(0,0,0,0.22)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? (
              <>⏳ Processing…</>
            ) : (
              <>🔒 Pay ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</>
            )}
          </button>

          <button
            onClick={() => navigate('/home/shop')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#9CA3AF', textAlign: 'center',
              textDecoration: 'underline', fontFamily: 'inherit',
            }}
          >
            ← Continue Shopping
          </button>

        </div>
      </div>

      {/* ── Responsive breakpoint ── */}
      <style>{`
        @media (max-width: 860px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .checkout-sticky { position: static !important; }
        }
      `}</style>

    </div>
  );
}
