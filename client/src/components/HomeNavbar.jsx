import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HomeNavbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!localStorage.getItem('userToken'));
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  return (
    <nav className="cf-navbar">
      <div className="cf-navbar-inner">
        <Link to="/" className="cf-logo">
          <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
        </Link>
        <div className="cf-nav-links">
          <a href="#calculator">Calculator</a>
          <a href="#about">About</a>
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
      </div>
    </nav>
  );
}
