import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { getProductVisual } from '../../utils/productVisual';

const GRADE_INFO = {
  w180: { label:'W180 — Largest',      color:'#7B3F00', desc:'~180 kernels/lb. Best for gifting.' },
  w210: { label:'W210 — Extra Large',  color:'#8B4513', desc:'~210 kernels/lb. Premium snacking.' },
  w240: { label:'W240 — Large',        color:'#A0522D', desc:'~240 kernels/lb. Great for snacking & cooking.' },
  w320: { label:'W320 — Medium',       color:'#C9972B', desc:'Most popular grade. All-round choice.' },
  w450: { label:'W450 — Small',        color:'#B8860B', desc:'~450 kernels/lb. Ideal for sweets.' },
};

function getGradeInfo(name = '') {
  const n = name.toLowerCase();
  for (const [key, info] of Object.entries(GRADE_INFO)) {
    if (n.includes(key)) return info;
  }
  return null;
}

function ImageZoom({ src, alt, onClose }) {
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.85)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24, backdropFilter:'blur(8px)',
    }}>
      <button onClick={onClose} style={{
        position:'absolute', top:20, right:24, background:'rgba(255,255,255,0.1)',
        border:'none', color:'#fff', width:42, height:42, borderRadius:'50%',
        fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      }}>×</button>
      <img src={src} alt={alt} onClick={e => e.stopPropagation()}
        style={{ maxWidth:'90vw', maxHeight:'88vh', objectFit:'contain', borderRadius:16 }} />
    </div>
  );
}

export default function ProductDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { showToast } = useToast();

  const [product,  setProduct]  = useState(null);
  const [related,  setRelated]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [qty,      setQty]      = useState(1);
  const [added,    setAdded]    = useState(false);
  const [zoomed,   setZoomed]   = useState(false);

  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/products/${id}`)
      .then(r => {
        setProduct(r.data.data);
        api.get('/api/products', { params:{ limit:5 } })
          .then(pr => setRelated((pr.data.data||[]).filter(p => p.id !== Number(id)).slice(0,4)))
          .catch(() => {});
      })
      .catch(err => setError(err.response?.data?.message || 'Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const inCart     = cartItems.find(i => i.id === product?.id);
  const outOfStock = product ? Number(product.stock_quantity) <= 0 : false;
  const visual     = product ? getProductVisual(product.name) : null;
  const gradeInfo  = product ? getGradeInfo(product.name) : null;

  const handleAdd = () => {
    if (!product || outOfStock) return;
    for (let i = 0; i < qty; i++) addToCart(product);
    showToast(`"${product.name}" × ${qty} added to cart 🛒`, 'success');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div style={{ padding:'60px 48px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48 }}>
        {[440, 320].map((h,i) => (
          <div key={i} style={{ borderRadius:20, height:h,
            background:'linear-gradient(90deg,#F0F0F0 25%,#FAFAFA 50%,#F0F0F0 75%)',
            backgroundSize:'200% 100%', animation:'pcShimmer 1.4s infinite' }} />
        ))}
      </div>
      <style>{`@keyframes pcShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding:'80px 48px', textAlign:'center' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>😕</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:'#1A1A1A', marginBottom:8 }}>{error}</h2>
      <button onClick={() => navigate('/home/shop')} style={{
        marginTop:20, background:'#1A1A1A', color:'#fff', border:'none',
        borderRadius:10, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer',
      }}>← Back to Shop</button>
    </div>
  );

  if (!product) return null;

  return (
    <div style={{ background:'#FAFAFA', minHeight:'100vh' }}>

      {/* Breadcrumb */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F0F0F0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'14px 48px',
          display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#9CA3AF' }}>
          {[['Home','/home'],['Shop','/home/shop']].map(([l,p]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => navigate(p)} style={{ background:'none', border:'none',
                cursor:'pointer', color:'#9CA3AF', fontSize:13, padding:0 }}>{l}</button>
              <span>›</span>
            </span>
          ))}
          {product.category_name && <><span style={{ color:'#9CA3AF' }}>{product.category_name}</span><span>›</span></>}
          <span style={{ color:'#1A1A1A', fontWeight:600,
            maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {product.name}
          </span>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 48px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:52, alignItems:'start' }}>

          {/* LEFT — Image */}
          <div>
            <div onClick={() => product.image_url && setZoomed(true)} style={{
              borderRadius:24, overflow:'hidden',
              background: product.image_url ? '#F7F4EF' : visual.bg,
              height:420, display:'flex', alignItems:'center', justifyContent:'center',
              cursor: product.image_url ? 'zoom-in' : 'default',
              border:'1px solid #EBEBEB', boxShadow:'0 4px 24px rgba(0,0,0,0.08)',
              position:'relative',
            }}>
              {product.image_url ? (
                <>
                  <img src={product.image_url} alt={product.name}
                    style={{ width:'100%', height:'100%', objectFit:'contain',
                      objectPosition:'center', padding:24 }} />
                  <div style={{ position:'absolute', bottom:14, right:14,
                    background:'rgba(0,0,0,0.4)', color:'#fff',
                    fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>
                    🔍 Click to zoom
                  </div>
                </>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:96, filter:'drop-shadow(0 8px 20px rgba(0,0,0,0.25))' }}>{visual.emoji}</span>
                  <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.85)',
                    textTransform:'uppercase', letterSpacing:2,
                    background:'rgba(0,0,0,0.2)', padding:'4px 16px', borderRadius:20 }}>
                    {visual.tag}
                  </span>
                </div>
              )}
              {outOfStock && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)',
                  display:'flex', alignItems:'center', justifyContent:'center', borderRadius:24 }}>
                  <span style={{ background:'rgba(0,0,0,0.7)', color:'#fff',
                    fontSize:15, fontWeight:700, padding:'10px 24px', borderRadius:30 }}>
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Trust badges */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:18 }}>
              {[['🌿','No Preservatives'],['📦','Fresh Packed'],['🚚','Fast Delivery']].map(([icon,text]) => (
                <div key={text} style={{ background:'#fff', borderRadius:12, padding:'12px 10px',
                  border:'1px solid #EBEBEB', textAlign:'center' }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#4A4A4A' }}>{text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Details */}
          <div>
            {product.category_name && (
              <span style={{ fontSize:10, fontWeight:800, color:'#C9972B',
                textTransform:'uppercase', letterSpacing:2 }}>{product.category_name}</span>
            )}
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:800,
              color:'#1A1A1A', lineHeight:1.2, margin:'10px 0 6px' }}>
              {product.name}
            </h1>

            {gradeInfo && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:8,
                background: gradeInfo.color + '15', border:`1.5px solid ${gradeInfo.color}40`,
                color: gradeInfo.color, fontSize:12, fontWeight:700,
                padding:'5px 14px', borderRadius:20, marginBottom:18 }}>
                🏷 {gradeInfo.label}
              </div>
            )}

            {/* Stock */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                background: outOfStock ? '#EF4444' : '#22C55E',
                boxShadow:`0 0 0 3px ${outOfStock ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }} />
              <span style={{ fontSize:13, fontWeight:600, color: outOfStock ? '#EF4444' : '#15803D' }}>
                {outOfStock ? 'Out of Stock' : `In Stock — ${product.stock_quantity} ${product.unit||'kg'} available`}
              </span>
            </div>

            {/* Price */}
            <div style={{ background:'linear-gradient(135deg,#FDF8F3,#FAF0E0)',
              borderRadius:16, padding:'20px 22px', border:'1px solid #F0E8D0', marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                <span style={{ fontFamily:"'Playfair Display',serif",
                  fontSize:40, fontWeight:800, color:'#1A1A1A' }}>
                  ₹{Number(product.price).toFixed(0)}
                </span>
                <span style={{ fontSize:14, color:'#9CA3AF', fontWeight:500 }}>
                  per {product.unit || 'kg'}
                </span>
              </div>
              {Number(product.stock_quantity) > 0 && Number(product.stock_quantity) <= 10 && (
                <p style={{ fontSize:12, color:'#F59E0B', fontWeight:700, marginTop:8 }}>
                  ⚠ Only {product.stock_quantity} {product.unit||'kg'} left — order soon!
                </p>
              )}
            </div>

            {product.description && (
              <div style={{ marginBottom:24 }}>
                <h3 style={{ fontSize:13, fontWeight:700, color:'#9CA3AF',
                  textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Description</h3>
                <p style={{ fontSize:14, color:'#4A4A4A', lineHeight:1.85 }}>{product.description}</p>
              </div>
            )}

            {gradeInfo && (
              <div style={{ background:'#F8F4EF', borderRadius:12, padding:'14px 16px',
                border:'1px solid #EBEBEB', marginBottom:24,
                fontSize:13, color:'#6B6B6B', lineHeight:1.7 }}>
                ℹ️ <strong style={{ color:'#1A1A1A' }}>{gradeInfo.label}:</strong> {gradeInfo.desc}
              </div>
            )}

            {/* Qty + Add to Cart */}
            {!outOfStock && (
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#4A4A4A',
                  textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:8 }}>
                  Quantity
                </label>
                <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center',
                    border:'1.5px solid #E5E7EB', borderRadius:10, overflow:'hidden' }}>
                    <button onClick={() => setQty(q => Math.max(1, q-1))}
                      style={{ width:40, height:44, background:'#F9FAFB', border:'none',
                        fontSize:18, cursor:'pointer', color:'#1A1A1A', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#F0F0F0'}
                      onMouseLeave={e => e.currentTarget.style.background='#F9FAFB'}>−</button>
                    <span style={{ width:44, textAlign:'center', fontSize:16, fontWeight:700, color:'#1A1A1A' }}>
                      {qty}
                    </span>
                    <button onClick={() => setQty(q => Math.min(Number(product.stock_quantity), q+1))}
                      style={{ width:40, height:44, background:'#F9FAFB', border:'none',
                        fontSize:18, cursor:'pointer', color:'#1A1A1A', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#F0F0F0'}
                      onMouseLeave={e => e.currentTarget.style.background='#F9FAFB'}>+</button>
                  </div>
                  <span style={{ fontSize:13, color:'#9CA3AF' }}>
                    × ₹{Number(product.price).toFixed(0)} = {' '}
                    <strong style={{ color:'#1A1A1A' }}>₹{(qty * Number(product.price)).toFixed(0)}</strong>
                  </span>
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <button onClick={handleAdd} disabled={outOfStock} style={{
                padding:'15px 24px', borderRadius:12, border:'none',
                background: added ? '#16a34a' : outOfStock ? '#E5E5E5'
                  : 'linear-gradient(135deg,#1a0a00,#3d1a00)',
                color: outOfStock ? '#9CA3AF' : '#fff',
                fontSize:15, fontWeight:800, cursor: outOfStock ? 'not-allowed' : 'pointer',
                transition:'all 0.2s', boxShadow: outOfStock ? 'none' : '0 4px 16px rgba(26,10,0,0.2)',
              }}>
                {outOfStock ? '✗ Out of Stock' : added ? '✓ Added to Cart!'
                  : inCart ? `🛒 Add More (${inCart.qty} in cart)` : '🛒 Add to Cart'}
              </button>
              <button onClick={() => { handleAdd(); setTimeout(() => navigate('/home/checkout'), 300); }}
                disabled={outOfStock} style={{
                  padding:'14px 24px', borderRadius:12,
                  border:'2px solid #1a0a00', background:'transparent',
                  color:'#1a0a00', fontSize:15, fontWeight:700,
                  cursor: outOfStock ? 'not-allowed' : 'pointer',
                  opacity: outOfStock ? 0.4 : 1,
                }}>⚡ Buy Now</button>
            </div>

            <div style={{ marginTop:20, padding:'12px 16px', borderRadius:10,
              background:'#F0FDF4', border:'1px solid #86EFAC',
              fontSize:12, color:'#15803D', fontWeight:600,
              display:'flex', alignItems:'center', gap:8 }}>
              🚚 Free delivery on orders above ₹499 · Ships within 1–2 days
            </div>
          </div>
        </div>

        {/* ── Reviews section ──────────────────────────────── */}
        <ReviewSection productId={product.id} />

        {/* Related products */}
        {related.length > 0 && (
          <div style={{ marginTop:64 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800, color:'#1A1A1A' }}>
                You Might Also Like
              </h2>
              <button onClick={() => navigate('/home/shop')} style={{
                background:'none', border:'1.5px solid #1A1A1A', color:'#1A1A1A',
                borderRadius:20, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer',
              }}>View All →</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
              {related.map(p => {
                const v = getProductVisual(p.name);
                return (
                  <div key={p.id} onClick={() => navigate(`/home/product/${p.id}`)}
                    style={{ background:'#fff', borderRadius:16, overflow:'hidden',
                      border:'1px solid #F0F0F0', cursor:'pointer', transition:'all 0.2s',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 28px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'; }}>
                    <div style={{ height:140, background: p.image_url ? '#F7F4EF' : v.bg,
                      display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name}
                            style={{ width:'100%', height:'100%', objectFit:'contain', padding:12 }} />
                        : <span style={{ fontSize:48 }}>{v.emoji}</span>}
                    </div>
                    <div style={{ padding:'12px 14px' }}>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700,
                        color:'#1A1A1A', lineHeight:1.3,
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {p.name}
                      </p>
                      <p style={{ fontSize:14, fontWeight:800, color:'#C9972B', marginTop:6 }}>
                        ₹{Number(p.price).toFixed(0)}
                        <span style={{ fontSize:11, color:'#9CA3AF', fontWeight:400 }}> /{p.unit||'kg'}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {zoomed && product.image_url && (
        <ImageZoom src={product.image_url} alt={product.name} onClose={() => setZoomed(false)} />
      )}
    </div>
  );
}
