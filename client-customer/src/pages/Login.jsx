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
      // Redirect back to where they came from, or home if customer
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

  return (
    <div className="login-container">

      {/* ── LEFT: Brand panel ─────────────────────────── */}
      <div className="login-brand-panel" style={{
        backgroundImage: 'url(/assets/pexels-hatdieubaokhanh-com-2155729267-34449058.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        {/* Dark overlay applied via ::before in CSS */}
        <div style={{ position:'relative', zIndex:3, width:'100%' }}>

          {/* Logo + brand */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:52 }}>
            <img
              src="/assets/cashewlogo.png"
              alt="H²B³ Cashew"
              style={{
                width:54, height:54, borderRadius:'50%', objectFit:'cover',
                boxShadow:'0 4px 16px rgba(0,0,0,0.4), 0 0 0 3px rgba(201,151,43,0.4)',
              }}
              onError={e => { e.target.style.display='none'; }}
            />
            <div>
              <div style={{
                fontFamily:"'Playfair Display',serif",
                fontSize:20, fontWeight:800, color:'#fff',
                textShadow:'0 1px 8px rgba(0,0,0,0.3)',
              }}>
                H²B³ Cashew
              </div>
              <div style={{
                fontSize:10, fontWeight:700, color:'rgba(245,200,66,0.9)',
                textTransform:'uppercase', letterSpacing:1.8, marginTop:2,
              }}>
                Fresh Picked. Finest Quality.
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="login-brand-name">
            Farm Fresh<br />
            <em>Cashews</em><br />
            From Panruti
          </h1>

          <p className="login-brand-sub">
            Direct from our farms in Tamil Nadu.
            W180 to W450 grades, roasted and flavoured —
            all freshly packed and delivered.
          </p>

          {/* Trust features */}
          <div className="login-brand-features">
            {[
              ['🚚', 'Free delivery above ₹499'],
              ['✅', '100% natural, no preservatives'],
              ['🔒', 'Secure payments & data'],
              ['📦', 'Fresh packed, fast delivery'],
            ].map(([icon, text]) => (
              <div key={text} className="login-brand-feature">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel ─────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-card">

          {/* Heading */}
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your H²B³ Cashew account</p>

          {/* Error */}
          {error && (
            <div className="login-error" role="alert">
              ⚠ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>

            {/* Email */}
            <div className="login-input-group">
              <label htmlFor="identifier" className="login-label">
                Email Address
              </label>
              <input
                id="identifier"
                type="email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="login-input"
              />
            </div>

            {/* Password */}
            <div className="login-input-group">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <div style={{ position:'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="login-input"
                  style={{ paddingRight: 48, width:'100%', boxSizing:'border-box' }}
                />
                {/* Show / hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{
                    position:'absolute', right:14, top:'50%',
                    transform:'translateY(-50%)',
                    background:'none', border:'none',
                    cursor:'pointer', fontSize:16,
                    color:'#B0B7BF', padding:0, lineHeight:1,
                    transition:'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color='#C9972B'}
                  onMouseLeave={e => e.currentTarget.style.color='#B0B7BF'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          {/* Footer */}
          <p className="login-footer">
            Don't have an account?{' '}
            <Link to="/register" className="login-link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
