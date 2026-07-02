import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { CartProvider, useCart } from '../../context/CartContext';
import CartDrawer from '../../components/CartDrawer';
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
  { label: 'Shop',     scroll: 'products-section' },
  { label: 'About Us', scroll: 'about-section'    },
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
        <IconOrder /> My Profile
      </button>
      <button className="ch-profile-dropdown__item" onClick={() => onNavigate('/home/orders')}>
        <IconOrder /> Order History
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
    // Always navigate home first, then scroll to the section
    navigate('/home');
    setTimeout(() => {
      document.getElementById(link.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
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
            src="/assets/new.jpeg"
            alt="CashewHub logo"
            className="ch-header__logo"
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
        </div>
      </header>

      {/* Page content — search value passed via outlet context */}
      <Outlet context={{ search }} />

      {/* Cart Drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
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
