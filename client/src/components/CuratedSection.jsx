import { useState } from 'react';

const LIFESTYLE_CATEGORIES = [
  { id: 'groceries',  label: 'Best for Groceries',      sortKey: 'groceries' },
  { id: 'family',     label: 'Everyday Family Saver',   sortKeys: ['groceries', 'dining', 'utilities'] },
  { id: 'travel',     label: 'Travel & Air Miles',       sortKey: 'travel' },
  { id: 'premium',    label: 'Premium Lifestyle',        sortKeys: ['dining', 'shopping', 'travel'] },
  { id: 'minimalist', label: 'Minimalist Cards',         sortByFee: true },
];

const CARD_ART_GRADIENTS = [
  ['#1a3c5e', '#2d6a9f'],
  ['#1b4332', '#2d6a4f'],
  ['#7b1e1e', '#c0392b'],
  ['#1a237e', '#3949ab'],
  ['#4a148c', '#7b1fa2'],
  ['#004d40', '#00695c'],
];

function getGradient(index) {
  const [a, b] = CARD_ART_GRADIENTS[index % CARD_ART_GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function sortCards(cards, category) {
  if (!cards?.length) return [];
  const arr = [...cards];

  if (category.sortByFee) {
    arr.sort((a, b) => Number(a.annual_fee) - Number(b.annual_fee));
  } else if (category.sortKey) {
    arr.sort((a, b) => {
      const ra = a.rates?.find((r) => r.category_name === category.sortKey);
      const rb = b.rates?.find((r) => r.category_name === category.sortKey);
      return (Number(rb?.cashback_rate) || 0) - (Number(ra?.cashback_rate) || 0);
    });
  } else if (category.sortKeys) {
    const score = (card) =>
      category.sortKeys.reduce((sum, key) => {
        const r = card.rates?.find((r) => r.category_name === key);
        return sum + (Number(r?.cashback_rate) || 0);
      }, 0);
    arr.sort((a, b) => score(b) - score(a));
  }

  return arr.slice(0, 3);
}

function parseBenefits(text) {
  return (text || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CuratedSection({ cards, loading }) {
  const [activeCat, setActiveCat] = useState(LIFESTYLE_CATEGORIES[0]);
  const topCards = sortCards(cards, activeCat);

  return (
    <section className="cf-curated" id="curated-section">
      <div className="cf-container">
        <div className="cf-section-header">
          <h2>Curated for Your Lifestyle</h2>
          <p>
            Expertly segmented categories to match the different financial needs of the UAE&apos;s
            high-performing expat community.
          </p>
        </div>

        <div className="cf-curated-layout">
          <div className="cf-category-sidebar">
            {LIFESTYLE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`cf-cat-btn${activeCat.id === cat.id ? ' active' : ''}`}
                onClick={() => setActiveCat(cat)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="cf-card-tiles">
            {loading ? (
              <div className="cf-loading" style={{ gridColumn: '1 / -1' }}>
                <div className="cf-spinner" />
                <p>Loading cards…</p>
              </div>
            ) : (
              topCards.map((card, i) => (
                <div key={card.id} className="cf-card-tile">
                  <div
                    className="cf-card-art"
                    style={{ background: getGradient(i) }}
                  >
                    {card.bank
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 3)}
                  </div>
                  <div className="cf-card-tile-bank">{card.bank}</div>
                  <h4>{card.name}</h4>
                  <ul>
                    {parseBenefits(card.key_benefits).map((benefit, j) => (
                      <li key={j}>{benefit}</li>
                    ))}
                  </ul>
                  <button className="cf-btn-select">Select Card</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
