import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav style={{ background: '#1a1a2e', padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '2rem', height: '60px' }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
      </Link>
      <Link to="/cards" style={{ color: '#fff', textDecoration: 'none' }}>Cards</Link>
      <Link to="/compare" style={{ color: '#fff', textDecoration: 'none' }}>Compare</Link>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Calculator</Link>
    </nav>
  );
}
