import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

/* ── Same visual helper as ShopPage ────────────────────────── */
function getVisual(name = '') {
  const n = name.toLowerCase();
  if (n.includes('w180')) return { bg:'linear-gradient(135deg,#7B3F00,#C68642)', emoji:'🥇', tag:'Premium' };
  if (n.includes('w210')) return { bg:'linear-gradient(135deg,#8B4513,#D2691E)', emoji:'⭐', tag:'Large' };
  if (n.includes('w240')) return { bg:'linear-gradient(135deg,#A0522D,#DEB887)', emoji:'✨', tag:'Medium-Large' };
  if (n.includes('w320')) return { bg:'linear-gradient(135deg,#C9972B,#F5C842)', emoji:'🏆', tag:'Best Seller' };
  if (n.includes('w450')) return { bg:'linear-gradient(135deg,#B8860B,#DAA520)', emoji:'💛', tag:'Value' };
  if (n.includes('roasted') && n.includes('salt')) return { bg:'linear-gradient(135deg,#8B0000,#CD5C5C)', emoji:'🔥', tag:'Salted' };
  if (n.includes('roasted')) return { bg:'linear-gradient(135deg,#5C3317,#A0522D)', emoji:'🍂', tag:'Roasted' };
  if (n.includes('masala')) return { bg:'linear-gradient(135deg,#8B2500,#E25822)', emoji:'🌶️', tag:'Spicy' };
  if (n.includes('pepper')) return { bg:'linear-gradient(135deg,#2C2C2C,#696969)', emoji:'🖤', tag:'Pepper' };
  if (n.includes('broken')) return { bg:'linear-gradient(135deg,#6B6B3A,#B8B860)', emoji:'💎', tag:'Broken' };
  return { bg:'linear-gradient(135deg,#C9972B,#F5C842)', emoji:'🥜', tag:'Cashew' };
}

const SLIDES = [
  {
    image: '/assets/pexels-hatdieubaokhanh-com-2155729267-34449058.jpg',
    tag: 'Fresh from Panruti',
    title: 'Good Quality',
    titleHighlight: 'Cashews',
    titleEnd: 'Direct to You',
    subtitle: "We grow and process cashews in Panruti. W180 to W450 grades, roasted and flavoured — all available.",
  },
  {
    image: '/assets/pexels-nandamends-30878379.jpg',
    tag: 'No Preservatives',
    title: 'Clean &',
    titleHighlight: 'Natural',
    titleEnd: 'Cashews',
    subtitle: 'No chemicals, no artificial colour. Just cashews — cleaned, graded and packed fresh.',
  },
  {
    image: '/assets/pexels-cottonbro-9811624.jpg',
    tag: 'Airtight Packed',
    title: 'Stays Fresh',
    titleHighlight: 'Longer',
    titleEnd: 'Every Time',
    subtitle: 'We pack tightly to keep cashews fresh. Orders above ₹499 get free delivery.',
  },
  {
    image: '/assets/pexels-shuvalova-natalia-415991090-18876240.jpg',
    tag: 'Roasted & Flavoured',
    title: 'Masala, Pepper',
    titleHighlight: '& More',
    titleEnd: 'Varieties',
    subtitle: 'Salted, masala, pepper cashews — made with simple spices, no artificial taste.',
  },
];

const FEATURES = [
  { icon: '🌿', title: 'From Our Farms',    desc: 'Grown in Panruti, Tamil Nadu — direct from us to you' },
  { icon: '✅', title: 'No Chemicals',       desc: 'No preservatives, no artificial colour or flavour' },
  { icon: '🚚', title: 'Quick Delivery',     desc: 'Usually delivered within 3–5 days across India' },
  { icon: '💎', title: 'All Grades',         desc: 'W180, W240, W320, W450 — pick what suits you' },
];

const WHY_US = [
  {
    icon: '🌱',
    title: 'We Grow It Here',
    desc: 'Our cashews come from Panruti farms. No middlemen — straight from us to your door.',
  },
  {
    icon: '🔍',
    title: 'Checked Before Packing',
    desc: 'Every batch is checked for moisture, colour, size and taste before we pack it.',
  },
  {
    icon: '📦',
    title: 'Packed to Stay Fresh',
    desc: 'Airtight packing keeps cashews fresh. No stale cashews, guaranteed.',
  },
  {
    icon: '🚚',
    title: 'Delivered Anywhere',
    desc: 'We deliver across India. Free shipping on orders above ₹499.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/api/products', { params: { limit: 8 } })
      .then(r => setProducts(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [current]);

  const goTo = (idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 400);
  };

  const slide = SLIDES[current];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fff' }}>

      {/* ══════════════════════════════════════
          HERO SLIDESHOW
         ══════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '55vh', overflow: 'hidden', background: '#1a0a00' }}>

        {/* BG images */}
        {SLIDES.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${s.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === current ? (animating ? 0 : 1) : 0,
            transition: 'opacity 0.65s ease', zIndex: 0,
          }} />
        ))}

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.1) 100%)',
        }} />

        {/* Text content */}
        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: 1200, margin: '0 auto', padding: 'clamp(32px,6vw,56px) clamp(16px,4vw,56px)',
          minHeight: '55vh', display: 'flex', alignItems: 'center',
        }}>
          <div style={{
            maxWidth: 560, width: '100%',
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(16px)' : 'translateY(0)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.5)',
              color: '#FFFFFF', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 2,
              padding: '6px 18px', borderRadius: 30, marginBottom: 20,
              backdropFilter: 'blur(4px)',
            }}>
              {slide.tag}
            </div>

            {/* Heading */}
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(30px, 6vw, 62px)',
              fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 16,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>
              {slide.title}<br />
              <span style={{ fontStyle: 'italic' }}>{slide.titleHighlight}</span><br />
              {slide.titleEnd}
            </h1>

            <p style={{
              fontSize: 'clamp(13px, 2vw, 16px)',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.8, marginBottom: 28, maxWidth: 460,
              textShadow: '0 1px 6px rgba(0,0,0,0.5)',
            }}>
              {slide.subtitle}
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/home/shop')} style={{
                background: 'linear-gradient(135deg,#C9972B,#F5C842)',
                color: '#1a0a00', border: 'none', borderRadius: 30,
                padding: '14px 28px', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(201,151,43,0.4)',
                whiteSpace: 'nowrap',
              }}>
                Shop Now →
              </button>
              <button onClick={() => navigate('/home/processing')} style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 30,
                padding: '13px 24px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', backdropFilter: 'blur(4px)',
                whiteSpace: 'nowrap',
              }}>
                Our Process
              </button>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 10, zIndex: 3,
        }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === current ? 28 : 10, height: 10,
              borderRadius: 5, border: 'none', padding: 0, cursor: 'pointer',
              background: i === current ? '#F5C842' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Arrows */}
        {[
          { side: 'left',  pos: 20,  icon: '‹', fn: () => goTo((current - 1 + SLIDES.length) % SLIDES.length) },
          { side: 'right', pos: 20,  icon: '›', fn: () => goTo((current + 1) % SLIDES.length) },
        ].map(btn => (
          <button key={btn.side} onClick={btn.fn} style={{
            position: 'absolute', [btn.side]: btn.pos, top: '50%', transform: 'translateY(-50%)',
            zIndex: 3, background: 'rgba(255,255,255,0.15)',
            border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff',
            width: 46, height: 46, borderRadius: '50%', fontSize: 22,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,151,43,0.5)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >{btn.icon}</button>
        ))}

        {/* Counter */}
        <div style={{
          position: 'absolute', bottom: 36, right: 48, zIndex: 3,
          color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: 1,
        }}>
          {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES TICKER — running scroll
         ══════════════════════════════════════ */}
      <section style={{ background: '#1a0a00', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 0', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', gap: 0,
          animation: 'tickerScroll 18s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          {/* Duplicate items for seamless loop */}
          {[...Array(3)].map((_, repeat) => (
            <div key={repeat} style={{ display: 'flex', gap: 0, flexShrink: 0 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '0 40px',
                  borderRight: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>{f.title}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>— {f.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <style>{`
          @keyframes tickerScroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
        `}</style>
      </section>

      {/* ══════════════════════════════════════
          PRODUCTS PREVIEW — from DB
         ══════════════════════════════════════ */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972B',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>🌰 Our Collection</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 38,
              fontWeight: 800, color: '#1A1A1A', marginBottom: 12 }}>
              Premium Cashew Varieties
            </h2>
            <p style={{ fontSize: 15, color: '#9CA3AF', maxWidth: 480, margin: '0 auto' }}>
              All grades freshly packed and delivered. Browse our full collection in the shop.
            </p>
          </div>

          {/* Products from DB — same visual as ShopPage */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
            {products.slice(0, 8).map(product => {
              const visual = getVisual(product.name);
              const outOfStock = Number(product.stock_quantity) <= 0;
              return (
                <div key={product.id}
                  style={{
                    borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                    border: '1px solid #F0F0F0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.25s', background: '#fff',
                    display: 'flex', flexDirection: 'column',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; }}
                >
                  {/* Same visual as ShopPage */}
                  <div style={{ position: 'relative', height: 180 }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', background: visual.bg,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <span style={{ fontSize: 52, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}>{visual.emoji}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
                          textTransform: 'uppercase', letterSpacing: 1.5,
                          background: 'rgba(0,0,0,0.2)', padding: '2px 10px', borderRadius: 20 }}>
                          {visual.tag}
                        </span>
                      </div>
                    )}
                    {outOfStock && (
                      <div style={{ position: 'absolute', top: 10, right: 10,
                        background: 'rgba(0,0,0,0.55)', color: '#fff',
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                        Out of Stock
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {product.category_name && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#C9972B',
                        textTransform: 'uppercase', letterSpacing: 1.2 }}>{product.category_name}</span>
                    )}
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14,
                      fontWeight: 700, color: '#1A1A1A', lineHeight: 1.35, margin: '2px 0 0',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4,
                      marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #F5F5F5' }}>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18,
                        fontWeight: 700, color: '#1A1A1A' }}>₹{Number(product.price).toFixed(0)}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>/ {product.unit || 'kg'}</span>
                    </div>
                  </div>
                  {/* Add to cart */}
                  <div style={{ padding: '0 16px 16px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); if (!outOfStock) { addToCart(product); navigate('/home/shop'); } }}
                      disabled={outOfStock}
                      style={{
                        width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                        background: outOfStock ? '#E5E5E5' : '#1A1A1A',
                        color: outOfStock ? '#9CA3AF' : '#fff',
                        fontSize: 13, fontWeight: 700,
                        cursor: outOfStock ? 'not-allowed' : 'pointer',
                      }}>
                      {outOfStock ? '✗ Out of Stock' : '🛒 Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => navigate('/home/shop')} style={{
              background: 'none', border: '2px solid #1A1A1A', color: '#1A1A1A',
              borderRadius: 30, padding: '13px 36px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              Browse All Products →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          WHY CHOOSE US — real facts only
         ══════════════════════════════════════ */}
      <section style={{ background: '#FDF8F3', padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972B',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Why H²B³ Cashew</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 38,
              fontWeight: 800, color: '#1A1A1A' }}>
              What Makes Us Different
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
            {WHY_US.map(w => (
              <div key={w.title} style={{
                background: '#fff', borderRadius: 20, padding: 28,
                border: '1px solid #EBEBEB', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'all 0.25s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
              >
                <div style={{ fontSize: 36, marginBottom: 14 }}>{w.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>{w.title}</h3>
                <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.75 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PROCESS TEASER
         ══════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg,#1A3028,#2C4A3E)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F0CA6D',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>🏭 How We Work</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36,
            fontWeight: 800, color: '#fff', marginBottom: 14 }}>
            From Farm to Your Table
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)',
            maxWidth: 480, margin: '0 auto 44px' }}>
            Every cashew goes through a careful 6-step process before reaching you.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 44 }}>
            {['🌱 Harvest','🏭 Shell','🔥 Dry','✋ Peel','🔍 Grade','📦 Pack'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 14, padding: '14px 20px', color: '#fff',
                  fontSize: 13, fontWeight: 600, backdropFilter: 'blur(4px)',
                }}>
                  {step}
                </div>
                {i < 5 && <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16, padding: '0 6px' }}>→</div>}
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/home/processing')} style={{
            background: 'linear-gradient(135deg,#C9972B,#F5C842)', color: '#1a0a00',
            border: 'none', borderRadius: 30, padding: '14px 32px',
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
          }}>
            See Full Process →
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA
         ══════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg,#C9972B,#F5C842)',
        padding: '64px 48px', textAlign: 'center',
      }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34,
          fontWeight: 800, color: '#1a0a00', marginBottom: 12 }}>
          Ready to Order?
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(26,10,0,0.65)', marginBottom: 32 }}>
          Fresh batch available now. Free delivery on orders above ₹499.
        </p>
        <button onClick={() => navigate('/home/shop')} style={{
          background: '#1a0a00', color: '#F5C842', border: 'none',
          borderRadius: 30, padding: '16px 40px', fontSize: 15,
          fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          Shop Now →
        </button>
      </section>

    </div>
  );
}
