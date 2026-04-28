import { Link } from 'react-router-dom';

function EagleLogo() {
  return (
    <svg width="28" height="22" viewBox="0 0 34 28" fill="none" aria-hidden="true">
      <path
        d="M17 0 L7 9 H1 L7 15 L1 22 L11 18 L15 28 L17 24 L19 28 L23 18 L33 22 L27 15 L33 9 H27 Z"
        fill="#C9920A"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="cf-footer">
      <div className="cf-footer-inner">
        <Link to="/" className="cf-footer-logo">
          <EagleLogo />
          <span>
            CARD&nbsp;<span style={{ color: '#C9920A' }}>FINDER</span>
          </span>
        </Link>

        <div className="cf-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">Contact</a>
        </div>

        <span className="cf-footer-copy">© 2025 Card Finder</span>
      </div>
    </footer>
  );
}
