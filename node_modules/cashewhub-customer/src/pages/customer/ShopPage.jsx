import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { getProductVisual } from '../../utils/productVisual';
import ProductCard from '../../Components/ProductCard';

/* ── Quick View Modal ─────────────────────────────────────────── */
function QuickView({ product, onClose }) {
  const { addToCart } = useCart();
  const visual = getProductVisual(product.name);
  const [added, setAdded] = useState(false);

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
        <div style={{ height:260, background: product.image_url ? '#FAFAFA' : visual.bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          position:'relative', flexShrink:0 }}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} style={{ height:'100%', width:'100%', objectFit:'contain', padding:20 }} />
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
            fontWeight:800, color:'#1A1A1A', margin:'8px 0 12px' }}>{product.name}</h2>
          {product.description && (
            <p style={{ fontSize:14, color:'#6B6B6B', lineHeight:1.8, marginBottom:18 }}>{product.description}</p>
          )}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            background:'#FAFAFA', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28,
                fontWeight:800, color:'#1A1A1A' }}>₹{Number(product.price).toFixed(0)}</div>
              <div style={{ fontSize:11, color:'#9CA3AF' }}>per {product.unit || 'kg'}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:700,
                color: Number(product.stock_quantity) > 0 ? '#16a34a' : '#DC2626' }}>
                {Number(product.stock_quantity) > 0 ? '✓ In Stock' : '✗ Out of Stock'}
              </div>
              {Number(product.stock_quantity) > 0 && (
                <div style={{ fontSize:11, color:'#9CA3AF' }}>{product.stock_quantity} {product.unit || 'kg'} available</div>
              )}
            </div>
          </div>

          <button onClick={handleAdd} disabled={Number(product.stock_quantity) <= 0} style={{
            width:'100%', padding:15, background: added ? '#16a34a' : '#1A1A1A',
            color:'#fff', border:'none', borderRadius:12, fontSize:15,
            fontWeight:700, cursor: Number(product.stock_quantity) <= 0 ? 'not-allowed' : 'pointer',
            transition:'background 0.2s',
          }}>
            {Number(product.stock_quantity) <= 0 ? 'Out of Stock' : added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Shop Page ───────────────────────────────────────────── */
export default function ShopPage() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy]       = useState('default');
  const [viewProduct, setViewProduct] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    Promise.all([
      api.get('/api/products', { params:{ limit:100 } }),
      api.get('/api/categories'),
    ])
      .then(([pRes, cRes]) => {
        setProducts(pRes.data.data || []);
        setCategories((cRes.data.data || []).filter(c => c.id && c.name));
      })
      .catch(err => {
        if (!err.response) setError('Cannot reach the server. Please check if backend is running.');
        else setError(`Error: ${err.response?.data?.message || 'Something went wrong'}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = products
    .filter(p => {
      const ms = p.name.toLowerCase().includes(search.toLowerCase());
      const mc = activeCategory === 'all' || String(p.category_id) === String(activeCategory);
      return ms && mc;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return Number(a.price) - Number(b.price);
      if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
      if (sortBy === 'name-asc')   return a.name.localeCompare(b.name);
      if (sortBy === 'stock')      return Number(b.stock_quantity) - Number(a.stock_quantity);
      return 0;
    });

  return (
    <div style={{ background:'#FAFAFA', minHeight:'100vh' }}>

      {/* ── Shop Hero ──────────────────────────────────── */}
      <section style={{
        position:'relative', overflow:'hidden',
        minHeight:'70vh', display:'flex', alignItems:'center',
      }}>
        {/* BG Image */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'url(/assets/pexels-valeriya-21558697.jpg)',
          backgroundSize:'cover', backgroundPosition:'center', zIndex:0,
        }} />
        {/* Overlay */}
        <div style={{
          position:'absolute', inset:0, zIndex:1,
          background:'linear-gradient(90deg,rgba(10,4,0,0.88) 0%,rgba(10,4,0,0.6) 60%,rgba(10,4,0,0.2) 100%)',
        }} />
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 clamp(16px, 4vw, 56px)', position:'relative', zIndex:2, width:'100%' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase',
            letterSpacing:2, marginBottom:14 }}>Our Collection</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(28px, 5vw, 58px)', fontWeight:800,
            color:'#fff', marginBottom:16, lineHeight:1.1,
            textShadow:'0 2px 20px rgba(0,0,0,0.4)' }}>
            Premium<br />Cashew Shop
          </h1>
          <p style={{ fontSize:'clamp(13px, 2vw, 16px)', color:'rgba(255,255,255,0.85)', marginBottom:32, maxWidth:460,
            lineHeight:1.8 }}>
            All grades, all varieties — freshly packed and delivered to you.
          </p>

          {/* Search */}
          <div style={{ display:'flex', gap:12, maxWidth:520 }}>
            <div style={{ flex:1, position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                color:'#9CA3AF', fontSize:16 }}>🔍</span>
              <input
                type="text" placeholder="Search cashews..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width:'100%', padding:'12px 16px 12px 42px', borderRadius:30,
                  border:'none', fontSize:14, outline:'none',
                  background:'rgba(255,255,255,0.12)', color:'#fff',
                  backdropFilter:'blur(4px)' }}
              />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              padding:'12px 16px', borderRadius:30, border:'none', fontSize:13, fontWeight:600,
              background:'rgba(255,255,255,0.12)', color:'#fff', cursor:'pointer', outline:'none',
              backdropFilter:'blur(4px)',
            }}>
              <option value="default" style={{ color:'#000' }}>Sort: Default</option>
              <option value="price-asc" style={{ color:'#000' }}>Price: Low → High</option>
              <option value="price-desc" style={{ color:'#000' }}>Price: High → Low</option>
              <option value="name-asc" style={{ color:'#000' }}>Name: A–Z</option>
              <option value="stock" style={{ color:'#000' }}>In Stock First</option>
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
