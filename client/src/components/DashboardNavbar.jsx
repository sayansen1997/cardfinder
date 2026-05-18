import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import '../pages/dashboard.css';

export default function DashboardNavbar({ firstName }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  // Close avatar dropdown on outside click
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('[data-avatar-menu]')) setShowMenu(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.db-mobile-menu') && !e.target.closest('.db-mobile-toggle')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('lastCalcResults');
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
    <nav className={`db-navbar${scrolled ? ' db-navbar-scrolled' : ''}`}>
      <div className="db-navbar-inner">
        {/* Logo */}
        <Link to="/" className="db-logo">
          <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
        </Link>

        {/* Center links — hidden on mobile via CSS */}
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
            to="/cards"
            className={`db-nav-link${location.pathname === '/cards' ? ' active' : ''}`}
          >
            Cards
          </Link>
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

        {/* Right side */}
        <div className="db-nav-right">
          {/* Avatar or Log In — always visible */}
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
                    style={{ padding: '10px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F5'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    <User size={16} color="#6B7280" /> View Profile
                  </div>
                  <div
                    onClick={handleLogout}
                    style={{ padding: '10px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#DC2626', borderTop: '1px solid #F3F4F5', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F5'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    <LogOut size={16} color="#DC2626" /> Logout
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{ background: '#C9920A', border: 'none', borderRadius: '8px', padding: '8px 16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: 'white', cursor: 'pointer' }}
            >
              Log In
            </button>
          )}

          {/* Mobile hamburger button — shown on mobile via CSS */}
          <button
            className="db-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'none' }}
          >
            {mobileMenuOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
          </button>
        </div>

        {/* Mobile drawer menu */}
        {mobileMenuOpen && (
          <div className="db-mobile-menu" style={{
            position: 'fixed',
            top: '60px',
            left: 0,
            right: 0,
            background: 'white',
            borderTop: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '20px',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {isLoggedIn && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, color: '#001A3D', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}
              >
                My Dashboard
              </Link>
            )}
            <button
              onClick={(e) => { setMobileMenuOpen(false); handleCalculatorClick(e); }}
              style={{ background: 'none', border: 'none', fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, color: '#001A3D', textAlign: 'left', padding: '12px 0', borderBottom: '1px solid #F3F4F5', cursor: 'pointer' }}
            >
              Calculator
            </button>
            <Link
              to="/cards"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, color: '#001A3D', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}
            >
              Cards
            </Link>
            <Link
              to="/compare"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, color: '#001A3D', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}
            >
              Compare Cards
            </Link>
            {isLoggedIn && (
              <Link
                to="/saved"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, color: '#001A3D', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}
              >
                Saved Calculations
              </Link>
            )}
            {isLoggedIn && (
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, color: '#001A3D', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}
              >
                Profile
              </Link>
            )}
            {isLoggedIn ? (
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                style={{ background: 'none', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Manrope', fontSize: '14px', fontWeight: 700, color: '#DC2626', cursor: 'pointer', marginTop: '8px' }}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                style={{ background: '#C9920A', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Manrope', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
              >
                Log In
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
