import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/pages/register.css';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', password: '', confirmPassword: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        name:     formData.name,
        mobile:   formData.mobile,
        email:    formData.email,
        password: formData.password,
      });

      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* ── Left: brand panel ─────────────────────────── */}
      <div className="register-brand-panel">
        <div className="register-brand-logo">🌰</div>
        <h1 className="register-brand-name">
          Join the <em>Cashew</em><br />Family Today
        </h1>
        <p className="register-brand-sub">
          Create your free account and get access to premium cashews,
          exclusive deals, and seamless order tracking.
        </p>
        <div className="register-brand-steps">
          {[
            ['1', 'Create your account', 'It takes less than 2 minutes'],
            ['2', 'Browse our catalogue', 'Premium cashews & nut products'],
            ['3', 'Place your order',     'Fast delivery to your doorstep'],
          ].map(([num, title, sub]) => (
            <div key={num} className="register-brand-step">
              <div className="register-brand-step__num">{num}</div>
              <div className="register-brand-step__text">
                <strong>{title}</strong>
                {sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form panel ─────────────────────────── */}
      <div className="register-form-panel">
        <div className="register-card">
          <h2 className="register-title">Create your account</h2>
          <p className="register-subtitle">Fill in the details below to get started</p>

          {error && <div className="register-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-input-group">
              <label htmlFor="name" className="register-label">Full Name</label>
              <input id="name" type="text" name="name"
                value={formData.name} onChange={handleChange}
                placeholder="e.g. Priya Sharma" required
                className="register-input" />
            </div>

            <div className="register-input-group">
              <label htmlFor="mobile" className="register-label">Mobile Number</label>
              <input id="mobile" type="tel" name="mobile"
                value={formData.mobile} onChange={handleChange}
                placeholder="+91 98765 43210" required
                className="register-input" />
            </div>

            <div className="register-input-group">
              <label htmlFor="email" className="register-label">Email Address</label>
              <input id="email" type="email" name="email"
                value={formData.email} onChange={handleChange}
                placeholder="you@example.com" required
                className="register-input" />
            </div>

            <div className="register-input-group">
              <label htmlFor="password" className="register-label">Password</label>
              <input id="password" type="password" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Min 6 characters" required
                className="register-input" />
            </div>

            <div className="register-input-group">
              <label htmlFor="confirmPassword" className="register-label">Confirm Password</label>
              <input id="confirmPassword" type="password" name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="Re-enter your password" required
                className="register-input" />
            </div>

            <button type="submit" disabled={loading} className="register-button">
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="register-footer">
            Already have an account?{' '}
            <Link to="/login" className="register-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
