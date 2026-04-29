import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../utils/api';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';
import './profile.css';

const NATIONALITIES = [
  'United Arab Emirates',
  'India',
  'Pakistan',
  'Philippines',
  'United Kingdom',
  'United States',
  'Egypt',
  'Jordan',
  'Lebanon',
  'Bangladesh',
  'Sri Lanka',
  'Other',
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [brackets, setBrackets] = useState([]);
  const [incomeRange, setIncomeRange] = useState('');
  const [nationality, setNationality] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('');
  const [avatarSrc, setAvatarSrc] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('userToken');
    if (!t) { navigate('/login'); return; }

    fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${t}` },
    }).then((r) => {
      if (!r.ok) throw new Error('auth');
      return r.json();
    }).then((data) => {
      setUser(data);
      setIncomeRange(data.income_range || '');
      setNationality(data.nationality || '');
    }).catch(() => navigate('/login'));

    fetch(`${API_BASE}/income-brackets`)
      .then((r) => r.json())
      .then((data) => setBrackets(data))
      .catch(() => {});
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
        },
        body: JSON.stringify({ income_range: incomeRange, nationality }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('Save failed:', err);
        showToast(err.error || 'Failed to save', 'error');
        return;
      }
      const data = await res.json();
      setUser((prev) => ({ ...prev, ...data }));
      showToast('Profile updated successfully.');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` },
      });
      if (!res.ok) throw new Error('delete failed');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userName');
      navigate('/');
    } catch {
      showToast('Failed to delete account. Please try again.', 'error');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="pr-page">
        <DashboardNavbar firstName={user?.name || localStorage.getItem('userName') || ''} />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
          Loading…
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="pr-page">
      <DashboardNavbar firstName={user?.name || localStorage.getItem('userName') || ''} />

      {/* Dark top section */}
      <div className="pr-top">
        <div className="pr-inner">
          <p className="pr-breadcrumb">Profile</p>

          <div className="pr-user-row">
            {/* Avatar */}
            <div className="pr-avatar-wrap">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className="pr-avatar" />
                : <div className="pr-avatar-initials">{getInitials(user.name)}</div>
              }
              <div
                className="pr-avatar-upload"
                title="Upload photo"
                onClick={() => fileInputRef.current?.click()}
              >
                📷
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>

            {/* Name + meta */}
            <div className="pr-user-info">
              <h1 className="pr-user-name">{user.name}</h1>
              <div className="pr-user-meta">
                <span className="pr-badge-member">Member</span>
                <span className="pr-verified">✓ Identity Verified</span>
              </div>
            </div>

            {/* CTA */}
            <button className="pr-btn-new" onClick={() => navigate('/dashboard')}>
              Start New Calculation
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pr-content">
        {/* Left card — edit profile */}
        <div className="pr-card pr-card-left">
          {/* Email */}
          <label className="pr-label">Email Address</label>
          <div className="pr-email-row">
            <span className="pr-email-icon">✉️</span>
            <span className="pr-email-val">{user.email}</span>
            <span className="pr-edit-icon">🔒</span>
          </div>

          {/* Income + Nationality */}
          <div className="pr-two-col">
            <div>
              <label className="pr-label">Monthly Income Range</label>
              <select
                className="pr-select"
                value={incomeRange}
                onChange={(e) => setIncomeRange(e.target.value)}
              >
                {brackets.length === 0 && <option value="">Loading…</option>}
                {brackets.map((b) => (
                  <option key={b.id} value={b.label}>{b.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pr-label">Nationality</label>
              <select
                className="pr-select"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              >
                <option value="">Select…</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="pr-btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : '💾 Save Profile Changes'}
          </button>

          {toast && <p className={`pr-toast${toastType === 'error' ? ' error' : ''}`}>{toast}</p>}
        </div>

        {/* Right column — insights card + delete link below */}
        <div className="pr-right-col">
          <div className="pr-card pr-card-right">
            <p className="pr-insights-label">Account Insights</p>

            <div className="pr-insight-row">
              <div className="pr-insight-icon">📅</div>
              <div className="pr-insight-info">
                <span className="pr-insight-sub">Account Created</span>
                <span className="pr-insight-val">{formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="pr-insight-row">
              <div className="pr-insight-icon">📊</div>
              <div className="pr-insight-info">
                <span className="pr-insight-sub">Total Calculations</span>
                <span className="pr-insight-val large">{user.calculations_count ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="pr-delete-wrap">
            <button className="pr-btn-delete" onClick={handleDelete}>
              🗑 Delete Account
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
