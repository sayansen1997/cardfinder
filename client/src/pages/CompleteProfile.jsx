import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight } from 'lucide-react';
import API_BASE from '../utils/api';

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

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [incomeRange, setIncomeRange] = useState('');
  const [nationality, setNationality] = useState('');
  const [incomeBrackets, setIncomeBrackets] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    if (!stored.id) {
      navigate('/signup');
      return;
    }
    setUser(stored);

    if (stored.income_range && stored.nationality) {
      navigate('/dashboard');
      return;
    }

    axios.get(`${API_BASE}/income-brackets`)
      .then((res) => setIncomeBrackets(res.data))
      .catch((err) => console.error('Failed to load income brackets:', err));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!incomeRange) {
      setError('Please select your monthly income range');
      return;
    }
    if (!nationality) {
      setError('Please select your nationality');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(
        `${API_BASE}/users/me`,
        { income_range: incomeRange, nationality },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...user, income_range: incomeRange, nationality };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(107deg, #001C42 3.39%, #011E45 47.7%, #292E2B 96.49%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      }}>
        <img
          src="/card-finder-logo.svg"
          alt="Card Finder"
          style={{ height: '36px', marginBottom: '24px' }}
        />

        <h1 style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '28px',
          fontWeight: 800,
          color: '#0D1B2A',
          margin: '0 0 8px',
        }}>
          Complete your profile
        </h1>

        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#6B7280',
          margin: '0 0 24px',
          lineHeight: 1.5,
        }}>
          Hi {user.full_name?.split(' ')[0] || 'there'}! Tell us a bit more
          to get personalized credit card recommendations for your spending.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={LABEL_STYLE}>Monthly Income Range *</label>
            <select
              required
              value={incomeRange}
              onChange={(e) => setIncomeRange(e.target.value)}
              style={INPUT_STYLE}
            >
              <option value="">Select your income range...</option>
              {incomeBrackets.map((b) => (
                <option key={b.id || b.label} value={b.label}>{b.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={LABEL_STYLE}>Nationality *</label>
            <select
              required
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              style={INPUT_STYLE}
            >
              <option value="">Select your nationality...</option>
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

          {error && (
            <div style={{
              padding: '12px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: '#C9920A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              marginTop: '8px',
            }}
          >
            {submitting ? 'Saving...' : <><span>Continue to Dashboard</span><ArrowRight size={16} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} /></>}
          </button>
        </form>

        <p style={{
          fontSize: '12px',
          color: '#9CA3AF',
          textAlign: 'center',
          marginTop: '20px',
          marginBottom: 0,
          fontFamily: 'Inter, sans-serif',
        }}>
          You can update these later in your profile.
        </p>
      </div>
    </div>
  );
}
