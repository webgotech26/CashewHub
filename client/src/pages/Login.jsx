import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/pages/login.css';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole]             = useState('customer');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setIdentifier('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setError(role === 'admin' ? 'Username is required.' : 'Email is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    setError('');
    setLoading(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    try {
      const res = await api.post('/api/auth/login', {
        identifier: identifier.trim(),
        password,
        role,
      });

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate(user.role === 'admin' ? '/admin/dashboard' : '/home');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
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
          <p className="login-subtitle">Sign in to your account to continue</p>

          {error && (
            <div className="login-error" role="alert">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Role */}
            <div className="login-input-group">
              <label htmlFor="role" className="login-label">Login As</label>
              <select
                id="role"
                value={role}
                onChange={handleRoleChange}
                className="login-select"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Identifier */}
            <div className="login-input-group">
              <label htmlFor="identifier" className="login-label">
                {role === 'admin' ? 'Username' : 'Email Address'}
              </label>
              <input
                id="identifier"
                type={role === 'admin' ? 'text' : 'email'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'admin' ? 'Enter your username' : 'you@example.com'}
                autoComplete={role === 'admin' ? 'username' : 'email'}
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
