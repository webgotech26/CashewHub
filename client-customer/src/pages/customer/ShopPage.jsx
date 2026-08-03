import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { getProductVisual } from '../../utils/productVisual';
import ProductCard from '../../Components/ProductCard';

/* ── Quick View Modal ─────────────────────────────────────────── */
function QuickView({ product, onClose }) {
  const { addToCart } = useCart();
  const visual = getProductVisual(product?.name ?? '', product?.category_name ?? '');
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const imgSrc = product.image_url || visual.localImage || null;
  const price  = Number(product.price ?? 0);
  const stock  = Number(product.stock_quantity ?? 0);

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 1200);
  };

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      zIndex:500, display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, backdropFilter:'blur(6px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#fff', borderRadius:24, width:'100%', maxWidth:560,
        overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.25)',
        maxHeight:'88vh', display:'flex', flexDirection:'column',
      }}>
        {/* Image */}
        <div style={{ height:260, background: imgSrc ? '#FAFAFA' : visual.bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          position:'relative', flexShrink:0 }}>
          {imgSrc
            ? <img src={imgSrc} alt={product.name ?? 'Product'} style={{ height:'100%', width:'100%', objectFit:'contain', padding:20 }} />
            : <span style={{ fontSize:90, filter:'drop-shadow(0 8px 20px rgba(0,0,0,0.3))' }}>{visual.emoji}</span>
          }
          <button onClick={onClose} style={{
            position:'absolute', top:14, right:14, background:'rgba(0,0,0,0.35)',
            color:'#fff', border:'none', borderRadius:'50%', width:34, height:34,
            fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          }}>×</button>
        </div>

        {/* Content */}
        <div style={{ padding:'24px 28px', overflowY:'auto' }}>
          {product.category_name && (
            <span style={{ fontSize:10, fontWeight:700, color:'#C9972B',
              textTransform:'uppercase', letterSpacing:1.5 }}>{product.category_name}</span>
          )}
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24,
            fontWeight:800, color:'#1A1A1A', margin:'8px 0 12px' }}>{product.name ?? 'Product'}</h2>
          {product.description && (
            <p style={{ fontSize:14, color:'#6B6B6B', lineHeight:1.8, marginBottom:18 }}>{product.description}</p>
          )}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            background:'#FAFAFA', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28,
                fontWeight:800, color:'#1A1A1A' }}>₹{price.toFixed(0)}</div>
              <div style={{ fontSize:11, color:'#9CA3AF' }}>per {product.unit || 'kg'}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:700,
                color: stock > 0 ? '#16a34a' : '#DC2626' }}>
                {stock > 0 ? '✓ In Stock' : '✗ Out of Stock'}
              </div>
              {stock > 0 && (
                <div style={{ fontSize:11, color:'#9CA3AF' }}>{product.stock_quantity} {product.unit || 'kg'} available</div>
              )}
            </div>
          </div>

          <button onClick={handleAdd} disabled={stock <= 0} style={{
            width:'100%', padding:15, background: added ? '#16a34a' : '#1A1A1A',
            color:'#fff', border:'none', borderRadius:12, fontSize:15,
            fontWeight:700, cursor: stock <= 0 ? 'not-allowed' : 'pointer',
            transition:'background 0.2s',
          }}>
            {stock <= 0 ? 'Out of Stock' : added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Shop Page ───────────────────────────────────────────── */
export default function ShopPage() {
  const location = useLocation();
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy]         = useState('default');
  const [viewProduct, setViewProduct] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    Promise.all([
      api.get('/api/products', { params:{ limit:100 } }),
      api.get('/api/categories'),
    ])
      .then(([pRes, cRes]) => {
        setProducts(pRes.data.data || []);
        const cats = (cRes.data.data || []).filter(c => c.id && c.name);
        setCategories(cats);

        // Pre-select category from ?category=oils URL param
        const params  = new URLSearchParams(location.search);
        const catParam = (params.get('category') || '').toLowerCase().trim();
        if (catParam) {
          const matched = cats.find(c =>
            c.name.toLowerCase().includes(catParam) ||
            catParam.includes(c.name.toLowerCase())
          );
          if (matched) setActiveCategory(String(matched.id));
        }
      })
      .catch(err => {
        if (!err.response) setError('Cannot reach the server. Please check if backend is running.');
        else setError(`Error: ${err.response?.data?.message || 'Something went wrong'}`);
      })
      .finally(() => setLoading(false));
  }, [location.search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = (Array.isArray(products) ? products : [])
    .filter(p => {
      if (!p) return false;
      const ms = (p.name ?? '').toLowerCase().includes(search.toLowerCase());
      const mc = activeCategory === 'all' || String(p.category_id) === String(activeCategory);
      return ms && mc;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return Number(a.price ?? 0) - Number(b.price ?? 0);
      if (sortBy === 'price-desc') return Number(b.price ?? 0) - Number(a.price ?? 0);
      if (sortBy === 'name-asc')   return (a.name ?? '').localeCompare(b.name ?? '');
      if (sortBy === 'stock')      return Number(b.stock_quantity ?? 0) - Number(a.stock_quantity ?? 0);
      return 0;
    });

  return (
    <div style={{ background:'#FAFAFA', minHeight:'100vh' }}>

      {/* ── Shop Hero ──────────────────────────────────── */}
      <section style={{
        position:'relative', overflow:'hidden',
        padding:'72px clamp(16px,4vw,56px) 64px',
        background:'#FDFBF7',
        borderBottom:'1px solid rgba(201,151,43,0.12)',
      }}>
        {/* Radial amber glow — top centre */}
        <div style={{
          position:'absolute', top:'-80px', left:'50%', transform:'translateX(-50%)',
          width:'70%', maxWidth:700, height:360,
          background:'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.18) 0%, rgba(253,230,138,0.08) 40%, transparent 70%)',
          pointerEvents:'none',
        }} />
        {/* Warm bottom fade */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(253,251,247,0.6) 100%)',
          pointerEvents:'none',
        }} />
        <div style={{ maxWidth:1200, margin:'0 auto', position:'relative', zIndex:1, width:'100%' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#C9972B', textTransform:'uppercase',
            letterSpacing:2.5, marginBottom:14 }}>Our Collection</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(28px, 5vw, 52px)', fontWeight:800,
            color:'#1C1917', marginBottom:16, lineHeight:1.1 }}>
            Premium<br />Natural Shop
          </h1>
          <p style={{ fontSize:'clamp(13px, 2vw, 16px)', color:'#78716C', marginBottom:36, maxWidth:460,
            lineHeight:1.8 }}>
            Cashews, wood-pressed oils, homemade brownies — all natural, freshly packed.
          </p>

          {/* Search */}
          <div style={{ display:'flex', gap:12, maxWidth:520 }}>
            <div style={{ flex:1, position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                color:'#A8A29E', fontSize:16 }}>🔍</span>
              <input
                type="text" placeholder="Search products..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width:'100%', padding:'12px 16px 12px 42px', borderRadius:30,
                  border:'1.5px solid #E7E2D9', fontSize:14, outline:'none',
                  background:'#fff', color:'#1C1917',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                  transition:'border-color 0.2s, box-shadow 0.2s' }}
                onFocus={e => { e.target.style.borderColor='#C9972B'; e.target.style.boxShadow='0 0 0 3px rgba(201,151,43,0.12)'; }}
                onBlur={e => { e.target.style.borderColor='#E7E2D9'; e.target.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'; }}
              />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              padding:'12px 18px', borderRadius:30, border:'1.5px solid #E7E2D9',
              fontSize:13, fontWeight:600,
              background:'#fff', color:'#44403C', cursor:'pointer', outline:'none',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name-asc">Name: A–Z</option>
              <option value="stock">In Stock First</option>
            </select>
          </div>
        </div>
      </section>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px clamp(16px,4vw,48px)' }}>

        {/* ── Category Filter ─────────────────────────── */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:32 }}>
          <button onClick={() => setActiveCategory('all')} style={{
            padding:'9px 20px', borderRadius:30, fontSize:13, fontWeight:700,
            border: activeCategory === 'all' ? '2px solid #1A1A1A' : '2px solid #EBEBEB',
            background: activeCategory === 'all' ? '#1A1A1A' : '#fff',
            color: activeCategory === 'all' ? '#fff' : '#4A4A4A',
            cursor:'pointer', transition:'all 0.18s',
          }}>
            All ({products.length})
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(String(cat.id))} style={{
              padding:'9px 20px', borderRadius:30, fontSize:13, fontWeight:700,
              border: activeCategory === String(cat.id) ? '2px solid #C9972B' : '2px solid #EBEBEB',
              background: activeCategory === String(cat.id) ? '#C9972B' : '#fff',
              color: activeCategory === String(cat.id) ? '#fff' : '#4A4A4A',
              cursor:'pointer', transition:'all 0.18s',
            }}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Results count ──────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <p style={{ fontSize:14, color:'#9CA3AF' }}>
            {loading ? 'Loading...' : `Showing ${filtered.length} products`}
          </p>
        </div>

        {/* ── Error ──────────────────────────────────── */}
        {error && (
          <div style={{ background:'#FEF2F2', color:'#B91C1C', border:'1px solid #FECACA',
            borderRadius:12, padding:'16px 20px', marginBottom:24,
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>❌ {error}</span>
            <button onClick={fetchData} style={{ background:'#B91C1C', color:'#fff',
              border:'none', borderRadius:8, padding:'8px 16px', cursor:'pointer',
              fontSize:13, fontWeight:700 }}>Retry</button>
          </div>
        )}

        {/* ── Loading Skeleton ───────────────────────── */}
        {loading && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ borderRadius:20, overflow:'hidden', background:'#fff',
                border:'1px solid #F0F0F0' }}>
                <div style={{ height:200, background:'linear-gradient(90deg,#F0F0F0 25%,#FAFAFA 50%,#F0F0F0 75%)',
                  backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
                <div style={{ padding:18, display:'flex', flexDirection:'column', gap:8 }}>
                  {[40,80,60,50].map((w,j) => (
                    <div key={j} style={{ height:j===1?14:10, width:`${w}%`, borderRadius:4, background:'#F0F0F0' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Product Grid ───────────────────────────── */}
        {!loading && filtered.length === 0 && !error && (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ fontSize:60, marginBottom:16 }}>🔍</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:'#4A4A4A', marginBottom:8 }}>
              No products found
            </h3>
            <p style={{ color:'#9CA3AF' }}>Try a different search or category.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24 }}>
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onView={setViewProduct} />
            ))}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {viewProduct && <QuickView product={viewProduct} onClose={() => setViewProduct(null)} />}

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  );
}
