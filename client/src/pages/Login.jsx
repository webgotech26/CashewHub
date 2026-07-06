import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/pages/login.css';

export default function Login() {
  const navigate = useNavigate();

  // ── State — no 'role' dropdown needed ───────────────────────────
  const [identifier, setIdentifier] = useState('');   // email or username
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!identifier.trim()) {
      setError('Email or username is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    setError('');
    setLoading(true);

    // Clear any stale session before new login
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    try {
      // ── Send only identifier + password (no role) ────────────────
      // Backend auto-detects role by querying both admins + customers tables
      const res = await api.post('/api/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      const { token, user } = res.data;

      // ── Store token and full user object (role included) ─────────
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // ── Role-based redirection — role comes from DB, not user input
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      {/* ── Left: brand panel ─────────────────────────── */}
      <div className="login-brand-panel">
        <div className="login-brand-logo">🌰</div>
        <h1 className="login-brand-name">
          Premium <em>Cashews</em><br />& Nut Products
        </h1>
        <p className="login-brand-sub">
          Farm-sourced, handpicked cashews delivered fresh. Manage your business
          or shop our catalogue with a single login.
        </p>
        <div className="login-brand-features">
          {[
            ['🚚', 'Free delivery on orders above ₹499'],
            ['✅', '100% natural, no preservatives'],
            ['🔒', 'Secure payments & data'],
            ['⭐', 'Trusted by 500+ customers'],
          ].map(([icon, text]) => (
            <div key={text} className="login-brand-feature">
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form panel ─────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-card">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">
            Sign in with your email or username
          </p>

          {error && (
            <div className="login-error" role="alert">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>

            {/* Email / Username — single field, no role dropdown */}
            <div className="login-input-group">
              <label htmlFor="identifier" className="login-label">
                Email or Username
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or username"
                autoComplete="username email"
                required
                className="login-input"
              />
            </div>

            {/* Password */}
            <div className="login-input-group">
              <label htmlFor="password" className="login-label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="login-input"
              />
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p className="login-footer">
            Don't have an account?{' '}
            <Link to="/register" className="login-link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
