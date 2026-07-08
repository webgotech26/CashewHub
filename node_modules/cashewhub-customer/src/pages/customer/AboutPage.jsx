import { useNavigate } from 'react-router-dom';

const VALUES = [
  { icon: '🌿', title: 'No Chemicals',      desc: 'No preservatives, no artificial colour. Just cashews — nothing extra added.' },
  { icon: '🤝', title: 'Direct from Us',    desc: 'We grow and sell our cashews. No middlemen. Price is fair and straight.' },
  { icon: '💎', title: 'Checked Before Pack', desc: 'We check every batch before packing. Bad ones are set aside. Only good ones go out.' },
  { icon: '📦', title: 'Fresh Stock',       desc: 'We pack fresh. You will not get old, sitting stock.' },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#fff' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ position:'relative', padding:'90px 48px 80px', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0,
          backgroundImage:'url(/assets/pexels-nandamends-30878379.jpg)',
          backgroundSize:'cover', backgroundPosition:'center', zIndex:0 }} />
        <div style={{ position:'absolute', inset:0, zIndex:1,
          background:'linear-gradient(135deg,rgba(26,10,0,0.88) 0%,rgba(61,26,0,0.82) 100%)' }} />

        <div style={{ maxWidth:680, margin:'0 auto', position:'relative', zIndex:2 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(201,151,43,0.15)', border:'1px solid rgba(201,151,43,0.4)',
            color:'#F5C842', fontSize:11, fontWeight:700, textTransform:'uppercase',
            letterSpacing:2, padding:'6px 16px', borderRadius:30, marginBottom:24 }}>
            About Us
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:46, fontWeight:800,
            color:'#fff', lineHeight:1.15, marginBottom:18 }}>
            We Are CashewHub —<br />
            <span style={{ color:'#F5C842', fontStyle:'italic' }}>Premium Cashews</span>
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.68)', lineHeight:1.8 }}>
            We grow, process and sell cashews.
            Direct from us to you — simple as that.
          </p>
        </div>
      </section>

      {/* ── WHO WE ARE ───────────────────────────────────── */}
      <section style={{ padding:'72px 0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px',
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#C9972B',
              textTransform:'uppercase', letterSpacing:2, marginBottom:12 }}>Who We Are</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:800,
              color:'#1A1A1A', marginBottom:18, lineHeight:1.25 }}>
              A Cashew Business<br />from Tamil Nadu
            </h2>
            <p style={{ fontSize:15, color:'#6B6B6B', lineHeight:1.85, marginBottom:14 }}>
              We are based in Tamil Nadu. We have our own cashew processing unit here.
              We do not buy from others and resell — we process it ourselves.
            </p>
            <p style={{ fontSize:15, color:'#6B6B6B', lineHeight:1.85, marginBottom:14 }}>
              We sell W180, W240, W320, W450 grades. Also roasted and flavoured varieties.
              All packed in our own unit.
            </p>
            <p style={{ fontSize:15, color:'#6B6B6B', lineHeight:1.85 }}>
              No preservatives. No artificial anything. Just cashews.
            </p>
          </div>

          <div style={{ borderRadius:24, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.16)' }}>
            <img src="/assets/pexels-towfiqu-barbhuiya-3440682-9017852.jpg" alt="Our cashews"
              style={{ width:'100%', height:340, objectFit:'cover', display:'block' }}
              onError={e => e.target.style.display='none'} />
            <div style={{ background:'#1a0a00', padding:'16px 22px', textAlign:'center' }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15,
                color:'#F5C842', fontWeight:700 }}>Processed in Panruti, Tamil Nadu</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────── */}
      <section style={{ background:'#FDF8F3', padding:'72px 0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px' }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#C9972B',
              textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>What We Sell</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32,
              fontWeight:800, color:'#1A1A1A' }}>Our Products</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>
            {[
              { img:'/assets/pexels-towfiqu-barbhuiya-3440682-9017852.jpg',
                title:'W Grade Cashews',
                desc:'W180, W240, W320, W450 — available in 250g, 500g and 1kg packs.' },
              { img:'/assets/pexels-hatdieubaokhanh-com-2155729267-34449058.jpg',
                title:'Bulk Orders',
                desc:'Bulk packs for families, sweet shops and resellers. Contact us for pricing.' },
            ].map(item => (
              <div key={item.title} style={{ borderRadius:18, overflow:'hidden', background:'#fff',
                border:'1px solid #EBEBEB', boxShadow:'0 4px 16px rgba(0,0,0,0.05)' }}>
                <img src={item.img} alt={item.title}
                  style={{ width:'100%', height:220, objectFit:'cover', display:'block' }}
                  onError={e => e.target.parentElement.style.display='none'} />
                <div style={{ padding:'18px 22px' }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', marginBottom:6 }}>{item.title}</h3>
                  <p style={{ fontSize:13, color:'#9CA3AF', lineHeight:1.7 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────── */}
      <section style={{ padding:'72px 0', background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#C9972B',
              textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>How We Work</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32,
              fontWeight:800, color:'#1A1A1A' }}>Why People Trust Us</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
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
        padding:'60px 48px', textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:30,
          fontWeight:800, color:'#fff', marginBottom:10 }}>Want to Order?</h2>
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
