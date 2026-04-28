import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav style={{ background: '#1a1a2e', padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '2rem', height: '60px' }}>
      <Link to="/" style={{ color: '#e94560', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none' }}>
        cardfiner.ae
      </Link>
      <Link to="/cards" style={{ color: '#fff', textDecoration: 'none' }}>Cards</Link>
      <Link to="/compare" style={{ color: '#fff', textDecoration: 'none' }}>Compare</Link>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Calculator</Link>
    </nav>
  );
}
