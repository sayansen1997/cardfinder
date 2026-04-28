import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="cf-footer">
      <div className="cf-footer-inner">
        <Link to="/" className="cf-footer-logo">
          <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
        </Link>

        <div className="cf-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">Contact</a>
        </div>

        <span className="cf-footer-copy">© 2026 Card Finder</span>
      </div>
    </footer>
  );
}
