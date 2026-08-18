import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { groupProductVariants } from '../../utils/groupVariants';
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
    image: '/assets/homeslide1.png', // Unga public/assets/ la irukra gingelly image filename
    tag: 'WOOD PRESSED OILS',
    title: 'Pure Tradition in',
    titleHighlight: 'Every Drop of Gingelly Oil',
    titleEnd: '',
    subtitle: 'Extracted using traditional wood-pressed methods from the finest sesame seeds, retaining natural nutrients, rich aroma, and authentic taste.',
    btn1Text: 'Shop Now →',
    btn1Path: '/home/shop',
    btn2Text: 'View Oils',
    btn2Path: '/home/shop?category=oils',
  },
  {
    image: '/assets/homeslide2.png', // Unga public/assets/ la irukra groundnut image filename
    tag: '100% NATURAL OILS',
    title: 'Golden Richness of',
    titleHighlight: 'Cold Pressed Groundnut Oil',
    titleEnd: '',
    subtitle: 'Naturally extracted pure groundnut oil packed with essential fatty acids and nutrients for your everyday healthy cooking.',
    btn1Text: 'Shop Now →',
    btn1Path: '/home/shop',
    btn2Text: 'Explore Benefits',
    btn2Path: '/home/shop?category=oils',
  },
  {
    image: '/assets/homeslide3.png', // Unga public/assets/ la irukra brownie image filename
    tag: 'HEALTHY SNACKING',
    title: 'Indulgent Brownies,',
    titleHighlight: 'Happy Moments',
    titleEnd: '',
    subtitle: 'Rich in flavor, crafted with premium natural ingredients and pure love to satisfy your sweet cravings guilt-free.',
    btn1Text: 'Shop Now →',
    btn1Path: '/home/shop',
    btn2Text: 'View Flavours',
    btn2Path: '/home/shop?category=brownies',
  },
];
const FEATURES = [
  { icon: '🌿', title: 'From Our Farms',    desc: 'Grown in India — direct from us to you' },
  { icon: '✅', title: 'No Chemicals',       desc: 'No preservatives, no artificial colour or flavour' },
  { icon: '🚚', title: 'Quick Delivery',     desc: 'Usually delivered within 3–5 days across India' },
  { icon: '🛒', title: 'Pure Products',      desc: 'Cashews, wood-pressed oils & homemade brownies' },
];

const WHY_US = [
  {
    icon: '🌱',
    title: 'Direct from Our Farms',
    desc: 'Harvested with care from our fertile local soil. 100% natural, farm-fresh, and delivered straight to your door without middlemen.',
  },
  {
    icon: '🔍',
    title: 'Checked Before Packing',
    desc: 'Every batch is checked for moisture, colour, size and taste before we pack it.',
  },
  {
    icon: '📦',
    title: 'Packed to Stay Fresh',
    desc: 'Airtight packing keeps our products fresh. No stale nuts, guaranteed.',
  },
  {
    icon: '🚚',
    title: 'Delivered Anywhere',
    desc: 'We deliver across India. Free shipping on orders above ₹2000.',
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
    /* Fetch enough products so groupProductVariants has all sibling variants.
       The display is sliced to 8 cards below, but we need all variants in memory
       for the weight selector buttons to appear correctly. */
    api.get('/api/products', { params: { limit: 100 } })
      .then(r => setProducts(groupProductVariants(r.data.data || [])))
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
          width: '100%',
          padding: 'clamp(32px,6vw,56px) clamp(16px,4vw,48px)',
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

            {/* Heading — no hard <br> on mobile, fluid size */}
            <h1 className="hero-slide-title" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(26px, 5.5vw, 62px)',
              fontWeight: 800, color: '#FFFFFF',
              lineHeight: 1.15, marginBottom: 16,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'none',
            }}>
              {slide.title}{' '}
              <span style={{ fontStyle: 'italic', display: 'inline' }}>{slide.titleHighlight}</span>
              {slide.titleEnd && <>{' '}{slide.titleEnd}</>}
            </h1>

            <p style={{
              fontSize: 'clamp(13px, 2vw, 16px)',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.75, marginBottom: 28,
              maxWidth: '100%',               /* never wider than the container */
              textShadow: '0 1px 6px rgba(0,0,0,0.5)',
            }}>
              {slide.subtitle}
            </p>

            {/* Buttons — wrap cleanly on mobile */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => navigate(slide.btn1Path)} style={{
                background: 'linear-gradient(135deg,#C9972B,#F5C842)',
                color: '#1a0a00', border: 'none', borderRadius: 30,
                padding: '13px clamp(18px,3vw,28px)', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(201,151,43,0.4)',
                whiteSpace: 'nowrap', flex: '1 0 auto',
                minWidth: 0, maxWidth: '100%',
              }}>
                {slide.btn1Text}
              </button>
              <button onClick={() => navigate(slide.btn2Path)} style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 30,
                padding: '12px clamp(14px,2.5vw,24px)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', backdropFilter: 'blur(4px)',
                whiteSpace: 'nowrap', flex: '1 0 auto',
                minWidth: 0, maxWidth: '100%',
              }}>
                {slide.btn2Text}
              </button>
            </div>
          </div>
        </div>

       

        {/* Counter */}
        
      </section>

      {/* ══════════════════════════════════════
          FEATURES BAR — single element, CSS-responsive
          Desktop: 4-column flex row
          Mobile:  2×2 grid
         ══════════════════════════════════════ */}
      <section style={{
        background: '#1a0a00',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0',
      }}>
        <div className="features-bar">
          {FEATURES.map((f, i) => (
            <div key={i} className="features-bar__item">
              <span className="features-bar__icon">{f.icon}</span>
              <div className="features-bar__text">
                <div className="features-bar__title">{f.title}</div>
                <div className="features-bar__desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          PROMOTIONAL BANNERS — from DB (active only)
         ══════════════════════════════════════ */}
      <BannerSlider />

      {/* ══════════════════════════════════════
          PRODUCTS PREVIEW — from DB
         ══════════════════════════════════════ */}
      <section style={{ padding: 'clamp(44px,8vw,80px) 0', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972B',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>🌿 Our Collection</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 38,
              fontWeight: 800, color: '#1A1A1A', marginBottom: 12 }}>
              Natural Products for You
            </h2>
            <p style={{ fontSize: 15, color: '#9CA3AF', maxWidth: 480, margin: '0 auto' }}>
              Premium cashews, wood-pressed oils & homemade brownies — freshly packed and delivered to your door.
            </p>
          </div>

          {/* Products from DB — shared ProductCard component (same as ShopPage) */}
          <div className="home-products-grid" style={{ marginBottom: 40 }}>
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
      <section style={{
        background: 'linear-gradient(160deg, #FAFAF8 0%, #FDF8F0 60%, #FBF6ED 100%)',
        padding: 'clamp(60px,8vw,96px) 0',
        borderTop: '1px solid rgba(201,151,43,0.1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(201,151,43,0.1)', border: '1px solid rgba(201,151,43,0.25)',
              color: '#92400E', fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: 2.5, padding: '5px 16px', borderRadius: 30, marginBottom: 18,
            }}>
              Why Petrichor Naturals
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display',serif", fontSize: 'clamp(26px,4vw,40px)',
              fontWeight: 800, color: '#1C1917', letterSpacing: '-0.3px',
            }}>
              What Makes Us Different
            </h2>
          </div>

          {/* Cards grid */}
          <div className="home-why-grid">
            {WHY_US.map((w, idx) => (
              <div
                key={w.title}
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 24,
                  padding: '32px 28px',
                  border: '1px solid rgba(231,226,217,0.8)',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  cursor: 'default',
                  transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s ease, border-color 0.28s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 48px rgba(201,151,43,0.14), 0 4px 16px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(201,151,43,0.45)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(231,226,217,0.8)';
                }}
              >
                {/* Subtle top-right corner accent */}
                <div style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(201,151,43,0.07) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* Icon badge */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  border: '1px solid rgba(201,151,43,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 20,
                  boxShadow: '0 4px 12px rgba(201,151,43,0.15)',
                  flexShrink: 0,
                }}>
                  {w.icon}
                </div>

                {/* Step indicator */}
                <div style={{
                  fontSize: 10, fontWeight: 800, color: '#C9972B',
                  textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8,
                }}>
                  0{idx + 1}
                </div>

                <h3 style={{
                  fontSize: 16, fontWeight: 700, color: '#1C1917',
                  marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.1px',
                }}>
                  {w.title}
                </h3>
                <p style={{
                  fontSize: 13.5, color: '#78716C', lineHeight: 1.75, margin: 0,
                }}>
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA
         ══════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg,#C9972B,#F5C842)',
        padding: 'clamp(44px,8vw,80px) clamp(16px,4vw,48px)',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 'clamp(22px,4vw,34px)',
          fontWeight: 800, color: '#1a0a00', marginBottom: 12,
          wordBreak: 'break-word',
        }}>
          Ready to Order?
        </h2>
        <p style={{ fontSize: 'clamp(13px,2vw,15px)', color: 'rgba(26,10,0,0.65)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
          Fresh batch available now. Free delivery on orders above ₹2000.
        </p>
        <button onClick={() => navigate('/home/shop')} style={{
          background: '#1a0a00', color: '#F5C842', border: 'none',
          borderRadius: 30, padding: 'clamp(12px,2vh,16px) clamp(24px,4vw,40px)',
          fontSize: 'clamp(13px,1.5vw,15px)',
          fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          minHeight: 48,
        }}>
          Shop Now →
        </button>
      </section>

    </div>
  );
}
