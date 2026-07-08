import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    step: '01', title: 'Picking', subtitle: 'We Get It Fresh',
    bg: 'linear-gradient(135deg,#1B4332,#2D6A4F)',
    image: '/assets/pexels-jens-f-2153787630-33154105.jpg',
    desc: 'We get fresh cashews directly from farms in Panruti, Tamil Nadu. Only ripe and good ones are taken. They come to our unit the same day or next day.',
    points: ['Fresh from Panruti farms', 'Only ripe ones selected', 'Comes to our unit same day', 'No sitting in heat'],
  },
  {
    step: '02', title: 'Shelling', subtitle: 'Remove Outer Shell',
    bg: 'linear-gradient(135deg,#5C2D00,#7B3F00)',
    image: '/assets/pexels-kelly-2869015.jpg',
    desc: 'The outer shell has an irritant oil. We use steam to soften it, then machine-shell it. No chemicals used.',
    points: ['Steam at 180°C to soften', 'Machine shelling', 'Shell oil collected separately', 'No chemical treatment'],
  },
  {
    step: '03', title: 'Drying', subtitle: 'Moisture Removal',
    bg: 'linear-gradient(135deg,#5C0000,#8B0000)',
    image: '/assets/pexels-0ldpikes-32175377.jpg',
    desc: 'After shelling, cashews are dried. Moisture is reduced to the right level so they stay fresh longer.',
    points: ['Dried to 3–5% moisture', 'Even drying throughout', 'Prevents early spoiling', 'Natural drying process'],
  },
  {
    step: '04', title: 'Peeling & Grading', subtitle: 'Skin Off, Size Sort',
    bg: 'linear-gradient(135deg,#8B6914,#B8860B)',
    image: '/assets/pexels-ai25studioai-4499222.jpg',
    desc: 'Thin skin on the cashew is removed by hand. Then cashews are sorted by size — W180, W240, W320, W450.',
    points: ['Skin removed by hand', 'Sorted by size', 'W180 to W450 grades', 'Broken pieces kept separate'],
  },
  {
    step: '05', title: 'Quality Check', subtitle: 'Checked Before Pack',
    bg: 'linear-gradient(135deg,#0D1F1A,#1A3028)',
    image: '/assets/pexels-hatdieubaokhanh-com-2155729267-36631827.jpg',
    desc: 'We check moisture, colour, size, taste and freshness. Any batch that does not pass — we do not send it.',
    points: ['Moisture checked', 'Colour checked', 'Taste tested', 'Only good batches packed'],
  },
  {
    step: '06', title: 'Packing & Dispatch', subtitle: 'Sealed Fresh',
    bg: 'linear-gradient(135deg,#A67A1A,#C9972B)',
    image: '/assets/pexels-valeriya-21558697.jpg',
    desc: 'Cashews are packed in airtight food-grade packs. Grade and date written on each pack. Dispatched within 24 hours.',
    points: ['Food-safe airtight packs', 'Grade and date on pack', 'Dispatched same or next day', 'Stays fresh till you open'],
  },
];

const GRADES = [
  { grade:'W180', size:'Largest', count:'180/lb', use:'Gifting, Premium', emoji:'🥇', color:'#7B3F00' },
  { grade:'W210', size:'Extra Large', count:'210/lb', use:'Premium Snacking', emoji:'⭐', color:'#8B4513' },
  { grade:'W240', size:'Large', count:'240/lb', use:'Snacking, Cooking', emoji:'✨', color:'#A0522D' },
  { grade:'W320', size:'Medium', count:'320/lb', use:'Most Popular', emoji:'🏆', color:'#C9972B' },
  { grade:'W450', size:'Small', count:'450/lb', use:'Sweets, Cooking', emoji:'💛', color:'#B8860B' },
];

export default function ProcessingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#fff' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{
        position:'relative',
        padding:'90px 48px 70px', textAlign:'center', overflow:'hidden',
      }}>
        {/* Background image */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'url(/assets/pexels-jens-f-2153787630-33154105.jpg)',
          backgroundSize:'cover', backgroundPosition:'center',
          zIndex:0,
        }} />
        {/* Dark overlay */}
        <div style={{
          position:'absolute', inset:0, zIndex:1,
          background:'linear-gradient(135deg,rgba(10,30,20,0.88) 0%,rgba(20,60,40,0.80) 100%)',
        }} />
        <div style={{ maxWidth:680, margin:'0 auto', position:'relative', zIndex:2 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(240,202,109,0.15)', border:'1px solid rgba(240,202,109,0.35)',
            color:'#F0CA6D', fontSize:11, fontWeight:700, textTransform:'uppercase',
            letterSpacing:2, padding:'6px 16px', borderRadius:30, marginBottom:24 }}>
            How We Make It
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:46, fontWeight:800,
            color:'#fff', lineHeight:1.15, marginBottom:18 }}>
            From Raw Cashew<br />
            <span style={{ color:'#F0CA6D', fontStyle:'italic' }}>to Your Pack</span><br />
            <span style={{ fontSize:'clamp(16px,3vw,22px)', fontWeight:600, color:'rgba(255,255,255,0.7)', fontStyle:'normal', fontFamily:"'DM Sans',sans-serif" }}>Processed in Panruti, Tamil Nadu</span>
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.62)', lineHeight:1.8, maxWidth:520, margin:'0 auto' }}>
            Here is how we process cashews — from picking to packing. Every step is done in our Panruti unit.
          </p>
        </div>
      </section>

      {/* ── QUICK FLOW ───────────────────────────────────── */}
      <section style={{ background:'#fff', borderBottom:'1px solid #EBEBEB', padding:'0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            {STEPS.map((s, i) => (
              <div key={s.step} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 'none' }}>
                {/* Step box */}
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'center',
                  padding:'22px 16px', cursor:'default',
                }}>
                  <div style={{
                    width:40, height:40, borderRadius:'50%',
                    background:'linear-gradient(135deg,#1a0a00,#3d1a00)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:800, color:'#F5C842', marginBottom:8,
                    boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
                  }}>{s.step}</div>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1A1A1A', whiteSpace:'nowrap' }}>{s.title}</span>
                  <span style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>{s.subtitle}</span>
                </div>
                {/* Arrow */}
                {i < STEPS.length - 1 && (
                  <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                      <path d="M0 6h18M13 1l6 5-6 5" stroke="#C9972B" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DETAILED STEPS ───────────────────────────────── */}
      <section style={{ padding:'80px 0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px' }}>
          <div style={{ textAlign:'center', marginBottom:60 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#2D6A4F', textTransform:'uppercase',
              letterSpacing:2, marginBottom:12 }}>Step by Step</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:800, color:'#1A1A1A' }}>
              How We Process Our Cashews
            </h2>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:56 }}>
            {STEPS.map((step, i) => (
              <div key={step.step} style={{
                display:'grid',
                gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr',
                gap: 48, alignItems: 'center',
              }}>
                {/* Content */}
                <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                    <div style={{ background: step.bg, color:'#fff', fontSize:11,
                      fontWeight:800, padding:'4px 14px', borderRadius:20, letterSpacing:1 }}>
                      STEP {step.step}
                    </div>
                    <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:600 }}>{step.subtitle}</div>
                  </div>
                  <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:28,
                    fontWeight:800, color:'#1A1A1A', marginBottom:14 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize:15, color:'#6B6B6B', lineHeight:1.9, marginBottom:20 }}>
                    {step.desc}
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {step.points.map(pt => (
                      <div key={pt} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:22, height:22, borderRadius:'50%', background: step.bg,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:11, color:'#fff', flexShrink:0, fontWeight:700,
                        }}>✓</div>
                        <span style={{ fontSize:14, color:'#4A4A4A', fontWeight:500 }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image card */}
                <div style={{ order: i % 2 === 0 ? 2 : 1 }}>
                  <div style={{
                    borderRadius:24, overflow:'hidden',
                    boxShadow:'0 16px 48px rgba(0,0,0,0.15)',
                    position:'relative',
                  }}>
                    {/* Step label over image */}
                    <div style={{
                      position:'absolute', top:16, left:16, zIndex:2,
                      background: step.bg, color:'#fff',
                      fontSize:12, fontWeight:800, padding:'6px 16px',
                      borderRadius:20, letterSpacing:0.5,
                    }}>
                      Step {step.step} — {step.title}
                    </div>
                    <img
                      src={step.image}
                      alt={step.title}
                      style={{ width:'100%', height:300, objectFit:'cover', display:'block' }}
                      onError={e => {
                        e.target.style.display='none';
                        e.target.parentElement.style.background = step.bg;
                        e.target.parentElement.style.height = '300px';
                        e.target.parentElement.style.display = 'flex';
                        e.target.parentElement.style.alignItems = 'center';
                        e.target.parentElement.style.justifyContent = 'center';
                      }}
                    />
                    {/* Bottom caption */}
                    <div style={{
                      position:'absolute', bottom:0, left:0, right:0,
                      background:'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      padding:'32px 20px 16px',
                    }}>
                      <p style={{ color:'rgba(255,255,255,0.85)', fontSize:13,
                        fontWeight:500, margin:0 }}>{step.subtitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUALITY PROMISE ──────────────────────────────── */}
      <section style={{ background:'#FDF8F3', padding:'64px 48px', textAlign:'center' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏅</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:800,
            color:'#1A1A1A', marginBottom:14 }}>We Check Before We Pack</h2>
          <p style={{ fontSize:15, color:'#6B6B6B', lineHeight:1.9, marginBottom:28 }}>
            Before any cashew is packed, we check it. Moisture, colour, size, taste and freshness —
            all five are checked. If a batch does not pass, we do not send it.
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap', marginBottom:32 }}>
            {['Moisture','Colour','Size','Taste','Freshness'].map(check => (
              <div key={check} style={{ background:'#fff', border:'2px solid #C9972B',
                color:'#1A1A1A', fontSize:13, fontWeight:700, padding:'8px 18px',
                borderRadius:30, boxShadow:'0 2px 8px rgba(201,151,43,0.12)' }}>
                ✓ {check}
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/home/shop')} style={{
            background:'linear-gradient(135deg,#C9972B,#F5C842)', color:'#1a0a00',
            border:'none', borderRadius:30, padding:'14px 36px',
            fontSize:14, fontWeight:800, cursor:'pointer',
          }}>
            Shop Premium Cashews →
          </button>
        </div>
      </section>
    </div>
  );
}
