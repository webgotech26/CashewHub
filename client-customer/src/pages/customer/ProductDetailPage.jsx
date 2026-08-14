import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { getProductVisual } from '../../utils/productVisual';
import { groupProductVariants } from '../../utils/groupVariants';
import ProductCard from '../../Components/ProductCard';

/* ── Star Rating Display ─────────────────────────────────────── */
function StarRow({ rating, size = 16, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => interactive && onRate && onRate(n)}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          style={{
            fontSize: size, lineHeight: 1,
            cursor: interactive ? 'pointer' : 'default',
            color: n <= (hovered || rating) ? '#F59E0B' : '#E5E7EB',
            transition: 'color 0.12s',
            userSelect: 'none',
          }}
        >★</span>
      ))}
    </div>
  );
}

/* ── Review Section — fetch + submit ─────────────────────────── */
function ReviewSection({ productId }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const [reviews,    setReviews]    = useState([]);
  const [avgRating,  setAvgRating]  = useState(0);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* Form state */
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [formMsg, setFormMsg] = useState(null); // { type: 'success'|'error', text }

  const fetchReviews = () => {
    setLoading(true);
    api.get(`/api/reviews/product/${productId}`)
      .then(r => {
        setReviews(r.data.data?.reviews || []);
        setAvgRating(r.data.data?.avg_rating || 0);
        setTotal(r.data.data?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setFormMsg({ type: 'error', text: 'Please select a star rating.' }); return; }
    setSubmitting(true); setFormMsg(null);
    try {
      await api.post('/api/reviews', { product_id: productId, rating, comment: comment.trim() });
      setFormMsg({ type: 'success', text: 'Review submitted! It will appear after moderation.' });
      setRating(0); setComment('');
      fetchReviews();
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit review.' });
    } finally {
      setSubmitting(false);
    }
  };

  /* Distribution bar widths */
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: total > 0 ? Math.round((reviews.filter(r => r.rating === star).length / total) * 100) : 0,
  }));

  return (
    <div style={{ marginTop: 64 }}>
      <h2 style={{
        fontFamily: "'Playfair Display',serif", fontSize: 24,
        fontWeight: 800, color: '#1A1A1A', marginBottom: 32,
      }}>
        Customer Reviews
      </h2>

      <div className="review-section-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

        {/* LEFT — Aggregate stats + Write review */}
        <div>
          {/* Rating summary */}
          <div style={{
            background: '#fff', borderRadius: 20, border: '1px solid #EBEBEB',
            padding: '24px 28px', marginBottom: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 52, fontWeight: 800, color: '#1A1A1A', lineHeight: 1,
                }}>
                  {avgRating.toFixed(1)}
                </div>
                <StarRow rating={Math.round(avgRating)} size={18} />
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                  {total} review{total !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dist.map(({ star, count, pct }) => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6B6B6B', width: 14, flexShrink: 0 }}>{star}</span>
                    <span style={{ fontSize: 12, color: '#F59E0B' }}>★</span>
                    <div style={{
                      flex: 1, height: 6, borderRadius: 3,
                      background: '#F0F0F0', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 3,
                        background: 'linear-gradient(90deg,#F59E0B,#FBBF24)',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#9CA3AF', width: 18, flexShrink: 0 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Write review form */}
          <div style={{
            background: '#fff', borderRadius: 20, border: '1px solid #EBEBEB',
            padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 16 }}>
              Write a Review
            </h3>

            {!isLoggedIn ? (
              <div style={{
                background: '#FDF8F3', borderRadius: 12, padding: '16px 18px',
                border: '1px solid #F0E8D0', fontSize: 14, color: '#6B4A1A',
              }}>
                Please <a href="/login" style={{ color: '#C9972B', fontWeight: 700 }}>log in</a> to write a review.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Star picker */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4A4A4A',
                    textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
                    Your Rating *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StarRow rating={rating} size={28} interactive onRate={setRating} />
                    {rating > 0 && (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#4A4A4A',
                    textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
                    Your Review (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience with this product…"
                    maxLength={500}
                    rows={4}
                    style={{
                      width: '100%', padding: '12px 14px',
                      border: '1.5px solid #E5E7EB', borderRadius: 12,
                      fontSize: 14, fontFamily: 'inherit', outline: 'none',
                      resize: 'vertical', boxSizing: 'border-box',
                      background: '#FAFAFA', color: '#111',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#C9972B'; }}
                    onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; }}
                  />
                  <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 }}>
                    {comment.length}/500
                  </p>
                </div>

                {/* Feedback message */}
                {formMsg && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                    fontSize: 13, fontWeight: 600,
                    background: formMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                    color:      formMsg.type === 'success' ? '#15803D' : '#B91C1C',
                    border:     `1px solid ${formMsg.type === 'success' ? '#86EFAC' : '#FECACA'}`,
                  }}>
                    {formMsg.type === 'success' ? '✅' : '❌'} {formMsg.text}
                  </div>
                )}

                <button type="submit" disabled={submitting || rating === 0} style={{
                  padding: '12px 28px', borderRadius: 12, border: 'none',
                  background: submitting || rating === 0 ? '#E5E7EB' : 'linear-gradient(135deg,#1a0a00,#3d1a00)',
                  color: submitting || rating === 0 ? '#9CA3AF' : '#fff',
                  fontSize: 14, fontWeight: 700, cursor: submitting || rating === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}>
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT — Review list */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ borderRadius: 16, height: 120,
                  background: 'linear-gradient(90deg,#F0F0F0 25%,#FAFAFA 50%,#F0F0F0 75%)',
                  backgroundSize: '200% 100%', animation: 'pcShimmer 1.4s infinite' }} />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 20, border: '1px solid #EBEBEB',
              padding: '48px 28px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>
                No reviews yet. Be the first to share your experience!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(r => (
                <div key={r.id} style={{
                  background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0',
                  padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Avatar initial */}
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#C9972B,#F5C842)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: '#1a0a00',
                      }}>
                        {(r.customer_name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                          {r.customer_name || 'Customer'}
                        </p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>
                          {new Date(r.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <StarRow rating={r.rating} size={14} />
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: 14, color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const GRADE_INFO = {
  w180: { label:'W180 — Largest',      color:'#7B3F00', desc:'~180 kernels/lb. Best for gifting.' },
  w210: { label:'W210 — Extra Large',  color:'#8B4513', desc:'~210 kernels/lb. Premium snacking.' },
  w240: { label:'W240 — Large',        color:'#A0522D', desc:'~240 kernels/lb. Great for snacking & cooking.' },
  w320: { label:'W320 — Medium',       color:'#C9972B', desc:'Most popular grade. All-round choice.' },
  w450: { label:'W450 — Small',        color:'#B8860B', desc:'~450 kernels/lb. Ideal for sweets.' },
};

function getGradeInfo(name = '') {
  const n = (name ?? '').toLowerCase();
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

  const [product,      setProduct]      = useState(null);
  const [related,      setRelated]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [qty,          setQty]          = useState(1);
  const [added,        setAdded]        = useState(false);
  const [zoomed,       setZoomed]       = useState(false);

  /* Variant state — populated when sibling variants are found */
  const [variants,     setVariants]     = useState([]);   // [{id, name, price, stock_quantity, unit, weight_label, image_url}]
  const [variantIdx,   setVariantIdx]   = useState(0);

  /* "active" is either the selected variant overlay or the base product */
  const active = variants.length > 1 ? { ...product, ...variants[variantIdx] } : product;

  useEffect(() => {
    setLoading(true); setError(null);
    setVariants([]); setVariantIdx(0); setQty(1);

    api.get(`/api/products/${id}`)
      .then(r => {
        const prod = r.data.data;
        setProduct(prod);

        /* ── Fetch all products to find sibling variants ─────── */
        api.get('/api/products', { params: { limit: 200 } })
          .then(pr => {
            const allProducts = pr.data.data || [];

            /* Use groupVariants to find if this product belongs to a group */
            const grouped = groupProductVariants(allProducts);
            const myGroup = grouped.find(g =>
              g.variants
                ? g.variants.some(v => v.id === Number(id))
                : g.id === Number(id)
            );

            if (myGroup?.variants && myGroup.variants.length > 1) {
              /* Sort by price ascending (smallest weight first) */
              const sorted = [...myGroup.variants].sort((a, b) => Number(a.price) - Number(b.price));
              setVariants(sorted);
              /* Pre-select the variant matching the current URL id */
              const currentIdx = sorted.findIndex(v => v.id === Number(id));
              setVariantIdx(currentIdx >= 0 ? currentIdx : 0);
              /* Set base product name to the group base name */
              setProduct(p => ({ ...p, name: myGroup.name }));
            }

            /* Related: other grouped products, excluding current group */
            const relatedGrouped = grouped
              .filter(g => {
                const gId = g.variants ? g.variants[0].id : g.id;
                const myId = myGroup?.variants ? myGroup.variants[0].id : Number(id);
                return gId !== myId;
              })
              .slice(0, 4);
            setRelated(relatedGrouped);
          })
          .catch(() => {});
      })
      .catch(err => setError(err.response?.data?.message || 'Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  /* Switch variant and update URL without full reload */
  const selectVariant = (idx) => {
    setVariantIdx(idx);
    setQty(1);
    setAdded(false);
    /* Update URL to the chosen variant's id so sharing/refresh works */
    navigate(`/home/product/${variants[idx].id}`, { replace: true });
  };

  const inCart     = active ? cartItems.find(i => i.id === active.id) : null;
  const outOfStock = active ? Number(active.stock_quantity) <= 0 : false;
  const visual     = active ? getProductVisual(active.name ?? product?.name ?? '', active.category_name ?? product?.category_name ?? '') : null;
  const gradeInfo  = product ? getGradeInfo(product.name) : null;

  /* ── Image resolution: DB image > variant image > visual fallback ── */
  const resolvedImage = active?.image_url || product?.image_url || null;

  const handleAdd = () => {
    if (!active || outOfStock) return;
    const cartItem = variants.length > 1
      ? {
          id:             active.id,
          name:           product.name,            /* base name e.g. "Roasted Cashew" */
          price:          active.price,
          image_url:      resolvedImage,
          unit:           active.unit || product?.unit,
          stock_quantity: active.stock_quantity,
          category_id:    product?.category_id,
          category_name:  product?.category_name,
          variant_label:  variants[variantIdx].weight_label,
        }
      : { ...product, image_url: resolvedImage };

    for (let i = 0; i < qty; i++) addToCart(cartItem);
    const label = variants.length > 1
      ? `"${product.name} · ${variants[variantIdx].weight_label}"`
      : `"${product?.name}"`;
    showToast(`${label} × ${qty} added to cart 🛒`, 'success');
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
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'14px clamp(16px,4vw,48px)',
          display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#9CA3AF',
          flexWrap:'wrap', overflowX:'hidden' }}>
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

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(24px,3vw,40px) clamp(16px,4vw,48px)' }}>
        <div className="product-detail-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:52, alignItems:'start' }}>

          {/* LEFT — Image */}
          <div>
            <div className="product-detail-image-wrap" onClick={() => resolvedImage && setZoomed(true)} style={{
              borderRadius:24, overflow:'hidden',
              background: resolvedImage ? '#F7F4EF' : visual.bg,
              height:420, display:'flex', alignItems:'center', justifyContent:'center',
              cursor: resolvedImage ? 'zoom-in' : 'default',
              border:'1px solid #EBEBEB', boxShadow:'0 4px 24px rgba(0,0,0,0.08)',
              position:'relative',
            }}>
              {resolvedImage ? (
                <>
                  <img
                    src={resolvedImage}
                    alt={product.name}
                    style={{ width:'100%', height:'100%', objectFit:'contain',
                      objectPosition:'center', padding:24 }}
                    onError={e => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = visual.localImage;
                    }}
                  />
                  <div style={{ position:'absolute', bottom:14, right:14,
                    background:'rgba(0,0,0,0.4)', color:'#fff',
                    fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>
                    🔍 Click to zoom
                  </div>
                </>
              ) : visual.localImage ? (
                <img
                  src={visual.localImage}
                  alt={product.name}
                  style={{ width:'100%', height:'100%', objectFit:'contain',
                    objectPosition:'center', padding:24 }}
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display='none'; }}
                />
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
            <div className="product-trust-badges" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:18 }}>
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

            {/* ── Variant selector ─────────────────────────────── */}
            {variants.length > 1 && (
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#4A4A4A',
                  textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:10 }}>
                  Select Weight
                </label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {variants.map((v, idx) => {
                    const vOos = Number(v.stock_quantity ?? 0) <= 0;
                    const isActive = idx === variantIdx;
                    return (
                      <button
                        key={v.id}
                        disabled={vOos}
                        onClick={() => selectVariant(idx)}
                        style={{
                          padding:'8px 20px',
                          borderRadius:30,
                          border: isActive ? '2px solid #1A1A1A' : '2px solid #E5E7EB',
                          background: isActive ? '#1A1A1A' : '#FAFAFA',
                          color: isActive ? '#fff' : vOos ? '#C0C0C0' : '#4A4A4A',
                          fontSize:13, fontWeight:700,
                          cursor: vOos ? 'not-allowed' : 'pointer',
                          transition:'all 0.15s',
                          opacity: vOos ? 0.4 : 1,
                          textDecoration: vOos ? 'line-through' : 'none',
                          fontFamily:"'DM Sans',sans-serif",
                        }}
                        title={vOos ? `${v.weight_label} — Out of Stock` : v.weight_label}
                      >
                        {v.weight_label}
                        {vOos && <span style={{ marginLeft:4, fontSize:10 }}>✗</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock — uses active (selected variant) */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                background: outOfStock ? '#EF4444' : '#22C55E',
                boxShadow:`0 0 0 3px ${outOfStock ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }} />
              <span style={{ fontSize:13, fontWeight:600, color: outOfStock ? '#EF4444' : '#15803D' }}>
                {outOfStock
                  ? 'Out of Stock'
                  : `In Stock — ${active.stock_quantity} ${active.unit || product.unit || 'kg'} available`}
              </span>
            </div>

            {/* Price — uses active (selected variant) */}
            <div style={{ background:'linear-gradient(135deg,#FDF8F3,#FAF0E0)',
              borderRadius:16, padding:'20px 22px', border:'1px solid #F0E8D0', marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                <span style={{ fontFamily:"'Playfair Display',serif",
                  fontSize:40, fontWeight:800, color:'#1A1A1A' }}>
                  ₹{Number(active.price).toFixed(0)}
                </span>
                <span style={{ fontSize:14, color:'#9CA3AF', fontWeight:500 }}>
                  per {active.unit || product.unit || 'kg'}
                </span>
              </div>
              {!outOfStock && Number(active.stock_quantity) <= 10 && (
                <p style={{ fontSize:12, color:'#F59E0B', fontWeight:700, marginTop:8 }}>
                  ⚠ Only {active.stock_quantity} {active.unit || product.unit || 'kg'} left — order soon!
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

            {/* Qty + Add to Cart — uses active price/stock */}
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
                    <button onClick={() => setQty(q => Math.min(Number(active.stock_quantity), q+1))}
                      style={{ width:40, height:44, background:'#F9FAFB', border:'none',
                        fontSize:18, cursor:'pointer', color:'#1A1A1A', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#F0F0F0'}
                      onMouseLeave={e => e.currentTarget.style.background='#F9FAFB'}>+</button>
                  </div>
                  <span style={{ fontSize:13, color:'#9CA3AF' }}>
                    × ₹{Number(active.price).toFixed(0)} = {' '}
                    <strong style={{ color:'#1A1A1A' }}>₹{(qty * Number(active.price)).toFixed(0)}</strong>
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
        <ReviewSection productId={active?.id || product.id} />

        {/* Related products — use ProductCard for consistent image + variant handling */}
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
            {/* Use the shared ProductCard so image fallback, variants and cart all work */}
            <div className="pc-grid">
              {related.map(p => (
                <ProductCard key={p.id} product={p} onView={null} />
              ))}
            </div>
          </div>
        )}
      </div>

      {zoomed && resolvedImage && (
        <ImageZoom src={resolvedImage} alt={product.name} onClose={() => setZoomed(false)} />
      )}
    </div>
  );
}
