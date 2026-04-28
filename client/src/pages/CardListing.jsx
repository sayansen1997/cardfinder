import { useEffect, useState } from 'react';
import axios from 'axios';
import CardTile from '../components/CardTile';

const API = 'http://localhost:5000/api';

export default function CardListing() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/cards`).then((res) => {
      setCards(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading cards…</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>All Cashback Credit Cards in UAE</h1>
      <p style={{ color: '#555', marginBottom: '1.5rem' }}>Compare {cards.length} cashback cards side by side.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
