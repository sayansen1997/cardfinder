import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Bookmark, GitCompareArrows, ArrowRight, Info } from 'lucide-react';
import CardImage from './CardImage';
import { savePendingCalc, isAuthenticated } from '../utils/calculationGate';

const RANK_LABELS = ['#1 Best Pick', '#2 Runner Up', '#3 Third Place'];

function getBenefits(card) {
  if (card.key_benefits) {
    return card.key_benefits.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
  }
  if (card.cashback_breakdown) {
    return Object.entries(card.cashback_breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '));
  }
  return [];
}

export default function TopResults({ results, hiddenCards = [], hiddenCount = 0, platformMinSalary, spending, income, onRecalculate, onSave }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const [saveState, setSaveState] = useState('idle');
  const [showHiddenDetails, setShowHiddenDetails] = useState(false);

  const handleSave = async () => {
    if (!isAuthenticated()) {
      savePendingCalc({ income, spending, saveAfterAuth: true });
      navigate('/signup');
      return;
    }
    if (!onSave) return;
    setSaveState('saving');
    const ok = await onSave();
    setSaveState(ok ? 'saved' : 'error');
    if (ok) setTimeout(() => setSaveState('idle'), 5000);
  };

  if (!results?.length) {
    return (
      <section className="cf-results-section" id="results-section">
        <div style={{
          maxWidth: '720px',
          margin: '40px auto',
          padding: '40px 32px',
          background: 'white',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#FEF3C7',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Info size={28} color="#92400E" />
          </div>

          <h2 style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '22px',
            fontWeight: 700,
            color: '#0D1B2A',
            margin: '0 0 12px',
          }}>
            No cards match your current profile
          </h2>

          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: 1.6,
            margin: '0 0 24px',
            maxWidth: '440px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            The UAE credit cards available on our platform require a minimum
            monthly income of AED {platformMinSalary ? Number(platformMinSalary).toLocaleString() : '5,000'} or above.
            Try adjusting your income to see eligible cards.
          </p>

          {hiddenCount > 0 && (
            <>
              <div style={{
                background: '#FEF3C7',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'inline-block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#92400E',
                fontWeight: 600,
                marginBottom: '12px',
                cursor: 'pointer',
              }}
                onClick={() => setShowHiddenDetails((v) => !v)}
              >
                {hiddenCount} card{hiddenCount !== 1 ? 's' : ''} hidden — {showHiddenDetails ? 'hide details' : 'see why'}
              </div>

              {showHiddenDetails && (
                <div style={{
                  background: '#FFFBEB',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginTop: '4px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#92400E',
                  textAlign: 'left',
                }}>
                  {hiddenCards.map((c) => (
                    <div key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid #FEF3C7' }}>
                      <strong>{c.name}</strong> — {c.reason}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '24px' }}>
            <button
              onClick={onRecalculate}
              style={{
                background: '#C9920A',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '10px 24px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RotateCw size={16} color="#fff" />
              Adjust & Recalculate
            </button>
          </div>
        </div>
      </section>
    );
  }

  const top3 = results.slice(0, 3);
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const today = new Date().toLocaleDateString('en-GB');
  const formatUpdatedAt = (ts) => ts ? new Date(ts).toLocaleDateString('en-GB') : today;

  return (
    <section className="cf-results" id="results-section">
      <div className="cf-container">
        {/* ── Section header ── */}
        <div className="cf-top-results-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '24px',
          marginBottom: '32px',
        }}>
          <div>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              color: '#C9920A',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 8px',
            }}>
              Your Result
            </p>
            <h2 style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '32px',
              fontWeight: 800,
              color: 'white',
              margin: '0 0 8px',
            }}>
              Your Top 3 Card Recommendations
            </h2>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#94A3B8',
              lineHeight: 1.5,
              margin: 0,
            }}>
              Based on your monthly spending profile, these cards offer the highest net value after fees.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
            <div className="cf-top-results-actions" style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={saveState === 'saving' || saveState === 'saved'}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: saveState === 'saving' || saveState === 'saved' ? 'default' : 'pointer',
                  opacity: saveState === 'saving' || saveState === 'saved' ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {saveState === 'saving' ? 'Saving…'
                  : saveState === 'saved' ? '✓ Saved!'
                  : saveState === 'error' ? 'Try Again'
                  : <><Bookmark size={16} color="#FFBD49" /> Save Results</>}
              </button>
              <button
                onClick={onRecalculate}
                style={{
                  background: '#C9920A',
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <RotateCw size={16} color="#fff" />
                Recalculate
              </button>
            </div>
            {saveState === 'saved' && (
              <span style={{ fontSize: '13px', color: '#4ade80' }}>
                Results saved!{' '}
                <button
                  style={{ background: 'none', border: 'none', color: '#C9920A', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0 }}
                  onClick={() => navigate('/saved')}
                >
                  View in Saved Calculations <ArrowRight size={14} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                </button>
              </span>
            )}
            {saveState === 'error' && (
              <span style={{ fontSize: '13px', color: '#f87171' }}>Failed to save. Please try again.</span>
            )}
          </div>
        </div>

        {/* ── Hidden cards indicator ── */}
        {hiddenCount > 0 && (
          <>
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#92400E',
            }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>{hiddenCount} card{hiddenCount !== 1 ? 's' : ''} filtered based on your profile</span>
              <button
                onClick={() => setShowHiddenDetails((v) => !v)}
                style={{
                  background: 'none', border: 'none', color: '#92400E',
                  textDecoration: 'underline', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '13px', padding: 0,
                }}
              >
                {showHiddenDetails ? 'Hide' : 'See why'}
              </button>
            </div>

            {showHiddenDetails && (
              <div style={{
                background: '#FFFBEB', borderRadius: '8px', padding: '12px 16px',
                marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#92400E',
              }}>
                {hiddenCards.map((c) => (
                  <div key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid #FEF3C7' }}>
                    <strong>{c.name}</strong> — {c.reason}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Cards grid ── */}
        <div className="cf-result-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          alignItems: 'start',
        }}>
          {top3.map((card, i) => {
            const isTop = i === 0;
            const benefits = getBenefits(card);
            const buttonColor = i === 0 ? '#7F5700' : '#011A3D';
            const savingsBoxBg = i === 0 ? '#FEF8E1' : '#F3F4F5';
            const savingsValueColor = i === 0 ? '#C9920A' : '#011B3E';
            return (
              <div key={card.id} className="cf-result-tile" style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                border: isTop ? '2px solid #C9920A' : '1px solid #E5E7EB',
              }}>

                  {/* Image block — grey container with TOP PICK overlay */}
                  <div className="cf-result-tile-image" style={{
                    background: '#F3F4F5',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '12px',
                    position: 'relative',
                  }}>
                    {isTop && (
                      <div style={{
                        position: 'absolute',
                        top: '32px',
                        left: '32px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        zIndex: 1,
                      }}>
                        Top Pick
                      </div>
                    )}
                    <CardImage card={card} height="100%" />
                  </div>

                  {/* Card name + bank */}
                  <div>
                    <button
                      className="cf-result-tile-name"
                      onClick={() => {
                        const params = new URLSearchParams()
                        if (card.net_annual_savings !== undefined) params.append('net_savings', card.net_annual_savings)
                        const qs = params.toString()
                        navigate(`/cards/${card.id}${qs ? '?' + qs : ''}`)
                      }}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 700, lineHeight: '30px', color: '#011B3E', marginBottom: '4px', textAlign: 'left', textDecoration: 'none', transition: 'color 0.2s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#C9920A' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#011B3E' }}
                    >
                      {card.name}
                    </button>
                    <div className="cf-result-tile-bank" style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: '#6B7280',
                      marginBottom: '16px',
                    }}>
                      {card.bank}
                    </div>
                  </div>

                  {/* Net annual savings — cream box */}
                  <div style={{
                    background: savingsBoxBg,
                    borderRadius: '8px',
                    padding: '14px 18px',
                    marginBottom: '16px',
                  }}>
                    <div className="cf-result-tile-subtitle" style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#6B7280',
                      marginBottom: '6px',
                    }}>
                      Estimated Net Annual Savings
                    </div>
                    <div className="cf-result-tile-cashback" style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '24px',
                      fontWeight: 800,
                      color: savingsValueColor,
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                    }}>
                      AED {Number(card.net_annual_savings).toLocaleString()}
                    </div>
                  </div>

                  {/* Annual Fee + Min Income rows */}
                  <div className="cf-result-tile-stats">
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #F3F4F5',
                    }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
                        Annual Fee
                      </span>
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: Number(card.annual_fee) === 0 ? '#10B981' : '#0D1B2A',
                      }}>
                        {Number(card.annual_fee) === 0 ? 'Free' : `AED ${Number(card.annual_fee).toLocaleString()}`}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                    }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
                        Min Income
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#0D1B2A' }}>
                        {Number(card.min_salary).toLocaleString()} AED
                      </span>
                    </div>
                  </div>

                  {/* Benefits list */}
                  {benefits.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', marginBottom: '20px' }}>
                      {benefits.map((benefit, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#C9920A', flexShrink: 0, fontSize: '14px' }}>✓</span>
                          <span style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            color: '#0D1B2A',
                          }}>
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Flex spacer — pushes Apply Now to bottom for equal-height alignment */}
                  <div style={{ flex: 1 }} />

                  {/* Apply Now */}
                  <div className="cf-result-tile-actions">
                  <button
                    onClick={() => {
                      if (card.apply_link) {
                        let url = card.apply_link;
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                          url = 'https://' + url;
                        }
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    disabled={!card.apply_link}
                    style={{
                      width: '100%',
                      background: card.apply_link ? buttonColor : '#D1D5DB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: card.apply_link ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {card.apply_link ? 'Apply Now' : 'Link Coming Soon'}
                  </button>
                  </div>

                  {/* How we calculated this — expandable */}
                  <button
                    onClick={() => toggle(card.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderTop: '1px solid #F3F4F5',
                      color: '#C9920A',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '12px 0',
                      marginTop: '12px',
                    }}
                  >
                    How we calculated this {expanded[card.id] ? '▲' : '▼'}
                  </button>

                  {expanded[card.id] && card.cashback_breakdown && (
                    <div style={{
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      padding: '16px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                    }}>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#0D1B2A',
                        lineHeight: 1.5,
                        margin: '0 0 12px',
                      }}>
                        You'd earn most with this card based on your top spending categories.
                      </p>
                      {Object.entries(card.cashback_breakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, val]) => (
                          <div key={cat} style={{
                            display: 'flex',
                            gap: '8px',
                            lineHeight: 1.5,
                            marginBottom: '8px',
                          }}>
                            <span style={{ color: '#C9920A', flexShrink: 0 }}>•</span>
                            <span style={{ flex: 1, color: '#374151' }}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')} cashback
                            </span>
                            <span style={{ fontWeight: 600, color: '#0D1B2A', flexShrink: 0 }}>
                              AED {Number(val).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #E5E7EB',
                        marginTop: '8px',
                        paddingTop: '8px',
                        fontWeight: 700,
                        color: '#0D1B2A',
                      }}>
                        <span>Total Cashback / yr</span>
                        <span>AED {Number(card.total_annual_cashback).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', padding: '4px 0' }}>
                        <span>Annual Fee</span>
                        <span>− AED {Number(card.annual_fee).toLocaleString()}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        color: '#C9920A',
                        padding: '4px 0',
                      }}>
                        <span>Net Savings</span>
                        <span>AED {Number(card.net_annual_savings).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/compare?cards=${card.id}`)}
                        style={{
                          width: '100%',
                          background: 'white',
                          border: '1px solid #E5E7EB',
                          color: '#0D1B2A',
                          borderRadius: '8px',
                          padding: '12px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginTop: '16px',
                        }}
                      >
                        See full savings breakdown <ArrowRight size={14} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                      </button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    color: '#9CA3AF',
                    textAlign: 'center',
                    marginTop: '16px',
                  }}>
                    Card rewards data last updated {formatUpdatedAt(card.updated_at)}
                  </div>

              </div>
            );
          })}
        </div>

        {/* Compare Cards button */}
        <div style={{ textAlign: 'center', marginTop: '85px', paddingBottom: '20px' }}>
          <button
            className="cf-btn-compare-cards"
            onClick={() => navigate('/compare', {
              state: {
                cardIds: top3.map((c) => c.id),
                spending: spending || {},
                income: income || 0,
                topResults: top3,
              },
            })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <GitCompareArrows size={16} color="#FFBD49" />
            Compare Cards
          </button>
        </div>
      </div>
    </section>
  );
}
