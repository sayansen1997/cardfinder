import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function HomeNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!localStorage.getItem('userToken'));
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      console.log('Scroll Y:', window.scrollY, 'scrolled:', isScrolled);
      setScrolled(isScrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.hn-mobile-menu') && !e.target.closest('.hn-mobile-toggle')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <nav className={`cf-navbar${scrolled ? ' cf-navbar-scrolled' : ''}`}>
      <div className="cf-navbar-inner">
        <Link to="/" className="cf-logo">
          <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
        </Link>

        {/* Desktop links — hidden on mobile via CSS */}
        <div className="cf-nav-links hn-links-desktop">
          <a href="#calculator">Calculator</a>
          <a href="#about">About</a>
          <Link
            to="/cards"
            style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', textDecoration: 'none' }}
          >
            Cards
          </Link>
          {isLoggedIn ? (
            <button className="cf-btn-login" onClick={() => navigate('/dashboard')}>
              My Dashboard
            </button>
          ) : (
            <button className="cf-btn-login" onClick={() => navigate('/login')}>
              Log In
            </button>
          )}
        </div>

        {/* Mobile hamburger button — shown on mobile via CSS */}
        <button
          className="hn-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'none' }}
        >
          {mobileMenuOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
        </button>

        {/* Mobile drawer menu */}
        {mobileMenuOpen && (
          <div className="hn-mobile-menu" style={{
            position: 'fixed',
            top: '68px',
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
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, color: '#001A3D', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}
            >
              Calculator
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, color: '#001A3D', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}
            >
              About
            </a>
            <Link
              to="/cards"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, color: '#001A3D', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}
            >
              Cards
            </Link>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate(isLoggedIn ? '/dashboard' : '/login'); }}
              style={{ background: '#C9920A', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Manrope', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
            >
              {isLoggedIn ? 'My Dashboard' : 'Log In'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
