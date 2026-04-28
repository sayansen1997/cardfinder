import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../../utils/api';
import './admin.css';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/admin/login`, form);
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/cards');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-page">
      {/* Left panel */}
      <div className="adm-left-panel">
        <div className="adm-logo">
          <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
        </div>

        <h1 className="adm-hero-heading">
          Helping users choose the{' '}
          <span className="adm-gold-text">right credit card</span>
          {' '}for their spending in the UAE.
        </h1>
        <p className="adm-hero-sub">
          Unlock insights into user credit card preferences and spending habits.
        </p>
      </div>

      {/* Right panel */}
      <div className="adm-right-panel">
        <div className="adm-form-container">
          <h2 className="adm-form-heading">Admin Login</h2>
          <p className="adm-form-sub">
            Log in as an admin to oversee credit card management and monitor updates.
          </p>

          <form onSubmit={handleSubmit} className="adm-form">
            <input
              type="email"
              className="adm-input"
              placeholder="admin@cardfinder.ae"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              type="password"
              className="adm-input"
              placeholder="Password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            {error && <p className="adm-error">{error}</p>}
            <button type="submit" className="adm-btn-signin" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
