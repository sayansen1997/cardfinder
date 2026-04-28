import { Link, useNavigate } from 'react-router-dom';

export default function HomeNavbar() {
  const navigate = useNavigate();
  return (
    <nav className="cf-navbar">
      <div className="cf-navbar-inner">
        <Link to="/" className="cf-logo">
          <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
        </Link>
        <div className="cf-nav-links">
          <a href="#calculator">Calculator</a>
          <a href="#about">About</a>
          <button className="cf-btn-login" onClick={() => navigate('/login')}>Log In</button>
        </div>
      </div>
    </nav>
  );
}
