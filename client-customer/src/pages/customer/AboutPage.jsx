import { useNavigate } from 'react-router-dom';

const VALUES = [
  { icon: '🌿', title: 'No Chemicals',        desc: 'No preservatives, no artificial colour or flavour. Just pure natural goodness — nothing extra added.' },
  { icon: '🤝', title: 'Direct from Us',      desc: 'We source, process and sell ourselves. No middlemen. Fair price, straight from us to you.' },
  { icon: '💎', title: 'Checked Before Pack', desc: 'Every batch is inspected before packing. Only products that meet our standards go out.' },
  { icon: '📦', title: 'Fresh Stock',         desc: 'We pack fresh and dispatch quickly. You always get products at peak quality.' },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#fff' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{
        padding:'clamp(32px,5vw,64px) clamp(16px,4vw,48px) clamp(24px,4vw,48px)',
        textAlign:'center',
        background:'#FDFBF7',
        borderBottom:'1px solid rgba(201,151,43,0.12)',
        position:'relative', overflow:'hidden',
      }}>
        {/* Radial amber glow — top centre */}
        <div style={{
          position:'absolute', top:'-80px', left:'50%', transform:'translateX(-50%)',
          width:'80%', maxWidth:800, height:400,
          background:'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.18) 0%, rgba(253,230,138,0.07) 45%, transparent 70%)',
          pointerEvents:'none',
        }} />
        {/* Warm base fade */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(253,251,247,0.55) 100%)',
          pointerEvents:'none',
        }} />

        <div style={{ maxWidth:680, margin:'0 auto', position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(201,151,43,0.1)', border:'1px solid rgba(201,151,43,0.3)',
            color:'#92400E', fontSize:11, fontWeight:700, textTransform:'uppercase',
            letterSpacing:2, padding:'6px 16px', borderRadius:30, marginBottom:16 }}>
            About Us
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(26px,5vw,46px)', fontWeight:800,
            color:'#1C1917', lineHeight:1.15, marginBottom:12 }}>
            We Are Petrichor Naturals —<br />
            <span style={{ color:'#C9972B', fontStyle:'italic' }}>Premium Naturals</span>
          </h1>
          <p style={{ fontSize:'clamp(13px,2vw,15px)', color:'#78716C', lineHeight:1.75, maxWidth:560, margin:'0 auto' }}>
            We grow, process and sell premium natural products.
            Direct from us to you — simple as that.
          </p>
        </div>
      </section>

      {/* ── WHO WE ARE ───────────────────────────────────── */}
      <section className="about-who-section" style={{ padding:'clamp(36px,6vw,72px) 0' }}>
        <div className="about-who-grid" style={{ maxWidth:1100, margin:'0 auto', padding:'0 clamp(16px,4vw,48px)' }}>

          {/* ── Left: text column ── */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#C9972B',
              textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>Who We Are</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:800,
              color:'#1A1A1A', marginBottom:18, lineHeight:1.25 }}>
              A Natural Products Business<br />from India
            </h2>
            <p style={{ fontSize:15, color:'#6B6B6B', lineHeight:1.85, marginBottom:14 }}>
              We are based in India. We have our own processing unit where we
              handle everything — from sourcing to packing — without middlemen.
            </p>
            <p style={{ fontSize:15, color:'#6B6B6B', lineHeight:1.85, marginBottom:14 }}>
              We sell premium cashews (W180, W240, W320 &amp; roasted varieties), wood-pressed
              oils extracted the traditional way, and handmade brownies baked fresh with
              quality ingredients. All made and packed in-house.
            </p>
            <p style={{ fontSize:15, color:'#6B6B6B', lineHeight:1.85 }}>
              No preservatives. No artificial anything. Just pure natural goodness.
            </p>
          </div>

          <div style={{ borderRadius:24, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.16)' }}>
            {/* Product collage — 3 tiles showing the full range */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'auto auto', gap:3, background:'#1a0a00' }}>
              {/* Cashews — large left tile spanning both rows */}
              <div style={{ gridRow:'1 / 3', background:'#F7F4EF', position:'relative', minHeight:340 }}>
                <img
                  src="/assets/premium.png"
                  alt="Premium Cashews"
                  style={{ width:'100%', height:'100%', objectFit:'contain', padding:20, display:'block' }}
                  onError={e => e.target.style.display='none'}
                />
                <span style={{
                  position:'absolute', bottom:10, left:10,
                  background:'rgba(26,10,0,0.72)', color:'#F5C842',
                  fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, letterSpacing:0.5,
                }}>🥜 Cashews</span>
              </div>
              {/* Oil — top-right tile */}
              <div style={{ background:'#FAFAF5', position:'relative', height:168 }}>
                <img
                  src="/assets/groundant.png"
                  alt="Wood Pressed Oil"
                  style={{ width:'100%', height:'100%', objectFit:'contain', padding:12, display:'block' }}
                  onError={e => e.target.style.display='none'}
                />
                <span style={{
                  position:'absolute', bottom:8, left:8,
                  background:'rgba(26,10,0,0.72)', color:'#F5C842',
                  fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, letterSpacing:0.5,
                }}>🫙 Oils</span>
              </div>
              {/* Brownie — bottom-right tile */}
              <div style={{ background:'#2C1A0E', position:'relative', height:168 }}>
                <img
                  src="/assets/brownie.png"
                  alt="Homemade Brownie"
                  style={{ width:'100%', height:'100%', objectFit:'contain', padding:12, display:'block' }}
                  onError={e => e.target.style.display='none'}
                />
                <span style={{
                  position:'absolute', bottom:8, left:8,
                  background:'rgba(26,10,0,0.72)', color:'#F5C842',
                  fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, letterSpacing:0.5,
                }}>🍫 Brownies</span>
              </div>
            </div>
            {/* Caption bar */}
            <div style={{ background:'#1a0a00', padding:'14px 22px', textAlign:'center' }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14,
                color:'#F5C842', fontWeight:700 }}>Made &amp; Packed in India</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────── */}
      <section style={{ background:'#FDF8F3', padding:'clamp(44px,8vw,72px) 0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 clamp(16px,4vw,48px)' }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#C9972B',
              textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>What We Sell</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(22px,4vw,32px)',
              fontWeight:800, color:'#1A1A1A', wordBreak:'break-word' }}>Our Products</h2>
          </div>
          <div className="about-products-grid">
            {[
              {
                img:   '/assets/premium.png',
                title: 'Premium Cashews',
                desc:  'W180, W240, W320 grades and roasted varieties — all hand-selected, carefully processed and freshly packed in India.',
                tag:   '🥜 Cashews',
              },
              {
                img:   '/assets/groundant.png',
                title: 'Wood Pressed Oils',
                desc:  'Gingelly oil and groundnut oil extracted the traditional way using wooden cold-press. No heat, no chemicals — full natural flavour retained.',
                tag:   '🫙 Oils',
              },
              {
                img:   '/assets/brownie.png',
                title: 'Homemade Brownies',
                desc:  'Rich, fudgy brownies baked fresh with premium-quality ingredients. Made in small batches so every piece is soft, moist and delicious.',
                tag:   '🍫 Brownies',
              },
            ].map(item => (
              <div key={item.title} style={{ borderRadius:18, overflow:'hidden', background:'#fff',
                border:'1px solid #EBEBEB', boxShadow:'0 4px 16px rgba(0,0,0,0.05)',
                display:'flex', flexDirection:'column' }}>
                <div style={{ position:'relative', background:'#F7F4EF', height:200,
                  display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  <img src={item.img} alt={item.title}
                    style={{ width:'100%', height:'100%', objectFit:'contain', padding:16 }}
                    onError={e => { e.target.style.display='none'; }} />
                  <span style={{
                    position:'absolute', top:12, left:12,
                    background:'rgba(26,10,0,0.75)', color:'#F5C842',
                    fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:20,
                    letterSpacing:0.5,
                  }}>{item.tag}</span>
                </div>
                <div style={{ padding:'18px 22px', flex:1 }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', marginBottom:8 }}>{item.title}</h3>
                  <p style={{ fontSize:13, color:'#9CA3AF', lineHeight:1.75 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────── */}
      <section style={{ padding:'clamp(44px,8vw,72px) 0', background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 clamp(16px,4vw,48px)' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#C9972B',
              textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>How We Work</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(22px,4vw,32px)',
              fontWeight:800, color:'#1A1A1A', wordBreak:'break-word' }}>Why People Trust Us</h2>
          </div>
          <div className="why-us-grid">
            {VALUES.map(v => (
              <div key={v.title} style={{ background:'#FDF8F3', borderRadius:18, padding:'26px 22px',
                border:'1px solid #EBEBEB', transition:'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 28px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ fontSize:32, marginBottom:12 }}>{v.icon}</div>
                <h3 style={{ fontSize:14, fontWeight:700, color:'#1A1A1A', marginBottom:7 }}>{v.title}</h3>
                <p style={{ fontSize:13, color:'#9CA3AF', lineHeight:1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg,#1a0a00,#3d1a00)',
        padding:'clamp(44px,8vw,72px) clamp(16px,4vw,48px)', textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(20px,4vw,30px)',
          fontWeight:800, color:'#fff', marginBottom:10, wordBreak:'break-word' }}>Want to Order?</h2>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.6)', marginBottom:28 }}>
          Fresh batch ready. Order online or call us directly.
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:14, flexWrap:'wrap' }}>
          <button onClick={() => navigate('/home/shop')} style={{
            background:'linear-gradient(135deg,#C9972B,#F5C842)', color:'#1a0a00',
            border:'none', borderRadius:30, padding:'13px 30px',
            fontSize:14, fontWeight:800, cursor:'pointer' }}>
            See Products →
          </button>
          <button onClick={() => navigate('/home/contact')} style={{
            background:'rgba(255,255,255,0.08)', color:'#fff',
            border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:30,
            padding:'12px 26px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Contact Us
          </button>
        </div>
      </section>
    </div>
  );
}
