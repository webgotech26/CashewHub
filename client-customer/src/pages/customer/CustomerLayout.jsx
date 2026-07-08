import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { CartProvider, useCart } from '../../context/CartContext';
import CartDrawer from '../../components/CartDrawer';
import WhatsAppButton from '../../components/WhatsAppButton';
import '../../styles/pages/customer.css';

/* ── SVG Icons ───────────────────────────────────────────────── */
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconCart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconOrder   = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconProfile = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconLogout  = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ── Nav links config ────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Home',        path: '/home' },
  { label: 'Shop',        path: '/home/shop' },
  { label: 'About Us',    path: '/home/about' },
  { label: 'Our Process', path: '/home/processing' },
  { label: 'Contact',     path: '/home/contact' },
];

/* ── Profile Dropdown ────────────────────────────────────────── */
function ProfileDropdown({ user, onLogout, onNavigate }) {
  return (
    <div className="ch-profile-dropdown">
      {/* User info header */}
      <div className="ch-profile-dropdown__header">
        <div className="ch-profile-dropdown__avatar">
          {(user.name || 'C').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="ch-profile-dropdown__name">{user.name || 'Customer'}</p>
          <p className="ch-profile-dropdown__email">{user.email || 'Welcome back'}</p>
        </div>
      </div>

      <div className="ch-profile-dropdown__divider" />

      <button className="ch-profile-dropdown__item" onClick={() => onNavigate('/home/orders')}>
        <IconOrder /> My Orders
      </button>
      <button className="ch-profile-dropdown__item" onClick={() => onNavigate('/home/orders')}>
        <IconProfile /> My Profile
      </button>

      <div className="ch-profile-dropdown__divider" />

      <button className="ch-profile-dropdown__item ch-profile-dropdown__item--danger" onClick={onLogout}>
        <IconLogout /> Logout
      </button>
    </div>
  );
}

/* ── Main Layout ─────────────────────────────────────────────── */
function Layout() {
  const navigate = useNavigate();
  const [cartOpen, setCartOpen]         = useState(false);
  const [search, setSearch]             = useState('');
  const [profileOpen, setProfileOpen]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef                      = useRef(null);
  const { cartCount }                   = useCart();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavClick = (link) => {
    navigate(link.path);
  };

  return (
    <div className="shop-layout">

      {/* ══════════════════════════════════════════════════════════
          PREMIUM HEADER — 3-column layout
          LEFT: Logo   CENTER: Nav   RIGHT: Search + Profile + Cart
         ══════════════════════════════════════════════════════════ */}
      <header className="ch-header">

        {/* ── LEFT: Brand ───────────────────────────────── */}
        <div className="ch-header__brand" onClick={() => navigate('/home')}>
          <img
            src="/assets/cashewlogo.png"
            alt="CashewHub logo"
            className="ch-header__logo"
            style={{ mixBlendMode: 'multiply' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="ch-header__brand-text">
            <span className="ch-header__brand-name">CashewHub</span>
            <span className="ch-header__brand-tag">Premium Quality Nuts</span>
          </div>
        </div>

        {/* ── CENTER: Nav links ─────────────────────────── */}
        <nav className="ch-nav" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
            <button
              key={link.label}
              className="ch-nav__link"
              onClick={() => handleNavClick(link)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* ── RIGHT: Actions ────────────────────────────── */}
        <div className="ch-header__actions">

          {/* Search pill */}
          <div className="ch-search">
            <span className="ch-search__icon"><IconSearch /></span>
            <input
              type="text"
              className="ch-search__input"
              placeholder="Search cashews…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </div>

          {/* Profile button + dropdown */}
          <div className="ch-profile-wrap" ref={profileRef}>
            <button
              className={`ch-icon-btn ${profileOpen ? 'ch-icon-btn--active' : ''}`}
              onClick={() => setProfileOpen(v => !v)}
              aria-label="Account menu"
              aria-expanded={profileOpen}
            >
              <IconUser />
              <span className="ch-icon-btn__chevron"><IconChevron /></span>
            </button>

            {profileOpen && (
              <ProfileDropdown
                user={user}
                onLogout={handleLogout}
                onNavigate={(path) => { navigate(path); setProfileOpen(false); }}
              />
            )}
          </div>

          {/* Cart button */}
          <button
            className="ch-cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            <IconCart />
            {cartCount > 0 && (
              <span className="ch-cart-btn__badge" aria-hidden="true">{cartCount}</span>
            )}
          </button>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            style={{
              display: 'none',
              background: 'none', border: '1.5px solid #EBEBEB',
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center',
            }}
            className="ch-hamburger"
            aria-label="Toggle menu"
          >
            <span style={{ width:20, height:2, background: mobileMenuOpen ? '#C9972B' : '#1A1A1A', borderRadius:2, display:'block', transition:'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <span style={{ width:20, height:2, background: mobileMenuOpen ? 'transparent' : '#1A1A1A', borderRadius:2, display:'block', transition:'all 0.2s' }} />
            <span style={{ width:20, height:2, background: mobileMenuOpen ? '#C9972B' : '#1A1A1A', borderRadius:2, display:'block', transition:'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU DRAWER ─────────────────────────── */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 199, background: 'rgba(0,0,0,0.4)',
        }} onClick={() => setMobileMenuOpen(false)}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '75%', maxWidth: 300,
            background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInLeft 0.25s ease',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '20px 20px', borderBottom: '1px solid #F0F0F0',
              display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/assets/cashewlogo.png" alt="" style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover' }}
                onError={e => e.target.style.display='none'} />
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#1A1A1A' }}>CashewHub</div>
                <div style={{ fontSize:10, color:'#C9972B', fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>Premium Quality Nuts</div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{
                marginLeft:'auto', background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9CA3AF',
              }}>×</button>
            </div>

            {/* Nav Links */}
            <div style={{ flex:1, padding: '16px 0', overflowY:'auto' }}>
              {NAV_LINKS.map(link => (
                <button key={link.label} onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                  style={{
                    width:'100%', textAlign:'left', background:'none', border:'none',
                    padding:'14px 24px', fontSize:15, fontWeight:600, color:'#1A1A1A',
                    cursor:'pointer', borderBottom:'1px solid #F8F8F8',
                    display:'flex', alignItems:'center', gap:12,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='#FDF8F3'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  {link.label}
                </button>
              ))}

              <div style={{ padding:'16px 24px', borderTop:'1px solid #F0F0F0', marginTop:8 }}>
                {user?.name ? (
                  <>
                    <div style={{ fontSize:13, color:'#9CA3AF', marginBottom:12 }}>
                      Logged in as <strong style={{ color:'#1A1A1A' }}>{user.name}</strong>
                    </div>
                    <button onClick={() => { navigate('/home/orders'); setMobileMenuOpen(false); }}
                      style={{ width:'100%', textAlign:'left', background:'none', border:'none',
                        padding:'10px 0', fontSize:14, fontWeight:600, color:'#1A1A1A', cursor:'pointer' }}>
                      📦 My Orders
                    </button>
                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      style={{ width:'100%', textAlign:'left', background:'none', border:'none',
                        padding:'10px 0', fontSize:14, fontWeight:600, color:'#DC2626', cursor:'pointer' }}>
                      🚪 Logout
                    </button>
                  </>
                ) : (
                  <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                    style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#C9972B,#F5C842)',
                      border:'none', borderRadius:10, fontSize:14, fontWeight:700, color:'#1a0a00', cursor:'pointer' }}>
                    Login / Register
                  </button>
                )}
              </div>
            </div>

            {/* Contact */}
            <div style={{ padding:'16px 24px', borderTop:'1px solid #F0F0F0',
              background:'#FDF8F3' }}>
              <a href="tel:+916382535757" style={{ display:'flex', alignItems:'center', gap:8,
                fontSize:13, color:'#1A1A1A', textDecoration:'none', fontWeight:600 }}>
                📞 +91 63825 35757
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @media (max-width: 900px) {
          .ch-hamburger { display: flex !important; }
          .ch-nav { display: none !important; }
          .ch-search { display: none !important; }
          .ch-icon-btn { display: none !important; }
          .ch-header {
            grid-template-columns: auto 1fr auto !important;
            padding: 0 16px !important;
            height: 60px !important;
          }
        }
        @media (max-width: 540px) {
          .ch-header__brand-tag { display: none !important; }
          .ch-header__brand-name { font-size: 16px !important; }
          .ch-header__logo { width: 36px !important; height: 36px !important; }
        }
      `}</style>

      {/* Page content — search value passed via outlet context */}
      <Outlet context={{ search }} />

      {/* Cart Drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      {/* Footer */}
      <footer style={{ background:'#1a0a00', padding:'clamp(28px,5vw,48px) clamp(16px,4vw,48px) 28px', marginTop:'auto' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:36 }}>
            {/* Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <img src="/assets/cashewlogo.png" alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }}
                  onError={e => e.target.style.display='none'} />
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#fff' }}>CashewHub</div>
                  <div style={{ fontSize:10, color:'#F5C842', fontWeight:600, textTransform:'uppercase', letterSpacing:1.5 }}>Premium Quality Nuts</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.8, marginBottom:20, maxWidth:260 }}>
                Farm-fresh premium cashews from Panruti, Tamil Nadu. Direct from farms, freshly packed and delivered.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <a href="https://wa.me/916382535757" target="_blank" rel="noreferrer"
                  style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, textDecoration:'none', transition:'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(37,211,102,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                >💬</a>
                <a href="mailto:cashewhub@gmail.com"
                  style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, textDecoration:'none', transition:'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(201,151,43,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                >📧</a>
                <a href="tel:+916382535757"
                  style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, textDecoration:'none', transition:'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(201,151,43,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                >📞</a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ fontSize:12, fontWeight:700, color:'#F5C842', textTransform:'uppercase',
                letterSpacing:1.5, marginBottom:16 }}>Quick Links</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[['Home','/home'],['Shop','/home/shop'],['About Us','/home/about'],['Our Process','/home/processing'],['Contact','/home/contact']].map(([lbl,path]) => (
                  <button key={lbl} onClick={() => navigate(path)} style={{
                    background:'none', border:'none', cursor:'pointer', textAlign:'left',
                    fontSize:13, color:'rgba(255,255,255,0.55)', padding:0, transition:'color 0.2s',
                  }}
                    onMouseEnter={e => e.target.style.color='#F5C842'}
                    onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.55)'}
                  >{lbl}</button>
                ))}
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 style={{ fontSize:12, fontWeight:700, color:'#F5C842', textTransform:'uppercase',
                letterSpacing:1.5, marginBottom:16 }}>Products</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {['W180 Premium','W320 Classic','Roasted Cashew','Masala Cashew','Broken Cashew'].map(p => (
                  <button key={p} onClick={() => navigate('/home/shop')} style={{
                    background:'none', border:'none', cursor:'pointer', textAlign:'left',
                    fontSize:13, color:'rgba(255,255,255,0.55)', padding:0, transition:'color 0.2s',
                  }}
                    onMouseEnter={e => e.target.style.color='#F5C842'}
                    onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.55)'}
                  >{p}</button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontSize:12, fontWeight:700, color:'#F5C842', textTransform:'uppercase',
                letterSpacing:1.5, marginBottom:16 }}>Contact</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                  📍 Panruti, Tamil Nadu
                </div>
                <a href="tel:+916382535757" style={{ fontSize:13, color:'rgba(255,255,255,0.55)',
                  textDecoration:'none', transition:'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color='#F5C842'}
                  onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.55)'}
                >📞 +91 63825 35757</a>
                <a href="mailto:cashewhub@gmail.com" style={{ fontSize:13, color:'rgba(255,255,255,0.55)',
                  textDecoration:'none', transition:'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color='#F5C842'}
                  onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.55)'}
                >📧 cashewhub@gmail.com</a>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>🕐 9AM – 10PM Daily</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:24,
            display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} CashewHub. All rights reserved.
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
              Made with ❤️ in Panruti, Tamil Nadu
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <WhatsAppButton />
    </div>
  );
}

export default function CustomerLayout() {
  return (
    <CartProvider>
      <Layout />
    </CartProvider>
  );
}
