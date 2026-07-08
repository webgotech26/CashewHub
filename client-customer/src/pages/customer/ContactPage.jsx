import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const sub = encodeURIComponent(form.subject || `Enquiry from ${form.name}`);
      const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\nMessage:\n${form.message}`);
      window.open(`mailto:cashewhub@gmail.com?subject=${sub}&body=${body}`, '_blank');
      setSubmitted(true); setLoading(false);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 500);
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#fff' }}>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 320 }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/assets/pexels-towfiqu-barbhuiya-3440682-9017852.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(135deg,rgba(26,10,0,0.85) 0%,rgba(61,26,0,0.75) 100%)',
        }} />
        <div style={{ position:'relative', zIndex:2, maxWidth:580, margin:'0 auto',
          padding:'90px 24px 90px', textAlign:'center' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(201,151,43,0.15)', border:'1px solid rgba(201,151,43,0.4)',
            color:'#F5C842', fontSize:11, fontWeight:700, textTransform:'uppercase',
            letterSpacing:2.5, padding:'6px 18px', borderRadius:30, marginBottom:24,
          }}>Contact Us</div>
          <h1 style={{
            fontFamily:"'Playfair Display',serif", fontSize:50, fontWeight:800,
            color:'#fff', lineHeight:1.12, marginBottom:18,
          }}>
            We'd Love to<br />
            <span style={{ color:'#F5C842', fontStyle:'italic' }}>Hear From You</span>
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.62)', lineHeight:1.85 }}>
            Bulk orders, product queries, or just a hello —<br />
            we're available every day from 9AM to 10PM.
          </p>
        </div>
      </section>

      {/* ══ INFO CARDS ════════════════════════════════════ */}
      <section style={{ background:'#F8F4EF', padding:'52px 48px 44px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto',
          display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9972B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              ),
              label:'Our Location', v1:'Panruti, Tamil Nadu', v2:'India', href:'https://maps.google.com/?q=Panruti,Tamil+Nadu',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9972B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              ),
              label:'Call Us', v1:'+91 63825 35757', v2:'Mon–Sun, 9AM–10PM', href:'tel:+916382535757',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9972B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              ),
              label:'Email Us', v1:'cashewhub@gmail.com', v2:'Reply within 24 hours', href:'mailto:cashewhub@gmail.com',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9972B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              ),
              label:'Business Hours', v1:'9:00 AM – 10:00 PM', v2:'Monday to Sunday', href:null,
            },
          ].map((c, i) => (
            <div key={i}
              onClick={() => c.href && window.open(c.href, '_blank')}
              style={{
                background:'#fff', borderRadius:20, padding:'28px 24px',
                border:'1px solid #EDE8E2',
                boxShadow:'0 2px 16px rgba(0,0,0,0.05)',
                cursor: c.href ? 'pointer' : 'default',
                transition:'all 0.25s',
              }}
              onMouseEnter={e => { if(c.href){ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(201,151,43,0.15)'; e.currentTarget.style.borderColor='#C9972B'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 16px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor='#EDE8E2'; }}
            >
              <div style={{ width:48, height:48, borderRadius:14,
                background:'linear-gradient(135deg,#FDF3E0,#FAE8C0)',
                display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                {c.icon}
              </div>
              <div style={{ fontSize:10, fontWeight:800, color:'#C9972B',
                textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>{c.label}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#1A1A1A', marginBottom:4 }}>{c.v1}</div>
              <div style={{ fontSize:12, color:'#9CA3AF' }}>{c.v2}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FORM + SIDEBAR ════════════════════════════════ */}
      <section style={{ padding:'0 48px 80px', background:'#F8F4EF' }}>
        <div style={{ maxWidth:1100, margin:'0 auto',
          display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:28, alignItems:'start' }}>

          {/* Contact Form */}
          <div style={{
            background:'#fff', borderRadius:24, padding:'40px',
            boxShadow:'0 4px 24px rgba(0,0,0,0.06)', border:'1px solid #EDE8E2',
          }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#C9972B',
              textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>Send a Message</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26,
              fontWeight:800, color:'#1A1A1A', marginBottom:28 }}>We'll Get Back to You</h2>

            {submitted && (
              <div style={{ background:'#F0FDF4', border:'1.5px solid #86EFAC', borderRadius:12,
                padding:'14px 18px', marginBottom:24, display:'flex', alignItems:'center', gap:10,
                fontSize:14, color:'#15803D', fontWeight:600 }}>
                ✅ Message sent! We'll reply within 24 hours.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[
                  { label:'Your Name *', key:'name', type:'text', placeholder:'e.g. Ravi Kumar', req:true },
                  { label:'Phone Number', key:'phone', type:'tel', placeholder:'+91 XXXXX XXXXX', req:false },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize:12, fontWeight:700, color:'#4A4A4A', display:'block', marginBottom:6 }}>{f.label}</label>
                    <input type={f.type} required={f.req} value={form[f.key]}
                      onChange={e => setForm({...form,[f.key]:e.target.value})}
                      placeholder={f.placeholder}
                      style={{ width:'100%', padding:'12px 16px', borderRadius:12, boxSizing:'border-box',
                        border:'1.5px solid #E5E7EB', fontSize:14, outline:'none', fontFamily:'inherit',
                        background:'#FAFAFA', transition:'all 0.2s' }}
                      onFocus={e => { e.target.style.borderColor='#C9972B'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(201,151,43,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#FAFAFA'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#4A4A4A', display:'block', marginBottom:6 }}>Email Address *</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm({...form,email:e.target.value})} placeholder="your@email.com"
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, boxSizing:'border-box',
                    border:'1.5px solid #E5E7EB', fontSize:14, outline:'none', fontFamily:'inherit',
                    background:'#FAFAFA', transition:'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor='#C9972B'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(201,151,43,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#FAFAFA'; e.target.style.boxShadow='none'; }}
                />
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#4A4A4A', display:'block', marginBottom:6 }}>Subject</label>
                <select value={form.subject} onChange={e => setForm({...form,subject:e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, boxSizing:'border-box',
                    border:'1.5px solid #E5E7EB', fontSize:14, outline:'none', fontFamily:'inherit',
                    background:'#FAFAFA', transition:'all 0.2s', cursor:'pointer', color: form.subject ? '#1A1A1A' : '#9CA3AF' }}
                  onFocus={e => { e.target.style.borderColor='#C9972B'; e.target.style.boxShadow='0 0 0 3px rgba(201,151,43,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.boxShadow='none'; }}
                >
                  <option value="">Select a subject…</option>
                  <option>Bulk Order Enquiry</option>
                  <option>Product Information</option>
                  <option>Order Status</option>
                  <option>Delivery Query</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#4A4A4A', display:'block', marginBottom:6 }}>Message *</label>
                <textarea required rows={4} value={form.message}
                  onChange={e => setForm({...form,message:e.target.value})}
                  placeholder="Tell us about your enquiry — bulk order, product questions, etc."
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, boxSizing:'border-box',
                    border:'1.5px solid #E5E7EB', fontSize:14, outline:'none', fontFamily:'inherit',
                    background:'#FAFAFA', transition:'all 0.2s', resize:'vertical', minHeight:110 }}
                  onFocus={e => { e.target.style.borderColor='#C9972B'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(201,151,43,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#FAFAFA'; e.target.style.boxShadow='none'; }}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                padding:'15px 32px', borderRadius:12, border:'none',
                background: loading ? '#E5E7EB' : 'linear-gradient(135deg,#1a0a00,#3d1a00)',
                color: loading ? '#9CA3AF' : '#F5C842',
                fontSize:15, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                letterSpacing:0.3, transition:'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(26,10,0,0.25)',
              }}
                onMouseEnter={e => { if(!loading){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(26,10,0,0.3)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(26,10,0,0.25)'; }}
              >
                {loading ? 'Sending…' : 'Send Message →'}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Quick Contact */}
            <div style={{
              background:'linear-gradient(160deg,#1a0a00,#3d1a00)',
              borderRadius:24, padding:28,
              boxShadow:'0 8px 32px rgba(26,10,0,0.2)',
            }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20,
                fontWeight:700, color:'#F5C842', marginBottom:20 }}>Quick Contact</h3>

              {[
                { label:'Call Us', value:'+91 63825 35757', href:'tel:+916382535757',
                  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C842" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                },
                { label:'Email', value:'cashewhub@gmail.com', href:'mailto:cashewhub@gmail.com',
                  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C842" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                },
                { label:'WhatsApp', value:'Chat with us now', href:'https://wa.me/916382535757',
                  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                },
              ].map(c => (
                <a key={c.label} href={c.href} target={c.href.startsWith('http')?'_blank':'_self'} rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:14,
                    background:'rgba(255,255,255,0.06)', borderRadius:14,
                    padding:'14px 16px', textDecoration:'none', marginBottom:10,
                    border:'1px solid rgba(255,255,255,0.08)', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(201,151,43,0.15)'; e.currentTarget.style.borderColor='rgba(201,151,43,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ width:36, height:36, borderRadius:10,
                    background:'rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)',
                      textTransform:'uppercase', letterSpacing:1, fontWeight:700 }}>{c.label}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginTop:2 }}>{c.value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Hours */}
            <div style={{ background:'#fff', borderRadius:20, padding:'24px',
              border:'1px solid #EDE8E2', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', marginBottom:16,
                display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#FDF3E0,#FAE8C0)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9972B" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                Business Hours
              </h3>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'12px 0', borderBottom:'1px solid #F5F0EA' }}>
                <span style={{ fontSize:13, color:'#4A4A4A', fontWeight:500 }}>Monday – Sunday</span>
                <span style={{ fontSize:13, fontWeight:800, color:'#15803D',
                  background:'#F0FDF4', padding:'4px 12px', borderRadius:20 }}>9AM – 10PM</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E',
                  boxShadow:'0 0 0 3px rgba(34,197,94,0.2)' }} />
                <span style={{ fontSize:12, color:'#15803D', fontWeight:600 }}>Open 7 days a week</span>
              </div>
            </div>

            {/* Location */}
            <div style={{ background:'#fff', borderRadius:20, padding:'24px',
              border:'1px solid #EDE8E2', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', marginBottom:12,
                display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#FDF3E0,#FAE8C0)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9972B" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                Our Location
              </h3>
              <p style={{ fontSize:14, color:'#6B6B6B', lineHeight:1.7, marginBottom:14 }}>
                Panruti, Cuddalore District<br />Tamil Nadu — India
              </p>
              <a href="https://maps.google.com/?q=Panruti,Tamil+Nadu" target="_blank" rel="noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13,
                  fontWeight:700, color:'#fff',
                  background:'linear-gradient(135deg,#1a0a00,#3d1a00)',
                  padding:'9px 18px', borderRadius:30, textDecoration:'none',
                  boxShadow:'0 4px 12px rgba(26,10,0,0.2)' }}>
                View on Google Maps →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════ */}
      <section style={{ background:'linear-gradient(135deg,#1a0a00,#3d1a00)',
        padding:'60px 48px', textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32,
          fontWeight:800, color:'#fff', marginBottom:12 }}>Ready to Order?</h2>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.6)', marginBottom:28 }}>
          Browse our premium cashew collection. Free delivery above ₹499.
        </p>
        <button onClick={() => navigate('/home/shop')} style={{
          background:'linear-gradient(135deg,#C9972B,#F5C842)', color:'#1a0a00',
          border:'none', borderRadius:30, padding:'14px 36px',
          fontSize:14, fontWeight:800, cursor:'pointer',
          boxShadow:'0 4px 16px rgba(201,151,43,0.4)',
        }}>Shop Now →</button>
      </section>
    </div>
  );
}
