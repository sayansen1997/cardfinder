import { Link } from 'react-router-dom';

export default function ThankYou() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1 style={{ color: '#1a7f37' }}>You're on the list!</h1>
      <p style={{ color: '#555', fontSize: '1.1rem', maxWidth: '400px', margin: '1rem auto' }}>
        We'll send you the best card matches for your spending profile shortly.
      </p>
      <Link to="/" style={{
        display: 'inline-block', marginTop: '1.5rem', padding: '0.6rem 1.5rem',
        background: '#e94560', color: '#fff', borderRadius: '4px', textDecoration: 'none'
      }}>
        Back to Home
      </Link>
    </div>
  );
}
