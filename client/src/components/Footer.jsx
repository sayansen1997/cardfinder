import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="cf-footer">
      <div className="cf-footer-inner">

        {/* Left — copyright + disclaimers */}
        <div className="cf-footer-left">
          <p className="cf-footer-copy">© 2026 Card Finder.</p>
          <p className="cf-footer-disclaimer">
            All other product names, logos, brands or trademarks referred are the property of
            their respective owners. Information presented has been collated from banks and
            publicly available sources.
          </p>
          <p className="cf-footer-disclaimer" style={{ marginBottom: 0 }}>
            The website acts as a technology / information platform and an information
            aggregator. The website does not constitute professions financial advise.
          </p>
        </div>

        {/* Right — nav links */}
        <nav className="cf-footer-nav">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/contact">Contact</Link>
        </nav>

      </div>
    </footer>
  );
}
