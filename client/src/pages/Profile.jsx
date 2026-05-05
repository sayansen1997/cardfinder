import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Trash2, Lock, Calendar, BarChart3, Save, RotateCw } from 'lucide-react';
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
  const [fullName, setFullName] = useState('');
  const [incomeRange, setIncomeRange] = useState('');
  const [nationality, setNationality] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('');

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
      setFullName(data.full_name || '');
      setIncomeRange(data.income_range || '');
      setNationality(data.nationality || '');
      setProfilePicture(data.profile_picture || '');
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
          Authorization: `Bearer ${localStorage.getItem('userToken')}`,
        },
        body: JSON.stringify({ full_name: fullName, income_range: incomeRange, nationality }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to save', 'error');
        return;
      }
      const data = await res.json();
      setUser((prev) => ({ ...prev, ...data }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...data }));
      window.dispatchEvent(new Event('user-updated'));
      showToast('Profile updated successfully.');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be under 5MB', 'error');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(`${API_BASE}/users/me/profile-picture`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('userToken')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const newUrl = res.data.profile_picture;
      setProfilePicture(newUrl);
      setUser((prev) => ({ ...prev, profile_picture: newUrl }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, profile_picture: newUrl }));
      window.dispatchEvent(new Event('user-updated'));
      showToast('Profile picture updated.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
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
      localStorage.removeItem('user');
      navigate('/');
    } catch {
      showToast('Failed to delete account. Please try again.', 'error');
    }
  };

  const displayInitial = ((fullName || user?.email || 'U')[0]).toUpperCase();

  if (!user) {
    return (
      <div className="pr-page">
        <DashboardNavbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
          Loading…
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="pr-page">
      <DashboardNavbar />

      {/* Dark top section */}
      <div className="pr-top">
        <div className="pr-inner">
          <p className="pr-breadcrumb">Profile</p>

          <div className="pr-user-row">
            {/* Avatar — clickable upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: profilePicture ? 'transparent' : '#C9920A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                title="Click to upload profile picture"
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={fullName || 'Profile'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: 'white', fontFamily: 'Manrope', fontSize: '32px', fontWeight: 800 }}>
                    {displayInitial}
                  </span>
                )}

                {/* Camera overlay on hover */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: (hovering && !uploadingImage) ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}>
                  <Camera size={24} color="white" />
                </div>

                {/* Upload progress overlay */}
                {uploadingImage && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    Uploading…
                  </div>
                )}
              </div>

              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
                Click to upload (max 5MB)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Name + meta */}
            <div className="pr-user-info">
              <h1 className="pr-user-name">{fullName || user.email}</h1>
              <div className="pr-user-meta">
                <span className="pr-badge-member">Member</span>
                <span className="pr-verified">✓ Identity Verified</span>
              </div>
            </div>

            {/* CTA */}
            <button className="pr-btn-new" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RotateCw size={16} color="white" />
              Start New Calculation
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pr-content">
        {/* Left card — edit profile */}
        <div className="pr-card pr-card-left">

          {/* Full Name */}
          <label className="pr-label">Full Name</label>
          <input
            type="text"
            className="pr-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />

          {/* Email — read-only */}
          <label className="pr-label" style={{ marginTop: '16px' }}>Email Address</label>
          <div className="pr-email-row">
            <span className="pr-email-icon">✉️</span>
            <span className="pr-email-val">{user.email}</span>
            <span className="pr-edit-icon"><Lock size={16} color="#94A3B8" /></span>
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {saving ? 'Saving…' : <><Save size={16} color="white" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Save Profile Changes</>}
          </button>

          {toast && <p className={`pr-toast${toastType === 'error' ? ' error' : ''}`}>{toast}</p>}
        </div>

        {/* Right column — insights card + delete link below */}
        <div className="pr-right-col">
          <div className="pr-card pr-card-right">
            <p className="pr-insights-label">Account Insights</p>

            <div className="pr-insight-row">
              <div className="pr-insight-icon"><Calendar size={20} color="#94A3B8" /></div>
              <div className="pr-insight-info">
                <span className="pr-insight-sub">Account Created</span>
                <span className="pr-insight-val">{formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="pr-insight-row">
              <div className="pr-insight-icon"><BarChart3 size={20} color="#94A3B8" /></div>
              <div className="pr-insight-info">
                <span className="pr-insight-sub">Total Calculations</span>
                <span className="pr-insight-val large">{user.calculations_count ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="pr-delete-wrap">
            <button className="pr-btn-delete" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={16} color="#FD2626" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
