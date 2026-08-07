import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/pages/login.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/home';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [btnHovered, setBtnHovered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    try {
      const res = await api.post('/api/auth/login', {
        identifier: identifier.trim(),
        password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(redirectTo);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '13px 16px',
    border: `1.5px solid ${focusedField === field ? '#2D6A4F' : '#EDE8E0'}`,
    borderRadius: 12,
    fontSize: 14.5,
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    background: focusedField === field ? '#FFFFFF' : '#FDFAF5',
    color: '#1A1A1A',
    boxSizing: 'border-box',
    boxShadow: focusedField === field
      ? '0 0 0 3px rgba(45,106,79,0.12), 0 2px 8px rgba(45,106,79,0.08)'
      : 'none',
    transition: 'all 0.22s ease',
  });

  return (
    /* Full-screen container — dark panel fills left, form floats over */
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'DM Sans, -apple-system, sans-serif',
      background: '#1A1208',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ════════════════════════════════════════
          LEFT DARK PANEL — fills full screen
          Form card overlaps from the right
         ════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(145deg, #0D0B06 0%, #1A1208 30%, #2D1F0E 60%, #1A1208 100%)',
        zIndex: 0,
      }} />

      {/* Background texture image placeholder — earthy, very low opacity */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/assets/pexels-valeriya-21558697.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.06,
        mixBlendMode: 'overlay',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Amber glow top-right */}
      <div style={{
        position: 'absolute', top: '-100px', right: '30%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,151,43,0.14) 0%, transparent 65%)',
        zIndex: 1, pointerEvents: 'none',
      }} />
      {/* Green organic glow bottom-left */}
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-60px',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,106,79,0.18) 0%, transparent 65%)',
        zIndex: 1, pointerEvents: 'none',
      }} />

      {/* ── LEFT CONTENT ── */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '50%', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 60px 64px 72px',
        flexShrink: 0,
      }}>

        {/* Brand badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          background: 'rgba(201,151,43,0.1)',
          border: '1px solid rgba(201,151,43,0.3)',
          borderRadius: 30,
          padding: '10px 20px 10px 10px',
          marginBottom: 48,
          width: 'fit-content',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 0 0 3px rgba(201,151,43,0.25)',
          }}>
            <img
              src="/assets/logoo.png"
              alt="Petrichor Naturals"
              style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <div style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 15, fontWeight: 800, color: '#F5C842',
            }}>
              Petrichor Naturals
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#4ADE80',
                boxShadow: '0 0 8px rgba(74,222,128,0.9)',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.6 }}>
                Premium Natural Products
              </span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 'clamp(28px,3.2vw,42px)',
          fontWeight: 800, color: '#FFFFFF',
          lineHeight: 1.2, marginBottom: 20,
          letterSpacing: '-0.5px',
        }}>
          Pure From Nature,<br />
          <span style={{
            background: 'linear-gradient(135deg, #F5C842 0%, #C9972B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Delivered To Your Door.
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.9, marginBottom: 40, maxWidth: 340,
        }}>
          Farm-fresh cashews, wood-pressed oils and handmade brownies —
          zero preservatives, zero compromise.
        </p>

        {/* Amber divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, rgba(201,151,43,0.55), rgba(201,151,43,0.15), transparent)',
          marginBottom: 32,
          maxWidth: 340,
        }} />

        {/* Trust bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 360 }}>
          {[
            { symbol: '🌿', title: '100% Natural & Organic — Farm Direct', desc: 'No additives, no preservatives. Ever.' },
            { symbol: '🔒', title: 'Secure Payments & Fast Delivery', desc: 'Razorpay-secured · Free shipping above ₹499' },
            { symbol: '🥇', title: 'Premium Grades W180 to W450', desc: 'Every batch hand-graded for size & freshness.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                background: 'rgba(201,151,43,0.12)',
                border: '1px solid rgba(201,151,43,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17,
              }}>
                {item.symbol}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.35, marginBottom: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div style={{
          marginTop: 48, paddingTop: 22,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          maxWidth: 360,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', lineHeight: 1.6 }}>
            Trusted by <strong style={{ color: 'rgba(255,255,255,0.6)' }}>5,000+</strong> customers<br />
            across India 🌿
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Verified Secure
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['🔐', '✅', '🚚'].map(ic => (
                <span key={ic} style={{ fontSize: 14 }}>{ic}</span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════
          RIGHT: Floating card — OVERLAPS left panel
          negative left margin creates the overlap effect
         ════════════════════════════════════════ */}
      <div className="login-right-col" style={{
        position: 'relative', zIndex: 10,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(32px,6vh,48px) clamp(16px,4vw,48px) clamp(32px,6vh,48px) 0',
        overflowY: 'auto',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>
        {/* The card — glassmorphism + deep shadow + slight left overlap */}
        <div className="login-float-card" style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 28,
          padding: 'clamp(32px,5vh,52px) clamp(24px,4vw,48px)',
          width: '100%',
          maxWidth: 460,
          marginLeft: '-60px',
          marginTop: 'auto',
          marginBottom: 'auto',
          boxShadow: `
            0 0 0 1px rgba(0,0,0,0.04),
            0 4px 6px rgba(0,0,0,0.05),
            0 16px 40px rgba(0,0,0,0.14),
            0 40px 80px rgba(26,10,0,0.18),
            0 0 120px rgba(45,106,79,0.08)
          `,
          border: '1px solid rgba(255,255,255,0.6)',
          position: 'relative',
        }}>
          {/* Top highlight edge — gives "floating glass" feel */}
          <div style={{
            position: 'absolute', top: 0, left: 28, right: 28, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 50%, transparent)',
            borderRadius: 1,
          }} />

          <h2 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 30, fontWeight: 800, color: '#1A1A1A',
            letterSpacing: '-0.5px', marginBottom: 6,
          }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 34, letterSpacing: 0.1 }}>
            Sign in to your Petrichor Naturals account
          </p>

          {error && (
            <div style={{
              background: 'linear-gradient(135deg, #FEF2F2, #FFF5F5)',
              color: '#C0392B', padding: '12px 16px',
              borderRadius: 12, marginBottom: 20,
              fontSize: 13, fontWeight: 500,
              border: '1px solid #FECACA',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }} noValidate>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#4A4A4A', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Email Address
              </label>
              <input
                id="identifier"
                type="email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                style={inputStyle('email')}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#4A4A4A', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  style={{ ...inputStyle('password'), paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 16,
                    color: '#B0B7BF', padding: 0, lineHeight: 1,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#2D6A4F'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#B0B7BF'; }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Premium earthy green button with hover lift */}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                padding: '15px',
                background: loading
                  ? '#94A3B8'
                  : btnHovered
                    ? 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)'
                    : 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                fontSize: 15, fontWeight: 800,
                fontFamily: 'DM Sans, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: 0.4,
                marginTop: 4,
                boxShadow: btnHovered && !loading
                  ? '0 8px 28px rgba(45,106,79,0.45), 0 4px 12px rgba(45,106,79,0.25)'
                  : '0 4px 14px rgba(45,106,79,0.3)',
                transform: btnHovered && !loading ? 'translateY(-2px) scale(1.005)' : 'translateY(0) scale(1)',
                transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{
            textAlign: 'center', marginTop: 28,
            fontSize: 13.5, color: '#9CA3AF',
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#2D6A4F', fontWeight: 700,
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1B4332'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#2D6A4F'; }}
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 860px) {
          .login-container-inner > div:first-child { display: none !important; }
          .login-container-inner { justify-content: center; }
        }
        @media (max-width: 860px) {
          /* Remove the left-overlap margin so card centres properly */
          .login-float-card { margin-left: 0 !important; }
          /* Remove right-offset padding from the column */
          .login-right-col {
            padding: clamp(32px,6vh,48px) clamp(16px,5vw,32px) !important;
            min-height: unset !important;
          }
        }
        @media (max-width: 480px) {
          .login-float-card {
            border-radius: 16px !important;
            padding: 28px 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
