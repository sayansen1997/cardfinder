import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { RotateCw, BarChart3, Save, Award } from 'lucide-react';
import API_BASE from '../utils/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import PasswordInput from '../components/PasswordInput';
import { getUTMs, clearUTMs } from '../utils/utm';
import './signup.css';

const FEATURES = [
  {
    icon: <BarChart3 size={24} color="#C9920A" strokeWidth={2} />,
    title: 'Smart Comparisons',
    desc: 'Compare cashback rates, annual fees, and benefits across all UAE credit cards in one place.',
  },
  {
    icon: <Save size={24} color="#C9920A" strokeWidth={2} />,
    title: 'Save calculations',
    desc: 'Save your spending profile and calculation results to revisit and update anytime.',
  },
  {
    icon: <Award size={24} color="#C9920A" strokeWidth={2} />,
    title: 'Access personalized rankings',
    desc: 'Get a ranked list of cards tailored to your exact spending patterns and income.',
  },
];

const INPUT_STYLE = {
  width: '100%',
  padding: '12px',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  background: 'white',
  color: '#0D1B2A',
  colorScheme: 'light',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
};

const LABEL_STYLE = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#0D1B2A',
  marginBottom: '6px',
  display: 'block',
};

export default function SignUpStep1() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    income_range: '',
    nationality: '',
    consent: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [incomeBrackets, setIncomeBrackets] = useState([]);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivateData, setReactivateData] = useState(null);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/income-brackets`)
      .then((res) => setIncomeBrackets(res.data))
      .catch((err) => console.error('Failed to load income brackets:', err));
  }, []);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!form.consent) {
      setError('Please accept the terms to continue');
      return;
    }

    setSubmitting(true);
    try {
      const utms = getUTMs();
      const res = await axios.post(`${API_BASE}/users/register`, {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        date_of_birth: form.date_of_birth || null,
        income_range: form.income_range,
        nationality: form.nationality,
        consent: form.consent,
        ...utms,
      });
      clearUTMs();
      localStorage.setItem('userToken', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.removeItem('cf_calc_count');
      navigate(res.data.reactivated ? '/dashboard?reactivated=true' : '/dashboard');
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.requires_reactivation) {
        setReactivateData({
          deleted_at: err.response.data.deleted_at,
          message: err.response.data.message,
        });
        setShowReactivateModal(true);
        setSubmitting(false);
      } else {
        setError(err.response?.data?.error || 'Registration failed');
        setSubmitting(false);
      }
    }
  };

  const handleConfirmReactivate = async () => {
    setReactivating(true);
    setError('');
    try {
      const utms = getUTMs();
      const res = await axios.post(`${API_BASE}/users/register`, {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        date_of_birth: form.date_of_birth || null,
        income_range: form.income_range,
        nationality: form.nationality,
        consent: form.consent,
        ...utms,
        reactivate: true,
      });
      clearUTMs();
      localStorage.setItem('userToken', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.removeItem('cf_calc_count');
      setShowReactivateModal(false);
      navigate('/dashboard?reactivated=true');
    } catch (err) {
      setError(err.response?.data?.error || 'Reactivation failed');
      setReactivating(false);
      setShowReactivateModal(false);
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
          {FEATURES.map((f) => (
            <div key={f.title} className="su-feature-item">
              <div className="su-feature-icon">{f.icon}</div>
              <div>
                <div className="su-feature-title">{f.title}</div>
                <div className="su-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="su-right">
        <div className="su-form-box">
          <h2 className="su-form-heading">Create your account</h2>
          <p className="su-form-sub">
            Join thousands of users managing their UAE credit cards effectively.
          </p>

          <GoogleSignInButton
            mode="signup"
            onSuccess={(user, profile_complete) => navigate(profile_complete ? '/dashboard' : '/complete-profile')}
            onError={() => setError('Google sign-in failed. Please try again.')}
          />

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '20px 0', color: '#9CA3AF', fontFamily: 'Inter', fontSize: '13px',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            <span>or sign up with email</span>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={LABEL_STYLE}>Full Name *</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="John Doe"
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>
                Date of Birth{' '}
                <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(used for card eligibility)</span>
              </label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={set('date_of_birth')}
                max={new Date().toISOString().split('T')[0]}
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>
                Password *{' '}
                <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(min 8 characters)</span>
              </label>
              <PasswordInput
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                autoComplete="new-password"
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>Confirm Password *</label>
              <PasswordInput
                required
                value={form.confirm_password}
                onChange={set('confirm_password')}
                placeholder="••••••••"
                autoComplete="new-password"
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>Monthly Income Range *</label>
              <select required value={form.income_range} onChange={set('income_range')} style={INPUT_STYLE}>
                <option value="">Select income range...</option>
                {incomeBrackets.map((b) => (
                  <option key={b.id || b.label} value={b.label}>{b.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={LABEL_STYLE}>Nationality</label>
              <select value={form.nationality} onChange={set('nationality')} style={INPUT_STYLE}>
                <option value="">Select nationality...</option>
                <option value="UAE">UAE</option>
                <option value="India">India</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Philippines">Philippines</option>
                <option value="Egypt">Egypt</option>
                <option value="UK">United Kingdom</option>
                <option value="USA">United States</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={form.consent}
                onChange={set('consent')}
                style={{ marginTop: '2px' }}
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" style={{ color: '#C9920A' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" style={{ color: '#C9920A' }}>Privacy Policy</Link>. *
              </span>
            </label>

            {error && (
              <div style={{ padding: '12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '14px', background: '#C9920A',
                color: 'white', border: 'none', borderRadius: '8px',
                fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="su-login-line" style={{ marginTop: '20px' }}>
            Already have an account?{' '}
            <button className="su-link-btn" onClick={() => navigate('/login')}>
              Log in
            </button>
          </p>
        </div>
      </div>

      {showReactivateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '480px', overflow: 'hidden' }}>

            <div style={{ background: '#FEF3C7', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RotateCw size={22} color="#92400E" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Manrope', fontSize: '18px', fontWeight: 700, color: '#92400E', margin: 0 }}>
                  Welcome back!
                </h2>
                <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#92400E', margin: '2px 0 0', opacity: 0.85 }}>
                  We found a previous account
                </p>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#374151', margin: '0 0 16px', lineHeight: 1.5 }}>
                An account with <strong>{form.email}</strong> was previously deleted.
              </p>

              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                  Reactivate to restore:
                </p>
                <ul style={{ fontFamily: 'Inter', fontSize: '13px', color: '#14532D', margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
                  <li>Your account access</li>
                  <li>Your profile information</li>
                </ul>
              </div>

              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                  Note:
                </p>
                <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#7F1D1D', margin: 0, lineHeight: 1.5 }}>
                  Saved calculations and old profile picture will not be restored. Your new password will be set.
                </p>
              </div>
            </div>

            <div style={{ padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F3F4F5' }}>
              <button
                onClick={() => setShowReactivateModal(false)}
                disabled={reactivating}
                style={{ background: '#E5E7EB', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: reactivating ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReactivate}
                disabled={reactivating}
                style={{ background: '#C9920A', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: 'white', cursor: reactivating ? 'not-allowed' : 'pointer', opacity: reactivating ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCw size={16} color="white" />
                {reactivating ? 'Reactivating...' : 'Yes, Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
