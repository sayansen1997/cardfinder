import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CircleCheckBig, RotateCw, Info, Calculator, CheckCircle } from 'lucide-react';
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
  (str || '').split('\n').map((s) => s.trim()).filter(Boolean);

export default function CompareCards() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramId = searchParams.get('cards');
  const paramIds = searchParams.get('ids');
  const token = localStorage.getItem('userToken');
  const [allCards, setAllCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slots, setSlots] = useState([null, null, null]);
  const [compareData, setCompareData] = useState([]);
  const [spending, setSpending] = useState({});
  const [income, setPageIncome] = useState(location.state?.income || 0);
  const [topResults] = useState(location.state?.topResults || []);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [rankingData, setRankingData] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState(0);
  const [mobileSwapOpen, setMobileSwapOpen] = useState(false);
  const [hybridLoading, setHybridLoading] = useState(true);
  const [autoLoadedCards, setAutoLoadedCards] = useState(null);
  const [showAnonymousPrompt, setShowAnonymousPrompt] = useState(false);
  const [hasPersonalizedData, setHasPersonalizedData] = useState(false);

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
        defaultSpending[c.slug] = Number(c.default_spend) || 0;
      });

      let resolvedSpending = null;
      let resolvedIncome = null;

      // Priority 1: React Router state (from TopResults Compare button)
      if (location.state?.spending && Object.keys(location.state.spending).length > 0) {
        resolvedSpending = location.state.spending;
        resolvedIncome = location.state.income || 0;
      } else {
        // Priority 2: sessionStorage (recent manual calc)
        try {
          const stored = sessionStorage.getItem('lastCalcResults');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.spending && Object.keys(parsed.spending).length > 0) {
              resolvedSpending = parsed.spending;
              resolvedIncome = parsed.income || 0;
            }
          }
        } catch (e) { /* ignore */ }
      }

      if (resolvedSpending) {
        setHasPersonalizedData(true);
        setSpending(resolvedSpending);
        if (resolvedIncome) setPageIncome(resolvedIncome);
      } else {
        setSpending(defaultSpending);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ——— Assign slots when cards load OR params change ——— */
  useEffect(() => {
    if (allCards.length === 0) return;
    const stateIds = location.state?.cardIds || [];
    let initialSlots;
    if (paramIds) {
      // ids=topPickId,cardId[,thirdId] — slot 0 is always the locked top pick
      const idArr = paramIds.split(',').map(Number).filter(Boolean);
      const ordered = idArr.map((id) => allCards.find((c) => c.id === id)).filter(Boolean);
      const usedSet = new Set(ordered.map((c) => c.id));
      const remaining = allCards.filter((c) => !usedSet.has(c.id));
      initialSlots = [ordered[0] || null, ordered[1] || null, ordered[2] || remaining[0] || null];
    } else if (paramId) {
      // legacy single-card param — card goes to slot 0 (locked)
      const target = allCards.find((c) => c.id === Number(paramId));
      const rest = allCards
        .filter((c) => c.id !== Number(paramId))
        .sort((a, b) => (a.annual_fee || 0) - (b.annual_fee || 0));
      initialSlots = [target || null, rest[0] || null, rest[1] || null];
    } else if (stateIds.length > 0) {
      const ordered = stateIds.map((id) => allCards.find((c) => c.id === id)).filter(Boolean);
      initialSlots = [ordered[0] || null, ordered[1] || null, ordered[2] || null];
    } else if (autoLoadedCards?.length > 0) {
      const ordered = autoLoadedCards.map((c) => allCards.find((ac) => ac.id === c.id)).filter(Boolean);
      const usedSet = new Set(ordered.map((c) => c.id));
      const remaining = allCards.filter((c) => !usedSet.has(c.id));
      initialSlots = [ordered[0] || null, ordered[1] || null, ordered[2] || remaining[0] || null];
    } else {
      initialSlots = [allCards[0] || null, allCards[1] || null, allCards[2] || null];
    }
    setSlots(initialSlots);
  }, [allCards, paramId, paramIds, autoLoadedCards]); // eslint-disable-line react-hooks/exhaustive-deps

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
      .post(`${API_BASE}/calculate`, { spending, income })
      .then((res) => {
        const data = res.data;
        setRankingData(Array.isArray(data) ? data : (data?.ranking_cards || data?.all_cards || data?.cards || []));
        setRankingLoading(false);
      })
      .catch(() => setRankingLoading(false));
  }, [spending]);

  useEffect(() => {
    if (slots.every((s) => s === null)) return;
    if (Object.keys(spending).length === 0) return;
    runCompare(slots, spending);
  }, [slots, spending, runCompare]);

  /* ——— Auto-calculate for logged-in users with no nav data ——— */
  const autoCalculateForLoggedInUser = async () => {
    try {
      const userRes = await axios.get(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const incomeRange = userRes.data?.income_range;

      const incomeMap = {
        'AED 3,000 - 5,000': 4000,
        'AED 5,000 - 10,000': 7500,
        'AED 10,000 - 15,000': 12500,
        'AED 15,000 - 25,000': 20000,
        'AED 25,000 - 40,000': 32500,
        'AED 40,000 - 60,000': 50000,
        'AED 60,000+': 60000,
        '10k': 10000,
        '15k': 15000,
        '25k': 25000,
        '40k': 40000,
        '60k+': 60000,
      };

      const autoIncome = incomeMap[incomeRange] || 10000;

      const distribution = {
        groceries: 0.12,
        dining: 0.08,
        travel: 0.08,
        fuel: 0.06,
        shopping: 0.12,
        utilities: 0.10,
        car_rental: 0.05,
        online: 0.08,
      };

      const autoSpending = {};
      for (const [cat, pct] of Object.entries(distribution)) {
        autoSpending[cat] = Math.round(autoIncome * pct / 50) * 50;
      }

      const calcRes = await axios.post(
        `${API_BASE}/calculate`,
        { income: autoIncome, spending: autoSpending },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cards = Array.isArray(calcRes.data)
        ? calcRes.data
        : (calcRes.data?.cards || []);

      if (cards.length >= 1) {
        setAutoLoadedCards(cards.slice(0, 3));
      } else {
        setShowAnonymousPrompt(true);
      }
      setHybridLoading(false);
    } catch (err) {
      console.error('Auto-calculate failed:', err);
      setShowAnonymousPrompt(true);
      setHybridLoading(false);
    }
  };

  /* ——— Hybrid loading: spending data → auto-calc → prompt ——— */
  /* URL params alone are NOT enough — spending data is required.       */
  useEffect(() => {
    // Priority 1: location.state carries spending (from Compare button)
    if (location.state?.spending && Object.keys(location.state.spending).length > 0) {
      setHybridLoading(false);
      return;
    }

    // Priority 2: sessionStorage has spending from a recent calc
    try {
      const stored = sessionStorage.getItem('lastCalcResults');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.spending && Object.keys(parsed.spending).length > 0) {
          setAutoLoadedCards(parsed.cards?.slice(0, 3) || null);
          setHybridLoading(false);
          return;
        }
      }
    } catch (e) {
      // ignore parse errors, fall through
    }

    // Priority 3: logged-in user — auto-calc with profile income
    if (token) {
      autoCalculateForLoggedInUser();
      return;
    }

    // Priority 4: anonymous with no spending data — prompt, even if ?ids= is in URL
    setShowAnonymousPrompt(true);
    setHybridLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecalculate = () => {
    navigate('/');
    setTimeout(() => {
      document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSwap = (slotIdx, card) => {
    if (slotIdx === 0) return;
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

  if (hybridLoading) {
    return (
      <div className="cc-page">
        <DashboardNavbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
            Loading…
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (showAnonymousPrompt) {
    return (
      <div className="cc-page">
        <DashboardNavbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ maxWidth: '520px', width: '100%', background: 'white', borderRadius: '16px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF3C7', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={28} color="#92400E" />
            </div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0D1B2A', margin: '0 0 12px' }}>
              Run the calculator first
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', lineHeight: 1.6, margin: '0 0 24px' }}>
              To compare credit cards, please run the cashback calculator first. We'll determine your top pick based on your spending profile.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{ background: '#C9920A', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Go to Calculator
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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

        {/* ——— Mobile tab-based view ——— */}
        <div className="cc-mobile-tabs-view">
          {/* Tab pills */}
          <div className="cc-mobile-tabs">
            {[0, 1, 2].map((i) => {
              const card = slots[i];
              if (!card) return null;
              return (
                <button
                  key={i}
                  className={`cc-mobile-tab${activeMobileTab === i ? ' active' : ''}`}
                  onClick={() => { setActiveMobileTab(i); setMobileSwapOpen(false); }}
                >
                  {card.name.split(' ').slice(0, 2).join(' ')}
                </button>
              );
            })}
          </div>

          {/* Card detail panel */}
          {(() => {
            const card = slots[activeMobileTab];
            const d = getD(activeMobileTab);
            if (!card) return null;
            return (
              <div className="cc-mobile-card-detail">
                {/* Card image */}
                <div className="cc-mobile-card-image">
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
                  ) : (
                    <CardImage card={card} height={120} />
                  )}
                </div>

                {/* Top Pick badge (mobile, slot 0 only) */}
                {activeMobileTab === 0 && (
                  <div style={{
                    display: 'inline-block',
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    marginBottom: '8px',
                  }}>
                    Top Pick
                  </div>
                )}

                {/* Bank label */}
                <p className="cc-mobile-card-bank">{card.bank || card.category_name || ''}</p>

                {/* Card name */}
                <button
                  onClick={() => navigate(`/cards/${card.id}${d ? `?net_savings=${d.net_annual_savings}` : ''}`)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%', display: 'block' }}
                >
                  <h3
                    className="cc-mobile-card-name"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#C9920A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                    style={{ transition: 'color 0.2s ease', cursor: 'pointer', margin: '0 0 16px' }}
                  >
                    {card.name}
                  </h3>
                </button>

                {/* Stats */}
                <div className="cc-mobile-stats">
                  <div className="cc-mobile-stat-row">
                    <span>Annual Fee</span>
                    <span>{Number(card.annual_fee) === 0 ? 'Free' : fmtAED(card.annual_fee)}</span>
                  </div>
                  <div className="cc-mobile-stat-row">
                    <span>Min. Income</span>
                    <span>{card.min_salary ? fmtAED(card.min_salary) + '/mo' : '—'}</span>
                  </div>
                  <div className="cc-mobile-stat-row">
                    <span>Annual Cashback</span>
                    <span>{d ? fmtAED(d.total_annual_cashback) : '—'}</span>
                  </div>
                  <div className="cc-mobile-stat-row cc-mobile-stat-highlight">
                    <span>Est. Net Annual Savings</span>
                    <span>{d ? fmtAED(d.net_annual_savings) : '—'}</span>
                  </div>
                </div>

                {/* Cashback rates */}
                {(card.rates || []).filter((r) => r.category_name).length > 0 && (
                  <div className="cc-mobile-rates">
                    <h4>Cashback Rates</h4>
                    {(card.rates || []).filter((r) => r.category_name).map((r, ri) => (
                      <div key={ri} className="cc-mobile-rate-row">
                        <span>{r.category_name}</span>
                        <span>{(Number(r.cashback_rate) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card Notes */}
                {(() => {
                  const notes = (card?.card_notes || '').split('\n').map((s) => s.trim()).filter(Boolean);
                  if (notes.length === 0) return null;
                  return (
                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 16px', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Info size={14} color="#92400E" />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Important Notes
                        </span>
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {notes.map((note, idx) => (
                          <li key={idx} style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#92400E', lineHeight: 1.4, paddingLeft: '12px', position: 'relative', marginBottom: idx < notes.length - 1 ? '6px' : 0 }}>
                            <span style={{ position: 'absolute', left: 0, top: '6px', width: '4px', height: '4px', borderRadius: '50%', background: '#92400E' }} />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {/* Action buttons */}
                <div className="cc-mobile-actions">
                  <button
                    className="cc-mobile-btn-primary"
                    onClick={() => {
                      if (card.apply_link) {
                        let url = card.apply_link;
                        if (!url.startsWith('http')) url = 'https://' + url;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    disabled={!card.apply_link}
                    style={{ opacity: card.apply_link ? 1 : 0.6, cursor: card.apply_link ? 'pointer' : 'not-allowed' }}
                  >
                    {card.apply_link ? 'Apply Now' : 'Link Coming Soon'}
                  </button>
                  <button
                    className="cc-mobile-btn-secondary"
                    onClick={() => navigate(`/cards/${card.id}${d ? `?net_savings=${d.net_annual_savings}` : ''}`)}
                  >
                    View Details
                  </button>
                  {activeMobileTab !== 0 && (
                    <button
                      className="cc-mobile-btn-secondary"
                      onClick={() => setMobileSwapOpen((v) => !v)}
                    >
                      ⇄ Swap This Card
                    </button>
                  )}

                  {/* Inline swap picker */}
                  {mobileSwapOpen && activeMobileTab !== 0 && (
                    <div className="cc-mobile-swap-picker">
                      {(() => {
                        const takenIds = new Set(slots.filter(Boolean).map((s) => s.id));
                        const available = allCards.filter((ac) => !takenIds.has(ac.id));
                        return available.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'Inter', fontSize: '13px', color: '#6B7280' }}>
                            No other cards available to swap with.
                          </div>
                        ) : available.map((ac) => (
                          <button
                            key={ac.id}
                            className="cc-dd-item"
                            onClick={() => { handleSwap(activeMobileTab, ac); setMobileSwapOpen(false); }}
                          >
                            <span className="cc-dd-thumb" style={{ background: gradient(allCards.indexOf(ac)) }}>
                              {abbr(ac.name)}
                            </span>
                            <span>
                              {ac.name}
                              <br />
                              <span style={{ color: '#6B7280', fontSize: 11 }}>{ac.bank}</span>
                            </span>
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ——— Card slot row + table (horizontal scroll on mobile) ——— */}
        <div className="cc-grid-wrapper">
        <div className="cc-scroll-inner">
        <div className="cc-grid cc-slot-row" ref={slotRowRef}>
          {/* empty label column — sticky on mobile */}
          <div className="cc-label-col" />

          {[0, 1, 2].map((i) => {
            const card = slots[i];
            const buttonColor = i === 0 ? '#D97706' : '#011A3D';
            const buttonHoverColor = i === 0 ? '#B45309' : '#020F26';
            return (
              <div
                key={i}
                className="cc-card-col"
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
                {card ? (
                  <button
                    onClick={() => navigate(`/cards/${card.id}${getD(i) ? `?net_savings=${getD(i).net_annual_savings}` : ''}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#001A3D',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '18px',
                      fontWeight: 700,
                      lineHeight: '28px',
                      textAlign: 'left',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#C9920A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#001A3D'; }}
                  >
                    {card.name}
                  </button>
                ) : (
                  <h4 style={{ color: '#001A3D', fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, lineHeight: '28px', margin: 0 }}>—</h4>
                )}

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

                {/* Top Pick badge (slot 0, locked) or Swap button (slots 1 & 2) */}
                {i === 0 ? (
                  activeSlots.length > 0 && (
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
                      display: 'inline-block',
                    }}>
                      Top Pick
                    </div>
                  )
                ) : (
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
                        {(() => {
                          const takenIds = new Set(slots.filter(Boolean).map((s) => s.id));
                          const available = allCards.filter((ac) => !takenIds.has(ac.id));
                          return available.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'Inter', fontSize: '13px', color: '#6B7280' }}>
                              No other cards available to swap with.
                            </div>
                          ) : available.map((ac) => (
                            <button
                              key={ac.id}
                              className="cc-dd-item"
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
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                )}

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
                    disabled={!card.apply_link}
                    style={{
                      width: '100%',
                      background: card.apply_link ? buttonColor : '#D1D5DB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: card.apply_link ? 'pointer' : 'not-allowed',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (card.apply_link) e.currentTarget.style.background = buttonHoverColor; }}
                    onMouseLeave={(e) => { if (card.apply_link) e.currentTarget.style.background = buttonColor; }}
                  >
                    {card.apply_link ? 'Apply Now' : 'Link Coming Soon'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ——— Helper note ——— */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <div style={{
            padding: '12px 16px',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#6B7280',
          }}>
            <Info size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <span>Your top pick is locked. Swap the other two cards to compare alternatives with your best recommendation.</span>
          </div>

          {hasPersonalizedData ? (
            <div style={{
              padding: '12px 16px',
              background: '#ECFDF5',
              borderRadius: '8px',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#065F46',
            }}>
              <CheckCircle size={14} color="#065F46" style={{ marginTop: '3px', flexShrink: 0 }} />
              <span>Cashback figures shown below are personalized based on your spending profile.</span>
            </div>
          ) : (
            <div style={{
              padding: '12px 16px',
              background: '#FEF3C7',
              borderRadius: '8px',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#92400E',
            }}>
              <Info size={14} color="#92400E" style={{ marginTop: '5px', flexShrink: 0 }} />
              <span>
                Cashback figures shown here use average spending for general comparison.
                For personalized recommendations based on your actual spending, use the
                calculator on the homepage.
              </span>
            </div>
          )}
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

          {/* Notes */}
          <div className="cc-trow cc-trow-benefits">
            <div className="cc-td-label">Notes</div>
            {[0, 1, 2].map((i) => {
              const notes = (slots[i]?.card_notes || '').split('\n').map((s) => s.trim()).filter(Boolean);
              return (
                <div key={i} className="cc-td" style={{ alignItems: 'flex-start' }}>
                  {notes.length === 0 ? (
                    <span style={{ color: '#9CA3AF', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>—</span>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {notes.map((note, idx) => (
                        <li key={idx} style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#92400E', lineHeight: 1.4, paddingLeft: '12px', position: 'relative', marginBottom: idx < notes.length - 1 ? '6px' : 0 }}>
                          <span style={{ position: 'absolute', left: 0, top: '6px', width: '4px', height: '4px', borderRadius: '50%', background: '#92400E' }} />
                          {note}
                        </li>
                      ))}
                    </ul>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <CategoryIcon name={cat.icon} size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        {cat.label || cat.name}
                      </span>
                    </div>
                  </div>
                  {[0, 1, 2].map((i) => {
                    const card = slots[i];
                    const d = getD(i);
                    const rate = card ? getRate(card, cat.name) : null;
                    const annualAmt = d?.cashback_breakdown?.[cat.slug];
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
                          disabled={!slots[i].apply_link}
                          style={{
                            width: '100%',
                            background: slots[i].apply_link ? btnColor : '#D1D5DB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px',
                            fontFamily: 'Manrope, sans-serif',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: slots[i].apply_link ? 'pointer' : 'not-allowed',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => { if (slots[i].apply_link) e.currentTarget.style.background = btnHover; }}
                          onMouseLeave={(e) => { if (slots[i].apply_link) e.currentTarget.style.background = slots[i].apply_link ? btnColor : '#D1D5DB'; }}
                        >
                          {slots[i].apply_link ? 'Apply Now' : 'Link Coming Soon'}
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
          {(() => {
            const dates = slots.filter(Boolean).map((s) => s.updated_at ? new Date(s.updated_at) : null).filter(Boolean);
            const latest = dates.length ? new Date(Math.max(...dates)).toLocaleDateString('en-GB') : null;
            return latest ? `Card rewards data last updated ${latest} · ` : '';
          })()}Savings estimates are indicative based on your spending inputs · Always verify rates on the bank&apos;s official website
        </p>

        </div>{/* end cc-scroll-inner */}
        </div>{/* end cc-grid-wrapper */}


      </div>

      <CardRankingTable rankingData={rankingData} loading={rankingLoading} topPickId={slots[0]?.id} />
      <Footer />
    </div>
  );
}
