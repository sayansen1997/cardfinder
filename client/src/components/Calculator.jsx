import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';

const INCOME_BRACKETS = ['5K-10K', '10K-20K', '20K-30K', '30K-50K', '50K+'];

export default function Calculator() {
  const [categories, setCategories] = useState([]);
  const [spending, setSpending] = useState({});
  const [incomeBracket, setIncomeBracket] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/categories`).then((res) => {
      setCategories(res.data);
      const defaults = {};
      res.data.forEach((c) => { defaults[c.name] = ''; });
      setSpending(defaults);
    });
  }, []);

  const handleBracketChange = async (bracket) => {
    setIncomeBracket(bracket);
    if (!bracket) return;
    try {
      const res = await axios.get(`${API}/cards/benchmarks/${bracket}`);
      const filled = {};
      res.data.forEach((b) => { filled[b.category_name] = b.monthly_amount; });
      setSpending((prev) => ({ ...prev, ...filled }));
    } catch {
      // leave manual inputs if benchmark fetch fails
    }
  };

  const handleSpendChange = (name, value) => {
    setSpending((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(spending).forEach(([k, v]) => {
      if (v !== '' && parseFloat(v) >= 0) params.set(k, v);
    });
    navigate(`/results?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
          Monthly income (pre-fill benchmarks)
        </label>
        <select value={incomeBracket} onChange={(e) => handleBracketChange(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}>
          <option value="">— enter spending manually —</option>
          {INCOME_BRACKETS.map((b) => (
            <option key={b} value={b}>{b === '50K+' ? 'AED 50,000+' : `AED ${b.replace('K', ',000').replace('-', ' – ')}`}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {categories.map((cat) => (
          <div key={cat.name}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              {cat.label} (AED/mo)
            </label>
            <input
              type="number" min="0" placeholder="0"
              value={spending[cat.name] ?? ''}
              onChange={(e) => handleSpendChange(cat.name, e.target.value)}
              style={{ padding: '0.4rem', width: '100%', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      <button type="submit" style={{
        marginTop: '1.5rem', padding: '0.7rem 2rem', background: '#e94560',
        color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600
      }}>
        Find Best Cards
      </button>
    </form>
  );
}
