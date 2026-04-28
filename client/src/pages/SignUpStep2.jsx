import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';
import './signup.css';

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

function EagleLogo() {
  return (
    <svg width="30" height="24" viewBox="0 0 34 28" fill="none" aria-hidden="true">
      <path
        d="M17 0 L7 9 H1 L7 15 L1 22 L11 18 L15 28 L17 24 L19 28 L23 18 L33 22 L27 15 L33 9 H27 Z"
        fill="#C9920A"
      />
    </svg>
  );
}

const FEATURES = [
  {
    icon: '📊',
    title: 'Smart Comparisons',
    desc: 'Compare cashback rates, annual fees, and benefits across all UAE credit cards in one place.',
  },
  {
    icon: '💾',
    title: 'Save calculations',
    desc: 'Save your spending profile and calculation results to revisit and update anytime.',
  },
  {
    icon: '🏆',
    title: 'Access personalized rankings',
    desc: 'Get a ranked list of cards tailored to your exact spending patterns and income.',
  },
];

export default function SignUpStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = location.state?.name || 'Ahmed';

  const [brackets, setBrackets] = useState([]);
  const [incomeRange, setIncomeRange] = useState('');
  const [nationality, setNationality] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}/income-brackets`)
      .then((res) => {
        setBrackets(res.data);
        if (res.data.length > 0) setIncomeRange(res.data[0].label);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!consent) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/users/demo-register`, {
        name,
        email: 'demo@cardfinder.ae',
        income_range: incomeRange,
        nationality,
      });
      if (res.data.token) {
        localStorage.setItem('userToken', res.data.token);
        localStorage.setItem('userName', res.data.name || name);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="su-page">
      {/* Left panel */}
      <div className="su-left">
        <div className="su-logo">
          <EagleLogo />
          <span className="su-logo-text">
            CARD&nbsp;<span className="su-gold">FINDER</span>
          </span>
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
          <h2 className="su-form-heading">Welcome, {name}!</h2>
          <p className="su-form-sub">
            Just a couple more details to personalise your experience.
          </p>

          <div className="su-field-group">
            <label className="su-field-label">Monthly Income Range</label>
            <div className="su-select-wrap">
              <select
                className="su-field-select"
                value={incomeRange}
                onChange={(e) => setIncomeRange(e.target.value)}
              >
                {brackets.length === 0 && (
                  <option value="">Loading…</option>
                )}
                {brackets.map((b) => (
                  <option key={b.id} value={b.label}>{b.label}</option>
                ))}
              </select>
              <span className="su-select-arrow">▾</span>
            </div>
          </div>

          <div className="su-field-group">
            <label className="su-field-label">Nationality</label>
            <div className="su-select-wrap">
              <select
                className="su-field-select"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              >
                <option value="">Select nationality…</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="su-select-arrow">▾</span>
            </div>
          </div>

          <label className="su-consent">
            <input
              type="checkbox"
              className="su-consent-check"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span className="su-consent-text">
              I agree to the{' '}
              <span className="su-gold-link">Terms of Service</span> and{' '}
              <span className="su-gold-link">Privacy Policy</span>
            </span>
          </label>

          {error && <p className="su-error">{error}</p>}

          <button
            className="su-submit-btn"
            disabled={!consent || !nationality || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Saving…' : 'Complete Registration →'}
          </button>

          <p className="su-secure-note">🔒 Your data is secured</p>
        </div>
      </div>
    </div>
  );
}
