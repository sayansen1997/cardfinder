import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = '/api';

export default function LeadForm() {
  const [form, setForm] = useState({ email: '', income_range: '', nationality: '', consent: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.consent) { setError('Please accept the terms.'); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      await axios.post(`${API}/leads`, {
        ...form,
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
      });
      navigate('/thank-you');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <h3 style={{ margin: 0 }}>Get personalised recommendations</h3>
      {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
      <input
        type="email" name="email" placeholder="Email address" required
        value={form.email} onChange={handleChange}
        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <select name="income_range" value={form.income_range} onChange={handleChange} required
        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
        <option value="">Select income range</option>
        <option value="5K-10K">AED 5,000 – 10,000</option>
        <option value="10K-20K">AED 10,000 – 20,000</option>
        <option value="20K-30K">AED 20,000 – 30,000</option>
        <option value="30K-50K">AED 30,000 – 50,000</option>
        <option value="50K+">AED 50,000+</option>
      </select>
      <input
        type="text" name="nationality" placeholder="Nationality (optional)"
        value={form.nationality} onChange={handleChange}
        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
        <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} />
        I agree to be contacted with card offers and updates.
      </label>
      <button type="submit" disabled={loading}
        style={{ padding: '0.6rem', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        {loading ? 'Submitting…' : 'See My Best Cards'}
      </button>
    </form>
  );
}
