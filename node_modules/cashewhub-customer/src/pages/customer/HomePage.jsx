import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../Components/ProductCard';
import BannerSlider from '../../Components/BannerSlider';

const SLIDES = [
  {
    image: '/assets/slide1.png',
    tag: 'PREMIUM QUALITY CASHEWS',
    title: 'Every Cashew,',
    titleHighlight: 'A Taste of Excellence',
    titleEnd: '',
    subtitle: 'Discover premium-quality cashews that are carefully selected, naturally delicious, and packed to preserve freshness and crunch in every bite.',
    btn1Text: 'Shop Now →',
    btn1Path: '/home/shop',
    btn2Text: 'Explore Collection',
    btn2Path: '/home/shop',
  },
  {
    image: '/assets/slide2.png',
    tag: 'ROASTED & FLAVOURED',
    title: 'Masala, Pepper',
    titleHighlight: '& More Varieties',
    titleEnd: '',
    subtitle: 'From classic salted to spicy masala and bold pepper, enjoy a range of irresistible flavours crafted for every taste.',
    btn1Text: 'Shop Now →',
    btn1Path: '/home/shop',
    btn2Text: 'View Flavours',
    btn2Path: '/home/shop',
  },
  {
    image: '/assets/slide3.png',
    tag: 'QUALITY YOU CAN TRUST',
    title: 'Quality in Every',
    titleHighlight: 'Handpicked Batch',
    titleEnd: '',
    subtitle: 'We carefully select every batch, maintain high hygiene standards, and pack every order with care so you receive the finest cashews every time.',
    btn1Text: 'Our Process',
    btn1Path: '/home/processing',
    btn2Text: 'Learn More',
    btn2Path: '/home/processing',
  },
  {
    image: '/assets/slide4.png',
    tag: 'HEALTHY SNACKING',
    title: 'Healthy Bites,',
    titleHighlight: 'Happy Moments',
    titleEnd: '',
    subtitle: 'Rich in protein, healthy fats, vitamins, and minerals, our premium cashews are the perfect snack for work, travel, fitness, and family time.',
    btn1Text: 'Shop Now →',
    btn1Path: '/home/shop',
    btn2Text: 'Know Benefits',
    btn2Path: '/home/shop',
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
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [products, setProducts] = useState([]);

  // Debug: log slide images on mount
  useEffect(() => {
    console.log('[HomePage] SLIDES images:', SLIDES.map(s => s.image));
    
    // Preload slide images and log errors
    SLIDES.forEach((slide, idx) => {
      const img = new Image();
      img.onload = () => console.log(`[HomePage] ✓ Slide ${idx + 1} loaded:`, slide.image);
      img.onerror = () => console.error(`[HomePage] ✗ Slide ${idx + 1} FAILED:`, slide.image);
      img.src = slide.image;
    });
  }, []);

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
          }} 
          onError={(e) => console.error('[HomePage] Background image error for slide', i, s.image)}
          />
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
              <button onClick={() => navigate(slide.btn1Path)} style={{
                background: 'linear-gradient(135deg,#C9972B,#F5C842)',
                color: '#1a0a00', border: 'none', borderRadius: 30,
                padding: '14px 28px', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(201,151,43,0.4)',
                whiteSpace: 'nowrap',
              }}>
                {slide.btn1Text}
              </button>
              <button onClick={() => navigate(slide.btn2Path)} style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 30,
                padding: '13px 24px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', backdropFilter: 'blur(4px)',
                whiteSpace: 'nowrap',
              }}>
                {slide.btn2Text}
              </button>
            </div>
          </div>
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
          PROMOTIONAL BANNERS — from DB (active only)
         ══════════════════════════════════════ */}
      <BannerSlider />

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

          {/* Products from DB — shared ProductCard component (same as ShopPage) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
            {products.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} onView={null} />
            ))}
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
