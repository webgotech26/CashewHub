/**
 * InstallAppButton.jsx
 *
 * Shows a clean "Install App" banner/button when the browser fires
 * `beforeinstallprompt`.  Completely hidden when:
 *   - The app is already installed (standalone mode)
 *   - The browser doesn't support PWA install (e.g. Firefox desktop)
 *   - The user has already dismissed it (stored in localStorage)
 *
 * Renders as:
 *   Mobile  → bottom-of-screen slide-up banner (full width)
 *   Desktop → compact floating pill (bottom-right corner)
 */
import { useState, useEffect } from 'react';
import usePWAInstall from '../hooks/usePWAInstall';

const DISMISSED_KEY = 'pwa_install_dismissed';

export default function InstallAppButton() {
  const { canInstall, promptInstall, isInstalled } = usePWAInstall();
  const [visible,   setVisible]   = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed,  setInstalled]  = useState(false);

  /* Show after a short delay so it doesn't fight the splash screen */
  useEffect(() => {
    if (!canInstall) return;

    /* Respect the "don't show again" preference */
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, [canInstall]);

  /* Nothing to render */
  if (!visible || isInstalled) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const outcome = await promptInstall();
    setInstalling(false);

    if (outcome === 'accepted') {
      setInstalled(true);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    /* Remember the dismissal so we don't pester the user again */
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <>
      {/* ── Mobile: bottom-slide banner ─────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 9000,
          background: 'linear-gradient(135deg, #1A1208 0%, #2D1F0E 100%)',
          borderTop: '1px solid rgba(201,151,43,0.3)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
          /* Slide up animation */
          animation: 'pwaSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
          /* Only shown on mobile — hidden on large screens via media query */
        }}
        className="pwa-banner-mobile"
        role="banner"
        aria-label="Install Petrichor Naturals app"
      >
        {/* App icon */}
        <img
          src="/assets/logoo.png"
          alt="Petrichor Naturals"
          style={{
            width: 48, height: 48,
            borderRadius: 12,
            border: '2px solid rgba(201,151,43,0.4)',
            objectFit: 'cover',
            flexShrink: 0,
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 14, fontWeight: 700,
            color: '#FFFFFF', margin: '0 0 2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            Petrichor Naturals
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Add to Home Screen for faster shopping
          </p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          disabled={installing || installed}
          style={{
            padding: '9px 18px',
            borderRadius: 30,
            border: 'none',
            background: installed
              ? '#16A34A'
              : 'linear-gradient(135deg, #C9972B, #F5C842)',
            color: installed ? '#fff' : '#1a0a00',
            fontSize: 13, fontWeight: 800,
            fontFamily: "'DM Sans', sans-serif",
            cursor: installing || installed ? 'default' : 'pointer',
            flexShrink: 0,
            minWidth: 80,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(201,151,43,0.4)',
          }}
        >
          {installed ? '✓ Done' : installing ? '...' : 'Install'}
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 20, cursor: 'pointer',
            padding: '4px 6px', lineHeight: 1,
            flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          ×
        </button>
      </div>

      {/* ── Desktop: floating pill (bottom-right) ───────────── */}
      <div
        className="pwa-banner-desktop"
        style={{
          position: 'fixed',
          bottom: 28, right: 28,
          zIndex: 9000,
          background: 'linear-gradient(135deg, #1A1208 0%, #2D1F0E 100%)',
          border: '1px solid rgba(201,151,43,0.35)',
          borderRadius: 16,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(201,151,43,0.15)',
          animation: 'pwaSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
          maxWidth: 320,
        }}
        role="complementary"
        aria-label="Install Petrichor Naturals app"
      >
        <img
          src="/assets/logoo.png"
          alt=""
          aria-hidden="true"
          style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: '#fff',
            margin: '0 0 1px',
          }}>
            Install App
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Shop faster, offline support
          </p>
        </div>
        <button
          onClick={handleInstall}
          disabled={installing || installed}
          style={{
            padding: '7px 14px',
            borderRadius: 20,
            border: 'none',
            background: installed ? '#16A34A' : 'linear-gradient(135deg,#C9972B,#F5C842)',
            color: installed ? '#fff' : '#1a0a00',
            fontSize: 12, fontWeight: 800,
            cursor: installing || installed ? 'default' : 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          {installed ? '✓' : installing ? '...' : 'Add'}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Close"
          style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.35)', fontSize: 16,
            cursor: 'pointer', padding: '2px 4px', lineHeight: 1,
            flexShrink: 0, transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes pwaSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* Mobile banner — full width, shown only on small screens */
        .pwa-banner-mobile  { display: flex; }
        .pwa-banner-desktop { display: none; }

        @media (min-width: 640px) {
          .pwa-banner-mobile  { display: none !important; }
          .pwa-banner-desktop { display: flex !important; }
        }

        /* Extra bottom padding on the layout so the banner
           doesn't cover the last footer link on mobile */
        @media (max-width: 639px) {
          .shop-layout {
            padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </>
  );
}
