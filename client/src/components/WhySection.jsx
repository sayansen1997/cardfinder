const WHY_ITEMS = [
  {
    icon: '/Mathematical_Accuracy.svg',
    alt: 'Mathematical Accuracy',
    title: 'Mathematical Accuracy',
    desc: 'Our algorithm calculates exact cashback against your real spending — not marketing estimates. Every dirham is accounted for, including caps and tier thresholds.',
  },
  {
    icon: '/Unbiased_Comparisons.svg',
    alt: 'Unbiased Comparisons',
    title: 'Unbiased Comparisons',
    desc: 'Every active UAE card is ranked on the same formula with the same inputs. No sponsored rankings, no hidden affiliations — just the maths.',
  },
  {
    icon: '/Instant_Eligibility.svg',
    alt: 'Instant Eligibility',
    title: 'Instant Eligibility',
    desc: 'See only the cards you qualify for based on your income. No wasted applications, no hard credit pulls on cards you can\'t get approved for.',
  },
];

export default function WhySection() {
  return (
    <section className="cf-why" id="about">
      <div className="cf-container">
        <h2>Why use Card Finder?</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#94A3B8', textAlign: 'center', maxWidth: '520px', margin: '12px auto 40px auto' }}>
          The UAE credit card market is complex. We simplify it using real numbers, not marketing slogans.
        </p>
        <div className="cf-why-grid">
          {WHY_ITEMS.map((item) => (
            <div key={item.title} className="cf-why-item">
              <div className="cf-why-icon">
                <img src={item.icon} alt={item.alt} style={{ width: '48px', height: '48px' }} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
