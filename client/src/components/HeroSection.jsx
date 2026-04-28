export default function HeroSection({ onCalculateClick }) {
  return (
    <section className="cf-hero">
      <div className="cf-hero-inner">
        <span className="cf-badge">INTELLIGENCE-DRIVEN SAVINGS</span>
        <h1>
          Find the{' '}
          <span className="gold">best credit card</span>{' '}
          for your spending in the UAE
        </h1>
        <p className="cf-hero-sub">
          Stop guessing. Our algorithm analyzes your spending habits to calculate exact net annual
          savings across top UAE credit cards.
        </p>
        <div className="cf-hero-ctas">
          <button
            className="cf-btn-outline"
            onClick={() =>
              document.getElementById('curated-section')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Browse Cards
          </button>
          <button className="cf-btn-gold" onClick={onCalculateClick}>
            Start Calculating With My Income →
          </button>
        </div>
      </div>
    </section>
  );
}
