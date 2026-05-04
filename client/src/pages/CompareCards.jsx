import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CircleCheckBig, RotateCw } from 'lucide-react';
import API_BASE from '../utils/api';
import DashboardNavbar from '../components/DashboardNavbar';
import CardImage from '../components/CardImage';
import CardRankingTable from '../components/CardRankingTable';
import CategoryIcon from '../components/CategoryIcon';
import Footer from '../components/Footer';
import './compare.css';

const SLOT_COLORS = [
  ['#1a3c5e', '#2d6a9f'],
  ['#1b4332', '#2d6a4f'],
  ['#4a148c', '#7b1fa2'],
];
const gradient = (i) =>
  `linear-gradient(135deg, ${SLOT_COLORS[i % 3][0]}, ${SLOT_COLORS[i % 3][1]})`;
const abbr = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();
const fmtAED = (val) =>
  val != null ? `AED ${Number(val).toLocaleString()}` : '—';
const fmtFee = (val) => (Number(val) === 0 ? 'Free' : fmtAED(val));
const parseBenefits = (str) =>
  (str || '').split(',').map((s) => s.trim()).filter(Boolean);

export default function CompareCards() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramId = searchParams.get('cards');
  const [allCards, setAllCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slots, setSlots] = useState([null, null, null]);
  const [compareData, setCompareData] = useState([]);
  const [spending, setSpending] = useState({});
  const [income] = useState(location.state?.income || 0);
  const [topResults] = useState(location.state?.topResults || []);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [rankingData, setRankingData] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(true);

  const slotRowRef = useRef(null);

  /* ——— Close dropdown on outside click ——— */
  useEffect(() => {
    if (openDropdown === null) return;
    const handler = (e) => {
      if (slotRowRef.current && !slotRowRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown]);

  /* ——— Fetch all cards + categories (once on mount) ——— */
  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/cards`),
      axios.get(`${API_BASE}/categories`),
    ]).then(([cardsRes, catsRes]) => {
      const cats = (catsRes.data || []).sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );
      setAllCards(cardsRes.data || []);
      setCategories(cats);

      const defaultSpending = {};
      cats.forEach((c) => {
        defaultSpending[c.name] = Number(c.default_spend) || 0;
      });
      const passedSpending = location.state?.spending;
      setSpending(
        passedSpending && Object.keys(passedSpending).length > 0
          ? passedSpending
          : defaultSpending
      );
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ——— Assign slots when cards load OR paramId changes ——— */
  useEffect(() => {
    if (allCards.length === 0) return;
    const stateIds = location.state?.cardIds || [];
    let initialSlots;
    if (paramId) {
      // explicit card selected — paramId wins so same-page navigation works
      const target = allCards.find((c) => c.id === Number(paramId));
      const rest = allCards
        .filter((c) => c.id !== Number(paramId))
        .sort((a, b) => (a.annual_fee || 0) - (b.annual_fee || 0));
      initialSlots = [target || null, rest[0] || null, rest[1] || null];
    } else if (stateIds.length > 0) {
      const ordered = stateIds.map((id) => allCards.find((c) => c.id === id)).filter(Boolean);
      initialSlots = [ordered[0] || null, ordered[1] || null, ordered[2] || null];
    } else {
      initialSlots = [allCards[0] || null, allCards[1] || null, allCards[2] || null];
    }
    setSlots(initialSlots);
  }, [allCards, paramId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ——— Run compare whenever slots or spending change ——— */
  const runCompare = useCallback(async (currentSlots, currentSpending) => {
    const ids = currentSlots.filter(Boolean).map((c) => c.id);
    if (ids.length === 0) return;
    try {
      const res = await axios.post(`${API_BASE}/compare`, {
        card_ids: ids,
        spending: currentSpending,
      });
      setCompareData(res.data || []);
    } catch (e) {
      // silent
    }
  }, []);

  /* ——— Also load ranking data for CardRankingTable ——— */
  useEffect(() => {
    if (Object.keys(spending).length === 0) return;
    axios
      .post(`${API_BASE}/calculate`, { spending })
      .then((res) => {
        setRankingData(res.data || []);
        setRankingLoading(false);
      })
      .catch(() => setRankingLoading(false));
  }, [spending]);

  useEffect(() => {
    if (slots.every((s) => s === null)) return;
    if (Object.keys(spending).length === 0) return;
    runCompare(slots, spending);
  }, [slots, spending, runCompare]);

  const handleRecalculate = () => {
    navigate('/');
    setTimeout(() => {
      document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSwap = (slotIdx, card) => {
    const next = [...slots];
    next[slotIdx] = card;
    setSlots(next);
    setOpenDropdown(null);
  };

  /* ——— Helpers ——— */
  const getD = (i) => {
    if (!slots[i]) return null;
    return compareData.find((d) => d.id === slots[i].id) || null;
  };

  const getRate = (card, catName) => {
    const rates = (card?.rates || []).filter((r) => r.category_name !== null);
    return rates.find((r) => r.category_name === catName) || null;
  };

  const activeSlots = slots.filter(Boolean);

  return (
    <div className="cc-page">
      <DashboardNavbar />

      <div className="cc-inner">
        {/* ——— Header ——— */}
        <div className="cc-header">
          <div>
            <p className="cc-eyebrow">Card Comparison</p>
            <h1 className="cc-title">Compare Credit Cards</h1>
            <p className="cc-subtitle">
              Considering your monthly spending habits, these credit cards in the UAE provide the best overall value after accounting for fees.
            </p>
          </div>
          <div className="cc-header-actions">
            <button
              className="cc-btn-gold"
              onClick={handleRecalculate}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <RotateCw size={16} color="#fff" />
              Recalculate
            </button>
          </div>
        </div>

        {/* ——— Card slot row ——— */}
        <div className="cc-grid cc-slot-row" ref={slotRowRef}>
          {/* empty label column */}
          <div />

          {[0, 1, 2].map((i) => {
            const card = slots[i];
            const buttonColor = i === 0 ? '#D97706' : '#011A3D';
            const buttonHoverColor = i === 0 ? '#B45309' : '#020F26';
            return (
              <div
                key={i}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  zIndex: openDropdown === i ? 1000 : 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
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
                {/* Card image */}
                <div style={{
                  width: '100%',
                  background: '#F3F4F5',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {card ? (
                    card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.name}
                        style={{ width: '100%', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                      />
                    ) : (
                      <CardImage card={card} height={140} />
                    )
                  ) : (
                    <div style={{
                      height: '140px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9CA3AF',
                      fontSize: '12px',
                    }}>
                      Empty
                    </div>
                  )}
                </div>

                {/* Card name */}
                <h4 style={{
                  color: '#001A3D',
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '18px',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  lineHeight: '28px',
                  margin: 0,
                }}>
                  {card ? card.name : '—'}
                </h4>

                {/* Card category */}
                <div style={{
                  color: '#E5A00D',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: '16px',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  marginTop: '-8px',
                }}>
                  {card?.category_name || card?.card_category || ''}
                </div>

                {/* Swap Card + Top Pick row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onClick={() => setOpenDropdown(openDropdown === i ? null : i)}
                    >
                      ⇄ Swap Card
                    </button>
                    {openDropdown === i && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: 'max(100%, 380px)',
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        padding: '8px',
                        zIndex: 100,
                        maxHeight: '400px',
                        overflowY: 'auto',
                      }}>
                        {allCards.map((ac) => (
                          <button
                            key={ac.id}
                            className={`cc-dd-item${card && card.id === ac.id ? ' active' : ''}`}
                            onClick={() => handleSwap(i, ac)}
                          >
                            <span
                              className="cc-dd-thumb"
                              style={{ background: gradient(allCards.indexOf(ac)) }}
                            >
                              {abbr(ac.name)}
                            </span>
                            <span>
                              {ac.name}
                              <br />
                              <span style={{ color: '#6B7280', fontSize: 11 }}>{ac.bank}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {i === 0 && activeSlots.length > 0 && (
                    <div style={{
                      background: '#FEF3C7',
                      color: '#92400E',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                    }}>
                      Top Pick
                    </div>
                  )}
                </div>

                {/* Apply Now */}
                {card && (
                  <button
                    onClick={() => {
                      if (card.apply_link) {
                        let url = card.apply_link;
                        if (!url.startsWith('http')) url = 'https://' + url;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    style={{
                      width: '100%',
                      background: buttonColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = buttonHoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = buttonColor; }}
                  >
                    Apply Now
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ——— Comparison table ——— */}
        <div className="cc-table-wrap">
          {/* Header row: Key Features label + card names */}
          <div className="cc-trow" style={{ background: '#F3F4F5' }}>
            <div className="cc-section-row-label" style={{ display: 'flex', alignItems: 'center' }}>Key Features</div>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: '#0D1B2A',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
              }}>
                {slots[i]?.name || ''}
              </div>
            ))}
          </div>

          {/* Card Category */}
          <div className="cc-trow">
            <div className="cc-td-label">Card Category</div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="cc-td">
                {slots[i]?.category_name || slots[i]?.card_category || '—'}
              </div>
            ))}
          </div>

          {/* Annual Fees */}
          <div className="cc-trow">
            <div className="cc-td-label">Annual Fee</div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="cc-td" style={{ alignItems: 'flex-start' }}>
                {slots[i] ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>
                      {Number(slots[i].annual_fee) === 0 ? 'Free' : `AED ${Number(slots[i].annual_fee).toLocaleString()}`}
                    </span>
                    {slots[i].fee_notes && (
                      <span style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.4 }}>
                        {slots[i].fee_notes}
                      </span>
                    )}
                  </div>
                ) : '—'}
              </div>
            ))}
          </div>

          {/* Min Income */}
          <div className="cc-trow">
            <div className="cc-td-label">Min. Income</div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="cc-td">
                {slots[i]?.min_salary ? fmtAED(slots[i].min_salary) + '/mo' : '—'}
              </div>
            ))}
          </div>

          {/* Key Benefits */}
          <div className="cc-trow cc-trow-benefits">
            <div className="cc-td-label">Key Benefits</div>
            {[0, 1, 2].map((i) => {
              const benefits = slots[i]
                ? parseBenefits(slots[i].key_benefits)
                : [];
              return (
                <div key={i} className="cc-td" style={{ alignItems: 'flex-start' }}>
                  {benefits.length > 0 ? (
                    <ul className="cc-benefits-list">
                      {benefits.map((b, bi) => (
                        <li key={bi} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <CircleCheckBig size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </div>
              );
            })}
          </div>

          {/* Annual Cashback */}
          <div className="cc-trow">
            <div className="cc-td-label">Annual Cashback</div>
            {[0, 1, 2].map((i) => {
              const d = getD(i);
              return (
                <div key={i} className="cc-td cc-cashback-val">
                  {d ? fmtAED(d.total_annual_cashback) : '—'}
                </div>
              );
            })}
          </div>

          {/* Net Annual Savings */}
          <div className="cc-trow cc-trow-savings">
            <div className="cc-td-label cc-savings-label">
              <div>
                <div style={{
                  color: '#7F5700',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: '17px',
                  textTransform: 'uppercase',
                }}>
                  EST. NET ANNUAL SAVINGS
                </div>
                <div style={{
                  color: '#7F5700',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: '16px',
                  textTransform: 'uppercase',
                }}>
                  After fees &amp; caps
                </div>
              </div>
            </div>
            {[0, 1, 2].map((i) => {
              const d = getD(i);
              return (
                <div key={i} className="cc-td cc-savings-val" style={{
                  color: '#7F5700',
                  fontSize: '30px',
                  fontWeight: 800,
                  lineHeight: '36px',
                }}>
                  {d ? fmtAED(d.net_annual_savings) : '—'}
                </div>
              );
            })}
          </div>

          {/* ——— Breakdown toggle ——— */}
          <button
            className="cc-breakdown-toggle"
            onClick={() => setBreakdownOpen((v) => !v)}
          >
            <span>Cashback Breakdown by Category</span>
            <span className="cc-toggle-arrow">
              {breakdownOpen ? '▲' : '▼'}
            </span>
          </button>

          {breakdownOpen && (
            <>
              {/* Per-category rows */}
              {categories.map((cat) => (
                <div key={cat.id} className="cc-trow cc-breakdown-row">
                  <div className="cc-td-label">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CategoryIcon name={cat.icon} size={20} color="#94A3B8" />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {cat.label || cat.name}
                      </span>
                    </div>
                  </div>
                  {[0, 1, 2].map((i) => {
                    const card = slots[i];
                    const d = getD(i);
                    const rate = card ? getRate(card, cat.name) : null;
                    const annualAmt = d?.cashback_breakdown?.[cat.name];
                    return (
                      <div key={i} className="cc-td cc-rate-cell">
                        {rate ? (
                          <>
                            <span className="cc-rate-pct">
                              {(Number(rate.cashback_rate) * 100).toFixed(1)}%
                            </span>
                            <span className="cc-rate-amt">
                              {annualAmt != null
                                ? `AED ${annualAmt.toLocaleString()} /yr`
                                : '—'}
                            </span>
                          </>
                        ) : (
                          <span className="cc-rate-pct" style={{ color: '#9CA3AF' }}>
                            —
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Subtotal (uncapped) */}
              <div className="cc-trow cc-subtotal-row">
                <div className="cc-td-label">Subtotal (uncapped)</div>
                {[0, 1, 2].map((i) => {
                  const d = getD(i);
                  return (
                    <div key={i} className="cc-td cc-subtotal-val">
                      {d ? fmtAED(d.uncapped_annual_cashback) : '—'}
                    </div>
                  );
                })}
              </div>

              {/* Annual Fee Deduction */}
              <div className="cc-trow">
                <div className="cc-td-label">Annual Fee Deduction</div>
                {[0, 1, 2].map((i) => {
                  const fee = slots[i] ? Number(slots[i].annual_fee) || 0 : null;
                  return (
                    <div key={i} className="cc-td cc-fee-red">
                      {fee != null
                        ? fee === 0
                          ? 'Free'
                          : `− AED ${fee.toLocaleString()}`
                        : '—'}
                    </div>
                  );
                })}
              </div>

              {/* Net Annual Savings (repeat in breakdown) */}
              <div className="cc-trow" style={{ background: '#F0FDF480' }}>
                <div className="cc-td-label cc-savings-label">Net Annual Savings</div>
                {[0, 1, 2].map((i) => {
                  const d = getD(i);
                  return (
                    <div key={i} className="cc-td" style={{
                      color: '#15803D',
                      fontSize: '24px',
                      fontStyle: 'normal',
                      fontWeight: 900,
                      lineHeight: '32px',
                    }}>
                      {d ? fmtAED(d.net_annual_savings) : '—'}
                    </div>
                  );
                })}
              </div>

              {/* Apply Now row */}
              <div className="cc-trow cc-apply-row">
                <div className="cc-td-label" />
                {[0, 1, 2].map((i) => {
                  const btnColor = i === 0 ? '#D97706' : '#011A3D';
                  const btnHover = i === 0 ? '#B45309' : '#020F26';
                  return (
                    <div key={i} className="cc-td cc-apply-td">
                      {slots[i] ? (
                        <button
                          onClick={() => {
                            const link = slots[i].apply_link;
                            if (link) {
                              let url = link;
                              if (!url.startsWith('http')) url = 'https://' + url;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          style={{
                            width: '100%',
                            background: btnColor,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px',
                            fontFamily: 'Manrope, sans-serif',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = btnHover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = btnColor; }}
                        >
                          Apply Now
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <p style={{
          color: '#94A3B8',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontStyle: 'italic',
          fontWeight: 400,
          lineHeight: '15px',
          marginTop: '24px',
        }}>
          Card rewards data last updated 20/01/2026 · Savings estimates are indicative based on your spending inputs · Always verify rates on the bank&apos;s official website
        </p>
      </div>

      <CardRankingTable rankingData={rankingData} loading={rankingLoading} />
      <Footer />
    </div>
  );
}
