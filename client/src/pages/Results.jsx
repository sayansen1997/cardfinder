import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { calculateRankings } from '../utils/calculator';
import CardTile from '../components/CardTile';
import LeadForm from '../components/LeadForm';

const API = '/api';

export default function Results() {
  const [searchParams] = useSearchParams();
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);

  const spending = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    axios.get(`${API}/cards`).then((res) => {
      setRanked(calculateRankings(spending, res.data));
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Calculating…</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/" style={{ color: '#e94560', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to calculator</Link>
      <h2 style={{ margin: '1rem 0' }}>Best cashback cards for your spending</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {ranked.map((card, i) => (
          <CardTile key={card.id} card={card} rank={i} />
        ))}
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: '2rem' }}>
        <LeadForm />
      </div>
    </div>
  );
}
