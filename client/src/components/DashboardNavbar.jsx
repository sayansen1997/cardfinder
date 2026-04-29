import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../pages/dashboard.css';

export default function DashboardNavbar({ firstName = 'A' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = (firstName || 'A').charAt(0).toUpperCase();

  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('[data-avatar-menu]')) setShowMenu(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    navigate('/');
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

        {/* Right: avatar dropdown */}
        <div className="db-nav-right">
          <div style={{ position: 'relative' }} data-avatar-menu>
            <div
              className="db-avatar"
              onClick={() => setShowMenu((prev) => !prev)}
              style={{ cursor: 'pointer' }}
            >
              {initial}
            </div>

            {showMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '8px 0',
                minWidth: '160px',
                zIndex: 100,
              }}>
                <div
                  onClick={() => { navigate('/profile'); setShowMenu(false); }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#374151',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  👤 View Profile
                </div>
                <div
                  onClick={handleLogout}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#DC2626',
                    borderTop: '1px solid #F3F4F5',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  🚪 Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
