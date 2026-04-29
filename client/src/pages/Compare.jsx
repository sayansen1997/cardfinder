import { useEffect, useState } from 'react';
import axios from 'axios';

const API = '/api';

export default function Compare() {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([axios.get(`${API}/cards`), axios.get(`${API}/categories`)]).then(([c, cat]) => {
      setCards(c.data);
      setCategories(cat.data);
    });
  }, []);

  const toggleCard = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const comparing = cards.filter((c) => selected.includes(c.id));

  const getRate = (card, categoryName) => {
    const r = (card.rates || []).find((x) => x.category_name === categoryName);
    return r ? `${(parseFloat(r.cashback_rate) * 100).toFixed(1)}% (cap AED ${r.monthly_cap})` : '—';
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Compare Cards</h1>
      <p style={{ color: '#555' }}>Select up to 3 cards to compare.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        {cards.map((card) => (
          <button key={card.id} onClick={() => toggleCard(card.id)}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer',
              background: selected.includes(card.id) ? '#e94560' : '#eee',
              color: selected.includes(card.id) ? '#fff' : '#333',
              border: 'none', fontSize: '0.85rem'
            }}>
            {card.name}
          </button>
        ))}
      </div>

      {comparing.length >= 2 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Feature</th>
                {comparing.map((c) => <th key={c.id} style={thStyle}>{c.name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Bank</td>
                {comparing.map((c) => <td key={c.id} style={tdStyle}>{c.bank}</td>)}
              </tr>
              <tr>
                <td style={tdStyle}>Annual fee</td>
                {comparing.map((c) => <td key={c.id} style={tdStyle}>{parseFloat(c.annual_fee) === 0 ? 'Free' : `AED ${c.annual_fee}`}</td>)}
              </tr>
              <tr>
                <td style={tdStyle}>Min. salary</td>
                {comparing.map((c) => <td key={c.id} style={tdStyle}>AED {c.min_salary}</td>)}
              </tr>
              {categories.map((cat) => (
                <tr key={cat.name}>
                  <td style={tdStyle}>{cat.label}</td>
                  {comparing.map((c) => <td key={c.id} style={tdStyle}>{getRate(c, cat.name)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const tdStyle = { border: '1px solid #eee', padding: '0.5rem 0.75rem', fontSize: '0.9rem' };
const thStyle = { ...tdStyle, background: '#1a1a2e', color: '#fff', fontWeight: 600 };
