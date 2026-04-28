import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CARD_ART_GRADIENTS = [
  ['#1a3c5e', '#2d6a9f'],
  ['#1b4332', '#2d6a4f'],
  ['#7b1e1e', '#c0392b'],
];

const RANK_LABELS = ['#1 Best Pick', '#2 Runner Up', '#3 Third Place'];

function getGradient(i) {
  const [a, b] = CARD_ART_GRADIENTS[i] ?? CARD_ART_GRADIENTS[0];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function bankInitials(bank = '') {
  return bank
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 4);
}

export default function TopResults({ results, onRecalculate, onSave }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const [saveState, setSaveState] = useState('idle');

  const handleSave = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/signup', { state: { from: 'save-results' } });
      return;
    }
    if (!onSave) return;
    setSaveState('saving');
    const ok = await onSave();
    setSaveState(ok ? 'saved' : 'error');
    if (ok) setTimeout(() => setSaveState('idle'), 5000);
  };

  if (!results?.length) return null;

  const top3 = results.slice(0, 3);

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <section className="cf-results" id="results-section">
      <div className="cf-container">
        <div className="cf-results-header">
          <h2>Your Top 3 Card Recommendations</h2>
          <div className="cf-results-actions">
            <button
              className="cf-btn-secondary"
              onClick={handleSave}
              disabled={saveState === 'saving' || saveState === 'saved'}
            >
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved!' : saveState === 'error' ? 'Try Again' : 'Save Results'}
            </button>
            {saveState === 'saved' && (
              <span style={{ fontSize: '13px', color: '#16a34a' }}>
                Results saved!{' '}
                <button
                  style={{ background: 'none', border: 'none', color: '#C9920A', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0 }}
                  onClick={() => navigate('/saved')}
                >
                  View in Saved Calculations →
                </button>
              </span>
            )}
            {saveState === 'error' && (
              <span style={{ fontSize: '13px', color: '#DC2626' }}>Failed to save. Please try again.</span>
            )}
            <button className="cf-btn-secondary" onClick={onRecalculate}>
              Recalculate
            </button>
          </div>
        </div>

        <div className="cf-result-cards">
          {top3.map((card, i) => (
            <div key={card.id} className={`cf-result-card${i === 0 ? ' featured' : ''}`}>
              <div className="cf-rank-badge">{RANK_LABELS[i]}</div>

              <div
                className="cf-result-card-art"
                style={{ background: getGradient(i) }}
              >
                {bankInitials(card.bank)}
              </div>

              <h4>{card.name}</h4>
              <div className="cf-result-bank">{card.bank}</div>

              <div className="cf-savings-label">ESTIMATED NET ANNUAL SAVINGS</div>
              <div className="cf-savings-value">
                AED {Number(card.net_annual_savings).toLocaleString()}
              </div>

              <div className="cf-result-meta">
                <div className="cf-meta-item">
                  <div className="meta-label">Annual Fee</div>
                  <div className="meta-value">
                    {Number(card.annual_fee) === 0
                      ? 'Free'
                      : `AED ${Number(card.annual_fee).toLocaleString()}`}
                  </div>
                </div>
                <div className="cf-meta-item">
                  <div className="meta-label">Min Income</div>
                  <div className="meta-value">
                    AED {Number(card.min_salary).toLocaleString()}
                  </div>
                </div>
              </div>

              {card.cashback_breakdown && (
                <div className="cf-result-rates">
                  {Object.entries(card.cashback_breakdown)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([cat, val]) => (
                      <div key={cat} className="cf-result-rate-row">
                        <span className="rate-cat">
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                        </span>
                        <span className="rate-pct">AED {Number(val).toLocaleString()} / yr</span>
                      </div>
                    ))}
                </div>
              )}

              <button className="cf-btn-apply">Apply Now</button>

              <button className="cf-how-calc" onClick={() => toggle(card.id)}>
                {expanded[card.id] ? 'Hide calculation ↑' : 'How we calculated this ↓'}
              </button>

              {expanded[card.id] && card.cashback_breakdown && (
                <div className="cf-breakdown">
                  {Object.entries(card.cashback_breakdown).map(([cat, val]) => (
                    <div key={cat} className="cf-breakdown-row">
                      <span>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')} cashback:
                      </span>
                      <span>AED {Number(val).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="cf-breakdown-total">
                    <span>Total Cashback / yr:</span>
                    <span>AED {Number(card.total_annual_cashback).toLocaleString()}</span>
                  </div>
                  <div className="cf-breakdown-total">
                    <span>Annual Fee:</span>
                    <span>− AED {Number(card.annual_fee).toLocaleString()}</span>
                  </div>
                  <div className="cf-breakdown-total" style={{ color: '#16a34a' }}>
                    <span>Net Savings:</span>
                    <span>AED {Number(card.net_annual_savings).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          className="cf-btn-compare-cards"
          onClick={() => navigate('/compare', { state: { cardIds: top3.map((c) => c.id) } })}
        >
          Compare Cards
        </button>
      </div>
    </section>
  );
}
