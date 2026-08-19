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
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import api from '../../services/api';
import AvailableCoupons from '../../Components/AvailableCoupons';

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

        <AddressField id="name"  label="Full Name *"                placeholder="e.g. Ramesh Kumar"        value={addr.name}      onChange={e => onFieldChange('name',  e.target.value)}              />
        <AddressField id="phone" label="Phone Number *"             placeholder="10-digit mobile number"   value={addr.phone}     onChange={e => onFieldChange('phone', e.target.value)} type="tel"   />
        <AddressField id="house" label="House / Flat / Block No *"  placeholder="e.g. 12B, 3rd Floor"      value={addr.house}     onChange={e => onFieldChange('house', e.target.value)}              />
        <AddressField id="area"  label="Area / Street / Locality *" placeholder="e.g. Anna Nagar"          value={addr.area}      onChange={e => onFieldChange('area',  e.target.value)}              />

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

        {/* Alternate phone — full width, optional */}
        <div style={{ gridColumn: 'span 2' }}>
          <label htmlFor="alt_phone" style={labelStyle}>
            Alternate Phone
            <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6, fontSize: 11 }}>
              (optional — for delivery if primary is unreachable)
            </span>
          </label>
          <input
            id="alt_phone"
            type="tel"
            value={addr.alt_phone || ''}
            placeholder="10-digit alternate number"
            onChange={e => onFieldChange('alt_phone', e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#C9972B'; }}
            onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
          />
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

/* ─── Order review item row ─────────────────────────────────── */
function OrderItem({ item, effectivePrice }) {
  const visual    = getProductVisual(item.name ?? '');
  /* resolveImageUrl handles: null → null, /uploads/… → full Render URL, https://… → as-is */
  const imgSrc    = resolveImageUrl(item.image_url) || visual.localImage || null;
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
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
              /* Show emoji fallback */
              const fb = e.currentTarget.nextElementSibling;
              if (fb) fb.style.display = 'flex';
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
          {item.variant_label && (
            <span style={{ fontWeight: 500, color: '#9CA3AF', fontSize: 12, marginLeft: 6 }}>
              · {item.variant_label}
            </span>
          )}
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
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saved_addresses') || '[]'); }
    catch { return []; }
  });
  const [selectedSavedId, setSelectedSavedId] = useState(() => {
    try {
      const addrs = JSON.parse(localStorage.getItem('saved_addresses') || '[]');
      const def = addrs.find(a => a.isDefault);
      return def ? def.id : null;
    } catch { return null; }
  });
  /* Which saved address is currently being edited (null = none) */
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [editFields,    setEditFields]    = useState({});

  /* ── Start editing a saved address — open pre-filled inline form ── */
  const startEditAddress = (a) => {
    setEditingAddrId(a.id);
    setEditFields({ ...(a.fields || { area: a.text || '', name: '', phone: '', house: '', pincode: '', city: '', state: '', alt_phone: '' }) });
  };

  /* ── Save the edited address back to localStorage ── */
  const saveEditedAddress = () => {
    const { name, phone, house, area, pincode, city, state } = editFields;
    if (!name?.trim() || !phone?.trim() || !house?.trim() || !area?.trim() || !pincode?.trim() || !city?.trim() || !state) return;

    const text = `${name}, ${phone} | ${house}, ${area}, ${city} - ${pincode}, ${state}`;
    const updated = savedAddresses.map(a =>
      a.id === editingAddrId
        ? { ...a, text, fields: { ...editFields } }
        : a
    );
    localStorage.setItem('saved_addresses', JSON.stringify(updated));
    setSavedAddresses(updated);

    // If the edited address is currently selected, update the active addr state too
    if (selectedSavedId === editingAddrId) {
      setAddr({ ...editFields });
    }
    setEditingAddrId(null);
    setEditFields({});
  };

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
      house: '', area: '', pincode: '', city: '', state: '', alt_phone: '',
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

  /* ── Price calculation ────────────────────────────────────
     Delivery is FREE when subtotal ≥ ₹2000, else ₹99.
  ─────────────────────────────────────────────────────────── */
  const DELIVERY_FEE       = 99;                                   // standard delivery fee
  const FREE_DELIVERY_MIN  = 2000;                                 // threshold for free delivery
  const subtotal           = cartTotal;
  const gst                = subtotal * 0.05;
  const deliveryCharge     = subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
  const discount           = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const grandTotal         = subtotal + gst + deliveryCharge - discount;

  /* ── Apply coupon ─────────────────────────────────────────── */
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setAppliedCoupon(null);
    try {
      const res = await api.post('/api/coupons/validate', {
        code: couponCode.trim(),
        order_total: subtotal + gst + deliveryCharge,
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
    const { name, phone, house, area, pincode, city, state, alt_phone } = addr;
    if (!name.trim() || !phone.trim() || !house.trim() ||
        !area.trim() || !pincode.trim() || !city.trim() || !state) {
      return null;
    }
    const altPart = alt_phone?.trim() ? ` | Alt: ${alt_phone.trim()}` : '';
    return `${name}, ${phone}${altPart} | ${house}, ${area}, ${city} - ${pincode}, ${state}`;
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
    /* Calculate delivery date: +5 business days from today */
    const getDeliveryDate = () => {
      const d = new Date();
      let added = 0;
      while (added < 5) {
        d.setDate(d.getDate() + 1);
        const day = d.getDay();
        if (day !== 0 && day !== 6) added++;
      }
      return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const deliveryDate   = getDeliveryDate();
    const itemCount      = cartItems.length; // already cleared, so use a snapshot if needed
    const successOrderId = success.orderId;
    const successPayId   = success.paymentId;

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#FAFAF8 0%,#FDF8F0 60%,#FBF6ED 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,32px)',
        fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* ── Success icon + headline ── */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {/* Animated checkmark circle */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'linear-gradient(135deg,#C9972B,#F5C842)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 12px 40px rgba(201,151,43,0.40), 0 4px 12px rgba(201,151,43,0.20)',
              animation: 'cs-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="#1a0a00" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              color: '#15803D', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 1.5,
              padding: '5px 14px', borderRadius: 30, marginBottom: 16,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
              Payment Successful
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(24px,4vw,32px)',
              fontWeight: 800, color: '#1C1917',
              lineHeight: 1.2, marginBottom: 10,
            }}>
              Order Confirmed! 🎉
            </h1>
            <p style={{ fontSize: 15, color: '#78716C', lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
              Thank you for shopping with <strong style={{ color: '#1C1917' }}>Petrichor Naturals</strong>.
              Your order is now being prepared fresh for you.
            </p>
          </div>

          {/* ── Order Summary Card ── */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid rgba(231,226,217,0.9)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            marginBottom: 20,
          }}>
            {/* Card header */}
            <div style={{
              background: 'linear-gradient(135deg,#1C1917,#2D2520)',
              padding: '18px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'rgba(201,151,43,0.2)',
                  border: '1px solid rgba(201,151,43,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>📋</div>
                <div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)',
                    textTransform: 'uppercase', letterSpacing: 1.2, margin: 0 }}>
                    Order Summary
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
                    #{successOrderId}
                  </p>
                </div>
              </div>
              <div style={{
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                color: '#4ADE80', fontSize: 11, fontWeight: 700,
                padding: '4px 12px', borderRadius: 20,
                textTransform: 'uppercase', letterSpacing: 0.8,
              }}>
                Confirmed
              </div>
            </div>

            {/* Card body — detail rows */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Order ID */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 0', borderBottom: '1px solid #F5F5F3',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🆔</span>
                  <span style={{ fontSize: 13, color: '#78716C', fontWeight: 500 }}>Order ID</span>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: '#1C1917',
                  background: '#F5F5F3', padding: '3px 10px', borderRadius: 6,
                  fontFamily: 'monospace', letterSpacing: 0.3,
                }}>
                  #{successOrderId}
                </span>
              </div>

              {/* Payment ID */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 0', borderBottom: '1px solid #F5F5F3',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>💳</span>
                  <span style={{ fontSize: 13, color: '#78716C', fontWeight: 500 }}>Payment ID</span>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: '#44403C',
                  background: '#F5F5F3', padding: '3px 10px', borderRadius: 6,
                  fontFamily: 'monospace', letterSpacing: 0.2,
                  maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', display: 'block',
                }}
                  title={successPayId}
                >
                  {successPayId}
                </span>
              </div>

              {/* Amount paid */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 0', borderBottom: '1px solid #F5F5F3',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>₹</span>
                  <span style={{ fontSize: 13, color: '#78716C', fontWeight: 500 }}>Amount Paid</span>
                </div>
                <span style={{
                  fontSize: 16, fontWeight: 800, color: '#1C1917',
                }}>
                  ₹{Number(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Payment method */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 0', borderBottom: '1px solid #F5F5F3',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🔒</span>
                  <span style={{ fontSize: 13, color: '#78716C', fontWeight: 500 }}>Payment Method</span>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: '#1C1917',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {payMethod === 'upi' ? 'UPI' : payMethod === 'card' ? 'Card' : 'Net Banking'}
                </span>
              </div>

              {/* Delivery address snippet */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '13px 0', borderBottom: '1px solid #F5F5F3', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>📍</span>
                  <span style={{ fontSize: 13, color: '#78716C', fontWeight: 500 }}>Deliver To</span>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 500, color: '#44403C',
                  textAlign: 'right', lineHeight: 1.6,
                  maxWidth: 240,
                }}>
                  {addr.name
                    ? `${addr.name}, ${addr.house || ''} ${addr.area || ''}, ${addr.city || ''}`
                    : 'Address as entered'}
                </span>
              </div>

              {/* Expected delivery — highlighted row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '15px 16px', margin: '8px 0 0',
                background: 'linear-gradient(135deg,#FEF3C7,#FFFBEB)',
                border: '1px solid #FDE68A',
                borderRadius: 12, gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🚚</span>
                  <div>
                    <p style={{ fontSize: 11, color: '#92400E', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                      Expected Delivery
                    </p>
                    <p style={{ fontSize: 12, color: '#78716C', margin: '2px 0 0', fontWeight: 500 }}>
                      3–5 business days
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#92400E', margin: 0 }}>
                    By {deliveryDate}
                  </p>
                  <p style={{ fontSize: 11, color: '#A16207', margin: '2px 0 0', fontWeight: 500 }}>
                    Free delivery included
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ── What happens next banner ── */}
          <div style={{
            background: '#fff',
            border: '1px solid rgba(231,226,217,0.9)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>📦</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1917', margin: '0 0 4px' }}>
                What happens next?
              </p>
              <p style={{ fontSize: 12, color: '#78716C', lineHeight: 1.7, margin: 0 }}>
                We'll freshly pack your cashews and dispatch within 24 hours. You'll be able to track your
                order from the My Orders page. Questions? Reach us on WhatsApp.
              </p>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => navigate('/home/orders')}
              style={{
                width: '100%', padding: '14px',
                borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#1C1917,#2D2520)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', letterSpacing: 0.2,
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              📋 Track My Order →
            </button>
            <button
              onClick={() => navigate('/home/shop')}
              style={{
                width: '100%', padding: '13px',
                borderRadius: 12,
                border: '1.5px solid rgba(231,226,217,0.9)',
                background: '#fff', color: '#44403C',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                letterSpacing: 0.1,
                transition: 'border-color 0.18s, color 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9972B'; e.currentTarget.style.color = '#C9972B'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(231,226,217,0.9)'; e.currentTarget.style.color = '#44403C'; }}
            >
              🛍 Continue Shopping
            </button>
          </div>

          {/* ── Support note ── */}
          <p style={{ textAlign: 'center', fontSize: 12, color: '#A8A29E', marginTop: 20, lineHeight: 1.6 }}>
            Need help? <a href="/home/contact" style={{ color: '#C9972B', fontWeight: 600, textDecoration: 'none' }}>Contact us</a> or reach us on WhatsApp.
            Order confirmation will be sent to your registered email.
          </p>

        </div>

        {/* Pop animation keyframe */}
        <style>{`
          @keyframes cs-pop {
            0%   { transform: scale(0.6); opacity: 0; }
            60%  { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(1); }
          }
        `}</style>
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
                    <div key={a.id}>
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 14px', borderRadius: 10,
                        border: `1.5px solid ${selectedSavedId === a.id ? '#C9972B' : '#E5E7EB'}`,
                        background: selectedSavedId === a.id ? '#FDF8F0' : '#FAFAFA',
                        transition: 'all 0.18s',
                      }}>
                        {/* Radio select */}
                        <input
                          type="radio"
                          name="saved_address"
                          checked={selectedSavedId === a.id}
                          onChange={() => {
                            setSelectedSavedId(a.id);
                            setEditingAddrId(null);
                            if (a.fields) {
                              setAddr({ ...a.fields });
                            } else {
                              setAddr(prev => ({ ...prev, area: a.text || '' }));
                            }
                            setAddrSaved(true);
                          }}
                          style={{ accentColor: '#C9972B', marginTop: 3, flexShrink: 0 }}
                        />

                        {/* Address text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: '#111', margin: 0, lineHeight: 1.6 }}>
                            {a.fields
                              ? `${a.fields.name} · ${a.fields.phone}${a.fields.alt_phone ? ` / ${a.fields.alt_phone}` : ''} | ${a.fields.house}, ${a.fields.area}, ${a.fields.city} - ${a.fields.pincode}, ${a.fields.state}`
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

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (editingAddrId === a.id) {
                              setEditingAddrId(null); // toggle off
                            } else {
                              startEditAddress(a);
                              setSelectedSavedId(a.id); // select this address when editing
                            }
                          }}
                          title="Edit this address"
                          style={{
                            background: editingAddrId === a.id ? '#FEF3C7' : 'none',
                            border: `1px solid ${editingAddrId === a.id ? '#F59E0B' : '#D1D5DB'}`,
                            borderRadius: 7,
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: editingAddrId === a.id ? '#92400E' : '#6B7280',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (editingAddrId !== a.id) { e.currentTarget.style.borderColor = '#C9972B'; e.currentTarget.style.color = '#C9972B'; } }}
                          onMouseLeave={e => { if (editingAddrId !== a.id) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#6B7280'; } }}
                        >
                          {/* Pencil SVG */}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          {editingAddrId === a.id ? 'Cancel' : 'Edit'}
                        </button>
                      </div>

                      {/* ── Inline edit form — only shown when this card is being edited ── */}
                      {editingAddrId === a.id && (
                        <div style={{
                          marginTop: 2,
                          padding: '16px 14px',
                          background: '#FFFBF0',
                          border: '1.5px solid #F59E0B',
                          borderTop: 'none',
                          borderRadius: '0 0 10px 10px',
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E',
                            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                            ✏️ Editing address
                          </p>
                          <div className="checkout-addr-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
                            {[
                              { key: 'name',    label: 'Full Name *',           placeholder: 'e.g. Ramesh Kumar',       type: 'text' },
                              { key: 'phone',   label: 'Phone Number *',         placeholder: '10-digit mobile',         type: 'tel'  },
                              { key: 'house',   label: 'House / Flat *',          placeholder: 'e.g. 12B, 3rd Floor',     type: 'text' },
                              { key: 'area',    label: 'Area / Street *',         placeholder: 'e.g. Anna Nagar',         type: 'text' },
                              { key: 'pincode', label: 'Pincode *',               placeholder: '6-digit PIN',             type: 'text' },
                              { key: 'city',    label: 'City *',                  placeholder: 'e.g. Chennai',            type: 'text' },
                            ].map(f => (
                              <div key={f.key}>
                                <label style={{ ...labelStyle, fontSize: 11 }}>{f.label}</label>
                                <input
                                  type={f.type}
                                  value={editFields[f.key] || ''}
                                  placeholder={f.placeholder}
                                  maxLength={f.key === 'pincode' ? 6 : undefined}
                                  onChange={e => setEditFields(prev => ({
                                    ...prev,
                                    [f.key]: f.key === 'pincode' ? e.target.value.replace(/\D/g, '') : e.target.value
                                  }))}
                                  style={{ ...inputStyle, fontSize: 13 }}
                                  onFocus={e => { e.target.style.borderColor = '#F59E0B'; }}
                                  onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
                                />
                              </div>
                            ))}

                            {/* State — full width */}
                            <div style={{ gridColumn: 'span 2' }}>
                              <label style={{ ...labelStyle, fontSize: 11 }}>State *</label>
                              <select
                                value={editFields.state || ''}
                                onChange={e => setEditFields(prev => ({ ...prev, state: e.target.value }))}
                                style={{ ...inputStyle, cursor: 'pointer', fontSize: 13 }}
                                onFocus={e => { e.target.style.borderColor = '#F59E0B'; }}
                                onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
                              >
                                <option value="">Select state…</option>
                                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>

                            {/* Alternate phone — full width */}
                            <div style={{ gridColumn: 'span 2' }}>
                              <label style={{ ...labelStyle, fontSize: 11 }}>
                                Alternate Phone
                                <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontSize: 10 }}>(optional)</span>
                              </label>
                              <input
                                type="tel"
                                value={editFields.alt_phone || ''}
                                placeholder="10-digit alternate number"
                                onChange={e => setEditFields(prev => ({ ...prev, alt_phone: e.target.value }))}
                                style={{ ...inputStyle, fontSize: 13 }}
                                onFocus={e => { e.target.style.borderColor = '#F59E0B'; }}
                                onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
                              />
                            </div>
                          </div>

                          {/* Save edit button */}
                          <button
                            type="button"
                            onClick={saveEditedAddress}
                            style={{
                              marginTop: 14,
                              padding: '9px 22px',
                              borderRadius: 8,
                              border: 'none',
                              background: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
                              color: '#1a0a00',
                              fontSize: 13,
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 3px 10px rgba(245,158,11,0.35)',
                              transition: 'all 0.18s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            ✓ Save Changes
                          </button>
                        </div>
                      )}
                    </div>
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
                        setEditingAddrId(null);
                        setAddr({ name: user.name || '', phone: user.mobile || '',
                          house: '', area: '', pincode: '', city: '', state: '', alt_phone: '' });
                        setAddrSaved(false);
                      }}
                      style={{ accentColor: '#1A1A1A', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                      + Use a different address
                    </span>
                  </label>
                </div>

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
                { label: 'Subtotal',         value: `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,     green: false },
                { label: 'GST (5%)',          value: `₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,          green: false },
                {
                  label: 'Delivery Charges',
                  value: deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`,
                  green: deliveryCharge === 0,
                },
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

              {/* Delivery threshold nudge — shown only when delivery is charged */}
              {deliveryCharge > 0 && (
                <div style={{
                  fontSize: 11, color: '#6B7280',
                  background: '#FFF7ED', border: '1px dashed #FCD34D',
                  borderRadius: 8, padding: '7px 10px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  🚚 Add ₹{(FREE_DELIVERY_MIN - subtotal).toLocaleString('en-IN')} more to get FREE delivery
                </div>
              )}

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
              Inclusive of all taxes · Free delivery on orders ₹{FREE_DELIVERY_MIN.toLocaleString('en-IN')}+
            </p>
          </Card>

          {/* ── Coupon Code ── */}
          <Card>
            <SectionTitle icon="🎟">Promo Code</SectionTitle>

            {/* ── Available coupons panel ── */}
            {!appliedCoupon && (
              <div style={{ marginBottom: 16 }}>
                <AvailableCoupons
                  orderTotal={subtotal + gst + deliveryCharge}
                  appliedCode={appliedCoupon?.code || null}
                  onApply={(code) => {
                    setCouponCode(code);
                    setCouponError(null);
                    // Auto-trigger validation immediately
                    setCouponLoading(true);
                    api.post('/api/coupons/validate', {
                      code,
                      order_total: subtotal + gst + deliveryCharge,
                    })
                      .then(r => { setAppliedCoupon(r.data.data); setCouponCode(''); })
                      .catch(err => setCouponError(err.response?.data?.message || 'Invalid coupon.'))
                      .finally(() => setCouponLoading(false));
                  }}
                />
              </div>
            )}

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
