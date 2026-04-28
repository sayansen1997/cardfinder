import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../pages/dashboard.css';

export default function DashboardNavbar({ firstName = 'A' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = (firstName || 'A').charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/signup');
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="db-navbar">
      <div className="db-navbar-inner">
        {/* Logo */}
        <Link to="/" className="db-logo">
          <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
        </Link>

        {/* Center links */}
        <div className="db-nav-links">
          <Link
            to="/dashboard"
            className={`db-nav-link${location.pathname === '/dashboard' ? ' active' : ''}`}
          >
            My Dashboard
          </Link>
          <button
            className="db-nav-link db-nav-btn"
            onClick={() => scrollTo('calculator')}
          >
            Calculator
          </button>
          <Link
            to="/compare"
            className={`db-nav-link${location.pathname === '/compare' ? ' active' : ''}`}
          >
            Compare Cards
          </Link>
          <Link
            to="/saved"
            className={`db-nav-link${location.pathname === '/saved' ? ' active' : ''}`}
          >
            Saved Calculations
          </Link>
        </div>

        {/* Right: avatar + logout */}
        <div className="db-nav-right">
          <div className="db-avatar">{initial}</div>
          <button className="db-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
