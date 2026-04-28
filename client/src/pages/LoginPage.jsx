import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';
import './signup.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/users/login`, { email: form.email });
      localStorage.setItem('userToken', res.data.token);
      if (res.data.name) localStorage.setItem('userName', res.data.name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="su-page">
      {/* Left panel */}
      <div className="su-left">
        <div className="su-logo">
          <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
        </div>

        <h1 className="su-heading">
          Find the <span className="su-gold">best credit card</span> for your spending in the UAE.
        </h1>
        <p className="su-tagline">Stop Guessing. Start Saving.</p>

        <div className="su-features">
          <div className="su-feature-item">
            <div className="su-feature-icon">📊</div>
            <div>
              <div className="su-feature-title">Smart Comparisons</div>
              <div className="su-feature-desc">Compare cashback rates, annual fees, and benefits across all UAE credit cards.</div>
            </div>
          </div>
          <div className="su-feature-item">
            <div className="su-feature-icon">💾</div>
            <div>
              <div className="su-feature-title">Save Calculations</div>
              <div className="su-feature-desc">Save your spending profile and results to revisit anytime.</div>
            </div>
          </div>
          <div className="su-feature-item">
            <div className="su-feature-icon">🏆</div>
            <div>
              <div className="su-feature-title">Personalized Rankings</div>
              <div className="su-feature-desc">Get a ranked list of cards tailored to your exact spending patterns.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="su-right">
        <div className="su-form-box">
          <h2 className="su-form-heading">Welcome back</h2>
          <p className="su-form-sub">Sign in to access your saved calculations and personalized rankings.</p>

          <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '12px 14px', border: '1.5px solid #E5E7EB',
                  borderRadius: '8px', fontSize: '14px', outline: 'none',
                  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 14px', border: '1.5px solid #E5E7EB',
                  borderRadius: '8px', fontSize: '14px', outline: 'none',
                  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '16px', marginTop: '-8px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: loading ? '#E0A50B' : '#C9920A',
                border: 'none', borderRadius: '8px', color: 'white',
                fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p className="su-login-line" style={{ marginTop: '20px' }}>
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="su-link-btn" style={{ background: 'none', border: 'none', color: '#C9920A', fontWeight: 600, cursor: 'pointer', fontSize: '14px', textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
