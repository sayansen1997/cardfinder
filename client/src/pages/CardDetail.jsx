import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API = '/api';

export default function CardDetail() {
  const { id } = useParams();
  const [card, setCard] = useState(null);

  useEffect(() => {
    axios.get(`${API}/cards/${id}`).then((res) => setCard(res.data));
  }, [id]);

  if (!card) return <div style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '700px' }}>
      <Link to="/cards" style={{ color: '#e94560', textDecoration: 'none' }}>← All cards</Link>
      <h1 style={{ margin: '1rem 0 0.25rem' }}>{card.name}</h1>
      <p style={{ color: '#555' }}>{card.bank}</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1.5rem 0' }}>
        <tbody>
          <tr><td style={tdStyle}><strong>Annual fee</strong></td><td style={tdStyle}>{parseFloat(card.annual_fee) === 0 ? 'Free for life' : `AED ${card.annual_fee}`}</td></tr>
          <tr><td style={tdStyle}><strong>Min. salary</strong></td><td style={tdStyle}>AED {card.min_salary}</td></tr>
          <tr><td style={tdStyle}><strong>Fee notes</strong></td><td style={tdStyle}>{card.fee_notes}</td></tr>
          <tr><td style={tdStyle}><strong>Key benefits</strong></td><td style={tdStyle}>{card.key_benefits}</td></tr>
          <tr><td style={tdStyle}><strong>Eligibility</strong></td><td style={tdStyle}>{card.eligibility_notes}</td></tr>
        </tbody>
      </table>

      <h3>Cashback rates by category</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Rate</th>
            <th style={thStyle}>Monthly cap (AED)</th>
          </tr>
        </thead>
        <tbody>
          {(card.rates || []).map((r) => (
            <tr key={r.category_id}>
              <td style={tdStyle}>{r.category_name}</td>
              <td style={tdStyle}>{(parseFloat(r.cashback_rate) * 100).toFixed(1)}%</td>
              <td style={tdStyle}>{r.monthly_cap}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {card.apply_link && (
        <a href={card.apply_link} target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.6rem 1.5rem', background: '#e94560', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}>
          Apply Now
        </a>
      )}
    </div>
  );
}

const tdStyle = { border: '1px solid #eee', padding: '0.5rem 0.75rem', fontSize: '0.9rem' };
const thStyle = { ...tdStyle, background: '#f5f5f5', fontWeight: 600 };
