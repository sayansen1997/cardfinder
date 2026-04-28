import { Link } from 'react-router-dom';

export default function CardTile({ card, rank }) {
  const fee = parseFloat(card.annual_fee);
  return (
    <div style={{
      border: '1px solid #ddd', borderRadius: '8px', padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      background: rank === 0 ? '#fffbea' : '#fff',
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
    }}>
      {rank !== undefined && (
        <span style={{ fontSize: '0.8rem', color: '#888' }}>#{rank + 1}</span>
      )}
      <h3 style={{ margin: 0, fontSize: '1rem' }}>{card.name}</h3>
      <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>{card.bank}</p>
      {card.netAnnualSavings !== undefined && (
        <div style={{ marginTop: '0.5rem' }}>
          <strong style={{ color: '#1a7f37', fontSize: '1.1rem' }}>
            AED {card.netAnnualSavings.toFixed(0)} net/yr
          </strong>
          <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#555' }}>
            Cashback: AED {card.totalAnnualCashback?.toFixed(0)} — Fee: AED {fee.toFixed(0)}
          </p>
        </div>
      )}
      <p style={{ margin: 0, fontSize: '0.85rem' }}>
        Annual fee: <strong>{fee === 0 ? 'Free for life' : `AED ${fee}`}</strong>
      </p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#777' }}>{card.fee_notes}</p>
      <Link to={`/cards/${card.id}`} style={{
        marginTop: '0.75rem', padding: '0.4rem 1rem', background: '#e94560',
        color: '#fff', borderRadius: '4px', textDecoration: 'none',
        fontSize: '0.85rem', alignSelf: 'flex-start'
      }}>
        View Details
      </Link>
    </div>
  );
}
