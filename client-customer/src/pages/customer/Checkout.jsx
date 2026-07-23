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

/* ─── Address form ──────────────────────────────────────────── */
function AddressForm({ addr, setAddr, saved, onSave }) {
  const update = (field, val) => setAddr(prev => ({ ...prev, [field]: val }));

  const Field = ({ id, label, placeholder, half, type = 'text' }) => (
    <div style={{ gridColumn: half ? 'span 1' : 'span 2' }}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input
        id={id}
        type={type}
        value={addr[id] || ''}
        placeholder={placeholder}
        onChange={e => update(id, e.target.value)}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#C9972B'}
        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
      />
    </div>
  );

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '14px 16px',
      }}>
        {/* Full name — full width */}
        <Field id="name"     label="Full Name *"             placeholder="e.g. Ramesh Kumar"  />
        {/* Phone — full width */}
        <Field id="phone"    label="Phone Number *"          placeholder="10-digit mobile number" type="tel" />
        {/* House no — full width */}
        <Field id="house"    label="House / Flat / Block No *" placeholder="e.g. 12B, 3rd Floor" />
        {/* Area — full width */}
        <Field id="area"     label="Area / Street / Locality *" placeholder="e.g. Anna Nagar" />
        {/* Pincode — half */}
        <div>
          <label htmlFor="pincode" style={labelStyle}>Pincode *</label>
          <input
            id="pincode"
            type="text"
            maxLength={6}
            value={addr.pincode || ''}
            placeholder="6-digit PIN"
            onChange={e => update('pincode', e.target.value.replace(/\D/g, ''))}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#C9972B'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>
        {/* City — half */}
        <div>
          <label htmlFor="city" style={labelStyle}>City *</label>
          <input
            id="city"
            type="text"
            value={addr.city || ''}
            placeholder="e.g. Chennai"
            onChange={e => update('city', e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#C9972B'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>
        {/* State — full width */}
        <div style={{ gridColumn: 'span 2' }}>
          <label htmlFor="state" style={labelStyle}>State *</label>
          <select
            id="state"
            value={addr.state || ''}
            onChange={e => update('state', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = '#C9972B'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
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
            padding: '9px 22px',
            borderRadius: 8,
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

  /* Address state */
  const [addr, setAddr] = useState({
    name: user.name || '', phone: user.mobile || '',
    house: '', area: '', pincode: '', city: '', state: '',
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

  /* Derived totals */
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

  /* ── Place order ─────────────────────────────────────────── */
  const handlePay = async () => {
    setError(null);
    const addressStr = buildAddressString();

    if (!addressStr) {
      setError('Please fill in all required address fields.');
      return;
    }

    setLoading(true);

    /* Simulate brief payment processing */
    await new Promise(r => setTimeout(r, 900));

    try {
      const items = cartItems.map(item => ({
        product_id: item.id,
        quantity:   item.qty,
      }));

      const res = await api.post('/api/orders', {
        customer_id:    user.id,
        items,
        address:        addressStr,
        payment_method: payMethod,
        total_amount:   parseFloat(grandTotal.toFixed(2)),
      });

      const orderId = res.data.data?.id || res.data.id || '—';
      clearCart();
      setSuccess({ orderId });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Order failed. Please try again.');
    } finally {
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
          Order <strong style={{ color: '#1A1A1A' }}>#{success.orderId}</strong> has been placed successfully.
        </p>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 36 }}>
          We'll pack and dispatch your cashews soon.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 28,
        alignItems: 'start',
      }}>

        {/* ══════════════════════════════════════════════
            LEFT COLUMN — Address + Order Review
            ══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── 1. Delivery Address ── */}
          <Card>
            <SectionTitle icon="📍">Delivery Address</SectionTitle>
            <AddressForm
              addr={addr}
              setAddr={(updater) => {
                setAddr(updater);
                setAddrSaved(false); // un-save when fields change
              }}
              saved={addrSaved}
              onSave={() => {
                if (buildAddressString()) setAddrSaved(true);
                else setError('Please fill in all required fields before saving.');
              }}
            />
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
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 20,
          position: 'sticky', top: 88,   /* sits just below the 72px header */
        }}>

          {/* ── Price Summary ── */}
          <Card>
            <SectionTitle icon="💰">Price Summary</SectionTitle>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Subtotal',         value: `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,     green: false },
                { label: 'GST (5%)',          value: `₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,          green: false },
                { label: 'Delivery Charges', value: 'FREE',                                                                    green: true  },
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

            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
              Inclusive of all taxes
            </p>
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
