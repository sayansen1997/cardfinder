import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CardImage from './CardImage';

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

function parseBenefits(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  if (raw.includes('\n')) return raw.split('\n').map((s) => s.trim()).filter(Boolean);
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function CuratedCardTile({ card, index }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const benefits = parseBenefits(card.key_benefits);
  const displayed = showAll ? benefits : benefits.slice(0, 2);
  const hasMore = benefits.length > 2;

  return (
    <div
      onClick={() => navigate(`/cards/${card.id}`)}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
      }}
    >
      {/* Image wrapper */}
      <div style={{
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            style={{ width: '100%', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
          />
        ) : (
          <CardImage card={card} height={140} />
        )}
      </div>

      {/* Card name */}
      <h4
        onClick={() => navigate(`/cards/${card.id}`)}
        style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, lineHeight: '28px', color: '#001A3D', margin: 0, cursor: 'pointer', transition: 'color 0.2s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#C9920A'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#001A3D'; }}
      >
        {card.name}
      </h4>

      {/* Card category */}
      <div style={{
        color: '#E5A00D',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.6px',
        textTransform: 'uppercase',
        marginTop: '-8px',
      }}>
        {card.category_name || card.card_category}
      </div>

      {/* Benefits list */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayed.map((benefit, j) => (
          <li key={j} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#44474E',
            lineHeight: 1.5,
          }}>
            <span style={{ color: '#C9920A', fontWeight: 700, flexShrink: 0 }}>✓</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowAll((s) => !s); }}
          style={{
            background: 'none',
            border: 'none',
            color: '#C9920A',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
            marginTop: '-8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {showAll ? 'Show less' : `See ${benefits.length - 2} more`}
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* Select Card button */}
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/cards/${card.id}`); }}
        style={{ width: '100%', background: 'white', border: '1.5px solid #0D1B2A', borderRadius: '8px', padding: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#0D1B2A', cursor: 'pointer', transition: 'all 0.15s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#0D1B2A'; e.currentTarget.style.color = 'white'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#0D1B2A'; }}
      >
        View Details
      </button>
    </div>
  );
}

export default function CuratedSection({ cards, loading }) {
  const navigate = useNavigate();
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
            {LIFESTYLE_CATEGORIES.map((cat) => {
              const isActive = activeCat.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat)}
                  style={{
                    width: '100%',
                    background: isActive ? 'white' : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '4px solid #C9920A' : '4px solid transparent',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#0D1B2A' : '#4B5563',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderLeft = '4px solid #C9920A';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderLeft = '4px solid transparent';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="cf-card-tiles">
            {loading ? (
              <div className="cf-loading" style={{ gridColumn: '1 / -1' }}>
                <div className="cf-spinner" />
                <p>Loading cards…</p>
              </div>
            ) : (
              topCards.map((card, i) => (
                <CuratedCardTile key={card.id} card={card} index={i} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
