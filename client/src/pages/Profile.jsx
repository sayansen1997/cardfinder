import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Trash2, Lock, Calendar, BarChart3, Save, RotateCw, AlertTriangle } from 'lucide-react';
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
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
      setDateOfBirth(data.date_of_birth ? data.date_of_birth.split('T')[0] : '');
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
        body: JSON.stringify({ full_name: fullName, income_range: incomeRange, nationality, date_of_birth: dateOfBirth || null }),
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

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account');
      setDeleting(false);
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
          <div className="pr-header-row">

            {/* Left: Profile label stacked above avatar + name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              <p className="pr-breadcrumb" style={{ margin: 0 }}>Profile</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '20px' }}>
                {/* Avatar — clickable upload */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                    style={{
                      position: 'relative',
                      width: '120px',
                      height: '120px',
                      borderRadius: '16px',
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
                      <span style={{ color: 'white', fontFamily: 'Manrope', fontSize: '48px', fontWeight: 800 }}>
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
                      <Camera size={32} color="white" />
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

                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, textAlign: 'left', fontFamily: 'Inter, sans-serif' }}>
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
              </div>
            </div>

            {/* CTA — pushed to the right */}
            <button className="pr-btn-new" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexShrink: 0 }}>
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

          {/* Date of Birth */}
          <label className="pr-label" style={{ marginTop: '16px' }}>
            Date of Birth{' '}
            <span style={{ fontSize: '11px', fontWeight: 400, color: '#94A3B8' }}>(used for card eligibility)</span>
          </label>
          <input
            type="date"
            className="pr-input"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
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
            <button className="pr-btn-delete" onClick={() => setShowDeleteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={16} color="#FD2626" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: '#FEE2E2', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} color="#DC2626" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Manrope', fontSize: '18px', fontWeight: 700, color: '#991B1B', margin: 0 }}>
                  Delete your account?
                </h2>
                <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#991B1B', margin: '2px 0 0', opacity: 0.85 }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px' }}>
              <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#374151', margin: '0 0 16px', lineHeight: 1.5 }}>
                Please review what will happen if you proceed:
              </p>

              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                  What will be permanently lost:
                </p>
                <ul style={{ fontFamily: 'Inter', fontSize: '13px', color: '#7F1D1D', margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
                  <li>All your saved calculations</li>
                  <li>Your profile picture</li>
                  <li>Access to your account</li>
                </ul>
              </div>

              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                  Good to know:
                </p>
                <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#14532D', margin: 0, lineHeight: 1.5 }}>
                  You can sign up again later with the same email and reactivate your account.
                </p>
              </div>

              {deleteError && (
                <div style={{ marginTop: '12px', padding: '10px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px', fontFamily: 'Inter' }}>
                  {deleteError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F3F4F5' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{ background: '#E5E7EB', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ background: '#DC2626', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: 'white', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={16} color="white" />
                {deleting ? 'Deleting…' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
