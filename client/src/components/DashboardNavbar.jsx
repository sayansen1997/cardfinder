import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../pages/dashboard.css';

export default function DashboardNavbar({ firstName }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('userToken');
      setIsLoggedIn(!!token);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setDisplayName(storedUser.full_name || firstName || localStorage.getItem('userName') || '');
      setProfilePicture(storedUser.profile_picture || null);
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('user-updated', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('user-updated', checkAuth);
    };
  }, [firstName]);

  const initial = (displayName || 'U').charAt(0).toUpperCase();

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
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/');
    window.location.reload();
  };

  const handleCalculatorClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/dashboard') {
      document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/dashboard');
      setTimeout(() => {
        document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
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
          {isLoggedIn && (
            <Link
              to="/dashboard"
              className={`db-nav-link${location.pathname === '/dashboard' ? ' active' : ''}`}
            >
              My Dashboard
            </Link>
          )}
          <button
            className="db-nav-link db-nav-btn"
            onClick={handleCalculatorClick}
          >
            Calculator
          </button>
          <Link
            to="/compare"
            className={`db-nav-link${location.pathname === '/compare' ? ' active' : ''}`}
          >
            Compare Cards
          </Link>
          {isLoggedIn && (
            <Link
              to="/saved"
              className={`db-nav-link${location.pathname === '/saved' ? ' active' : ''}`}
            >
              Saved Calculations
            </Link>
          )}
        </div>

        {/* Right: avatar if logged in, Log In button if not */}
        <div className="db-nav-right">
          {isLoggedIn ? (
            <div style={{ position: 'relative' }} data-avatar-menu>
              <div
                className="db-avatar"
                onClick={() => setShowMenu((prev) => !prev)}
                style={{
                  cursor: 'pointer',
                  background: profilePicture ? 'transparent' : undefined,
                  overflow: 'hidden',
                  padding: 0,
                }}
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  initial
                )}
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
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                background: '#C9920A',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
