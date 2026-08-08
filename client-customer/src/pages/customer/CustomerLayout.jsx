import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiChevronDown } from 'react-icons/fi';
import { CartProvider, useCart } from '../../context/CartContext';
import { ToastProvider } from '../../context/ToastContext';
import CartDrawer from '../../Components/CartDrawer';
import WhatsAppButton from '../../Components/WhatsAppButton';
import BackToTop from '../../Components/BackToTop';
import InstallAppButton from '../../Components/InstallAppButton';
import { getWishlist } from '../customer/WishlistPage';
import '../../styles/pages/customer.css';

/* -- React-icons aliases (keeps all existing JSX references working) -- */
const IconSearch  = ()              => <FiSearch  size={18} />;
const IconUser    = ()              => <FiUser    size={20} />;
const IconCart    = ()              => <FiShoppingBag size={20} />;
const IconHeart   = ({ filled })    => <FiHeart   size={20} color={filled ? '#C9972B' : 'currentColor'} fill={filled ? '#C9972B' : 'none'} />;
const IconChevron = ()              => <FiChevronDown size={14} />;
const IconOrder   = ()              => <FiShoppingBag size={15} />;
const IconProfile = ()              => <FiUser size={15} />;
const IconLogout  = ()              => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* -- Nav links config ------------------------------------------ */
const NAV_LINKS = [
  { label: 'Home',     path: '/home' },
  { label: 'Shop',     path: '/home/shop' },
  { label: 'About Us', path: '/home/about' },
  { label: 'Contact',  path: '/home/contact' },
];

/* -- Profile Dropdown ------------------------------------------ */
function ProfileDropdown({ user, onLogout, onNavigate }) {
  const initials    = (user.name || user.email || 'C').charAt(0).toUpperCase();
  const displayName = user.name  || 'Customer';
  const email       = user.email || '';

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const menuItems = [
    {
      icon: <IconOrder />,
      label: 'My Orders',
      sub: 'Track & manage orders',
      path: '/home/orders',
    },
    {
      icon: <IconProfile />,
      label: 'My Profile',
      sub: 'Account settings',
      path: '/home/profile',
    },
  ];

  return (
    <div className="ch-profile-dropdown">

      {/* -- Welcome header -- */}
      <div className="ch-pd-header">
        <div className="ch-pd-avatar">{initials}</div>
        <div className="ch-pd-identity">
          <span className="ch-pd-greeting">{greeting} 👋</span>
          <p className="ch-pd-name">{displayName}</p>
          {email && <p className="ch-pd-email">{email}</p>}
        </div>
      </div>

      {/* -- Nav items -- */}
      <div className="ch-pd-body">
        {menuItems.map(item => (
          <button
            key={item.label}
            className="ch-pd-item"
            onClick={() => onNavigate(item.path)}
          >
            <span className="ch-pd-item__icon">{item.icon}</span>
            <span className="ch-pd-item__text">
              <span className="ch-pd-item__label">{item.label}</span>
              <span className="ch-pd-item__sub">{item.sub}</span>
            </span>
            <span className="ch-pd-item__arrow">›</span>
          </button>
        ))}
      </div>

      {/* -- Divider -- */}
      <div className="ch-pd-divider" />

      {/* -- Logout -- */}
      <div className="ch-pd-footer">
        <button className="ch-pd-logout" onClick={onLogout}>
          <IconLogout />
          Sign out
        </button>
      </div>

    </div>
  );
}

/* -- Main Layout ----------------------------------------------- */
function Layout() {
  const navigate = useNavigate();
  const [cartOpen, setCartOpen]             = useState(false);
  const [search, setSearch]                 = useState('');
  const [profileOpen, setProfileOpen]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef                          = useRef(null);
  const hoverTimerRef                       = useRef(null);
  const { cartCount }                       = useCart();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  /* Wishlist count � stays in sync across all tabs via storage event */
  const [wishlistCount, setWishlistCount] = useState(() => getWishlist().length);
  useEffect(() => {
    const sync = () => setWishlistCount(getWishlist().length);
    window.addEventListener('wishlist-change', sync);
    return () => window.removeEventListener('wishlist-change', sync);
  }, []);

  /* Detect touch devices � hover becomes click on touch screens */
  const isTouchDevice = () =>
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  /* -- Hover handlers (desktop only) -- */
  const handleProfileMouseEnter = () => {
    if (isTouchDevice()) return;
    clearTimeout(hoverTimerRef.current);
    setProfileOpen(true);
  };

  const handleProfileMouseLeave = () => {
    if (isTouchDevice()) return;
    /* Small delay so the user can move the cursor into the dropdown */
    hoverTimerRef.current = setTimeout(() => setProfileOpen(false), 150);
  };

  /* -- Click handler (touch / mobile fallback) -- */
  const handleProfileClick = () => {
    if (!isTouchDevice()) return;
    setProfileOpen(v => !v);
  };

  /* Close on outside click (touch devices) */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      clearTimeout(hoverTimerRef.current);
    };
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

      {/* ----------------------------------------------------------
          PREMIUM HEADER � 3-column layout
          LEFT: Logo   CENTER: Nav   RIGHT: Search + Profile + Cart
         ---------------------------------------------------------- */}
      <header className="ch-header">

        {/* -- LEFT: Brand — Link to home -------------------- */}
        <Link to="/home" className="ch-header__brand" style={{ textDecoration: 'none' }}>
          <div className="ch-header__logo-wrap">
            <img
              src="/assets/logoo.png"
              alt="Petrichor Naturals logo"
              className="ch-header__logo"
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="ch-header__brand-text">
            <span className="ch-header__brand-name">Petrichor Naturals</span>
            <span className="ch-header__brand-tag">PREMIUM NATURAL PRODUCTS</span>
          </div>
        </Link>

        {/* -- CENTER: Nav links --------------------------- */}
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

        {/* -- RIGHT: Actions  (order: Search ? Wishlist ? Cart ? Profile ? Hamburger) -- */}
        <div className="ch-header__actions">

          {/* 1. Search pill */}
          <div className="ch-search">
            <span className="ch-search__icon"><IconSearch /></span>
            <input
              type="text"
              className="ch-search__input"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && search.trim()) {
                  e.preventDefault();
                  navigate(`/home/shop?search=${encodeURIComponent(search.trim())}`);
                  setSearch('');
                }
              }}
              aria-label="Search products"
            />
            {/* Clear button — only visible when there is typed text */}
            {search && (
              <button
                className="ch-search__clear"
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* 2. Wishlist button � navigates to /home/wishlist */}
          <button
            className="ch-wishlist-btn"
            onClick={() => navigate('/home/wishlist')}
            aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} item${wishlistCount !== 1 ? 's' : ''}` : ''}`}
          >
            <IconHeart filled={wishlistCount > 0} />
            {wishlistCount > 0 && (
              <span className="ch-wishlist-btn__badge" aria-hidden="true">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </button>

          {/* 3. Cart button */}
          <button
            className="ch-cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label={`Shopping cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
          >
            <IconCart />
            {cartCount > 0 && (
              <span className="ch-cart-btn__dot" aria-hidden="true" />
            )}
          </button>

          {/* 4. Profile button + dropdown */}
          <div
            className="ch-profile-wrap"
            ref={profileRef}
            onMouseEnter={handleProfileMouseEnter}
            onMouseLeave={handleProfileMouseLeave}
          >
            <button
              className={`ch-icon-btn ${profileOpen ? 'ch-icon-btn--active' : ''}`}
              onClick={handleProfileClick}
              aria-label="Account menu"
              aria-expanded={profileOpen}
              aria-haspopup="true"
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

          {/* 5. Hamburger � mobile only */}
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

      {/* -- MOBILE MENU DRAWER --------------------------- */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1100,                    /* above header (1000) */
            background: 'rgba(0,0,0,0.45)',
            WebkitBackdropFilter: 'blur(2px)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: '75%', maxWidth: 300,
              background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column',
              animation: 'slideInLeft 0.25s ease',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F0F0F0',
              display: 'flex', alignItems: 'center', gap: 12,
              flexShrink: 0,
            }}>
              <img
                src="/assets/logoo.png" alt=""
                style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}
                onError={e => e.target.style.display='none'}
              />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:'#1A1A1A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Petrichor Naturals</div>
                <div style={{ fontSize:9, color:'#C9972B', fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>PREMIUM NATURAL PRODUCTS</div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9CA3AF', padding:'4px 6px', lineHeight:1, flexShrink:0 }}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            {/* Nav Links */}
            <div style={{ flex:1, padding: '8px 0', overflowY:'auto' }}>
              {NAV_LINKS.map(link => (
                <button
                  key={link.label}
                  onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                  style={{
                    width:'100%', textAlign:'left', background:'none', border:'none',
                    padding:'14px 24px', fontSize:15, fontWeight:600, color:'#1A1A1A',
                    cursor:'pointer', borderBottom:'1px solid #F8F8F8',
                    display:'flex', alignItems:'center', gap:12,
                    transition:'background 0.15s',
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

            {/* Contact strip */}
            <div style={{ padding:'14px 24px', borderTop:'1px solid #F0F0F0', background:'#FDF8F3', flexShrink:0 }}>
              <a href="tel:+916374139363" style={{ display:'flex', alignItems:'center', gap:8,
                fontSize:13, color:'#1A1A1A', textDecoration:'none', fontWeight:600 }}>
                📞 +91 63741 39363
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
        /* Show hamburger, hide desktop nav/search/profile on mobile */
        @media (max-width: 900px) {
          .ch-hamburger { display: flex !important; }
          .ch-nav        { display: none !important; }
          .ch-search     { display: none !important; }
          .ch-icon-btn   { display: none !important; }
        }
        @media (max-width: 540px) {
          .ch-header__brand-tag  { display: none !important; }
          .ch-header__brand-name { font-size: 15px !important; }
          .ch-header__logo       { width: 34px !important; height: 34px !important; }
        }
      `}</style>

      {/* Page content � search value passed via outlet context */}
      <Outlet context={{ search }} />

      {/* Cart Drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      {/* Footer */}
      <footer style={{ background:'#1a0a00', padding:'clamp(28px,5vw,48px) clamp(16px,4vw,48px) 28px', marginTop:'auto', overflowX:'hidden' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:36 }}>
            {/* Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <img src="/assets/logoo.png" alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }}
                  onError={e => e.target.style.display='none'} />
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#fff' }}>Petrichor Naturals</div>
                  <div style={{ fontSize:10, color:'#F5C842', fontWeight:600, textTransform:'uppercase', letterSpacing:1.5 }}>PREMIUM NATURAL PRODUCTS</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.8, marginBottom:20, maxWidth:260 }}>
                Natural products from India — premium cashews, wood-pressed oils and homemade brownies. Freshly packed and delivered to your door.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <a href="https://wa.me/916374139363?text=Hello%20Petrichor%20Naturals,%20I%20want%20to%20know%20more%20about%20your%20products." target="_blank" rel="noreferrer"
                  style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, textDecoration:'none', transition:'background 0.2s',
                    color:'#fff', lineHeight:1 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(37,211,102,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                  title="WhatsApp"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="mailto:contact.cashewhub@gmail.com"
                  style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, textDecoration:'none', transition:'background 0.2s',
                    color:'#fff', lineHeight:1 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(201,151,43,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                  title="Email"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </a>
                <a href="tel:+916374139363"
                  style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, textDecoration:'none', transition:'background 0.2s',
                    color:'#fff', lineHeight:1 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(201,151,43,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                  title="Call"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ fontSize:12, fontWeight:700, color:'#F5C842', textTransform:'uppercase',
                letterSpacing:1.5, marginBottom:16 }}>Quick Links</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[['Home','/home'],['Shop','/home/shop'],['About Us','/home/about'],['Contact','/home/contact']].map(([lbl,path]) => (
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
                {['Premium Cashew','Roasted Cashew','Wood Pressed Oils','Homemade Brownies'].map(p => (
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
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6, display:'flex', alignItems:'flex-start', gap:8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,200,66,0.7)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, marginTop:2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  India
                </div>
                <a href="tel:+916374139363" style={{ fontSize:13, color:'rgba(255,255,255,0.55)', textDecoration:'none', transition:'color 0.2s', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e => e.currentTarget.style.color='#F5C842'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.55)'}
>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,200,66,0.7)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  +91 63741 39363
                </a>
                <a href="mailto:contact.cashewhub@gmail.com" style={{ fontSize:13, color:'rgba(255,255,255,0.55)', textDecoration:'none', transition:'color 0.2s', display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e => e.currentTarget.style.color='#F5C842'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.55)'}
>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,200,66,0.7)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  contact.cashewhub@gmail.com
                </a>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,200,66,0.7)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  9AM - 10PM Daily
                </div>
              </div>
          </div>

          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:24,
            display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} Petrichor Naturals. All rights reserved.
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
              Made with 🌿 in India
            </p>
          </div>
        </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button — hidden when cart is open */}
      <WhatsAppButton hidden={cartOpen} />

      {/* Back to top */}
      <BackToTop />

      {/* PWA Install prompt — shows after 3s when browser supports A2HS */}
      <InstallAppButton />
    </div>
  );
}

export default function CustomerLayout() {
  return (
    <ToastProvider>
      <CartProvider>
        <Layout />
      </CartProvider>
    </ToastProvider>
  );
}
