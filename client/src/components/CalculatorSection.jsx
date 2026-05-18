import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Lock, CircleCheck, Info } from 'lucide-react';
import API_BASE from '../utils/api';
import CategoryIcon from './CategoryIcon';
import {
  shouldBlockCalculation,
  incrementCalculationCount,
  isAuthenticated,
  savePendingCalc,
  getPendingCalc,
  clearPendingCalc,
} from '../utils/calculationGate';

const incomeRangeToAed = (label) => {
  const map = { '10k': 10000, '15k': 15000, '25k': 25000, '40k': 40000, '60k+': 60000 };
  return map[label] || 10000;
};

const getUserDefaultIncome = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return incomeRangeToAed(user.income_range);
  } catch {
    return 10000;
  }
};

function updateSlider(el) {
  if (!el) return;
  const min = parseFloat(el.min) || 0;
  const max = parseFloat(el.max) || 5000;
  const val = parseFloat(el.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;
  el.style.background = `linear-gradient(to right, #C9920A ${pct}%, #E5E7EB ${pct}%)`;
}

const authHeaders = () => {
  const t = localStorage.getItem('userToken');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

function CategoryTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow((s) => !s)}
    >
      <Info size={13} color="#94A3B8" style={{ cursor: 'help' }} />
      {show && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0D1B2A',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontFamily: 'Inter',
          fontSize: '12px',
          lineHeight: 1.4,
          width: '240px',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none',
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #0D1B2A',
          }} />
        </div>
      )}
    </div>
  );
}

export default function CalculatorSection({ ref, onResults, onRankingUpdate, initialIncome }) {
  const [categories, setCategories] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [income, setIncome] = useState(0);
  const [activeBracket, setActiveBracket] = useState(null);
  const [spending, setSpending] = useState({});
  const [autoPopulate, setAutoPopulate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/categories`),
      axios.get(`${API_BASE}/income-brackets`),
    ]).then(([catsRes, brksRes]) => {
      const cats = catsRes.data;
      const brks = brksRes.data;
      setCategories(cats);
      setBrackets(brks);

      let startBracket, startIncome;
      if (initialIncome) {
        startIncome = initialIncome;
        startBracket = brks.find((b) => Number(b.value) === initialIncome) || brks[0];
      } else {
        const userIncome = getUserDefaultIncome();
        startBracket = brks.find((b) => Number(b.value) === userIncome) || brks[0];
        startIncome = startBracket ? Number(startBracket.value) : 0;
      }
      setIncome(startIncome);
      setActiveBracket(startBracket?.id ?? null);

      const initialSpend = autoPopulate
        ? distributeIncome(startIncome, cats)
        : (() => {
            const fallback = {};
            cats.forEach((c) => { fallback[c.slug] = Number(c.default_spend) || 0; });
            return fallback;
          })();
      setSpending(initialSpend);
      setInitLoading(false);

      axios.post(`${API_BASE}/calculate`, { spending: initialSpend, income: startIncome }, { headers: authHeaders() })
        .then((r) => onRankingUpdate?.(r.data?.ranking_cards || r.data?.all_cards || r.data?.cards || r.data || []))
        .catch(() => {});
    }).catch(() => setInitLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.querySelectorAll('input[type="range"].cat-slider').forEach(updateSlider);
  }, [spending]);

  useEffect(() => {
    if (!autoPopulate || !categories.length || !income) return;
    setSpending(distributeIncome(income, categories));
  }, [autoPopulate, income, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!brackets.length) return;
    const handleUserUpdate = () => {
      const userIncome = getUserDefaultIncome();
      const matched = brackets.find((b) => Number(b.value) === userIncome) || brackets[0];
      if (matched) {
        setIncome(Number(matched.value));
        setActiveBracket(matched.id ?? null);
      }
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, [brackets]);

  // Restore pending calc data after user signs up / logs in
  useEffect(() => {
    if (!isAuthenticated()) return;
    const pending = getPendingCalc();
    if (!pending) return;
    if (pending.income) setIncome(pending.income);
    if (pending.spending) setSpending(pending.spending);
    if (typeof pending.autoPopulate === 'boolean') setAutoPopulate(pending.autoPopulate);
    clearPendingCalc();
    setTimeout(() => {
      if (pending.spending && pending.income) {
        axios.post(`${API_BASE}/calculate`, { spending: pending.spending, income: pending.income }, { headers: authHeaders() })
          .then((res) => {
            onResults?.(res.data, { spending: pending.spending, income: pending.income, saveAfterAuth: pending.saveAfterAuth });
            onRankingUpdate?.(res.data?.ranking_cards || res.data?.all_cards || res.data?.cards || res.data || []);
            try {
              const calcCards = Array.isArray(res.data) ? res.data : (res.data?.cards || res.data?.ranking_cards || []);
              sessionStorage.setItem('lastCalcResults', JSON.stringify({ cards: calcCards, spending: pending.spending, income: pending.income, timestamp: Date.now() }));
            } catch (e) { /* ignore */ }
          })
          .catch((err) => console.error('Auto-calc error:', err));
      }
    }, 200);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const distributeIncome = (currentIncome, cats) => {
    const splits = {
      groceries:  0.12,
      dining:     0.08,
      travel:     0.08,
      fuel:       0.06,
      shopping:   0.12,
      utilities:  0.10,
      car_rental: 0.05,
      online:     0.08,
    };
    const newSpending = {};
    cats.forEach((cat) => {
      const pct = splits[cat.slug] ?? 0.05;
      let amount = Math.round(currentIncome * pct);
      const min = Number(cat.min_spend) || 0;
      const max = Number(cat.max_spend) || amount;
      newSpending[cat.slug] = Math.max(min, Math.min(max, amount));
    });
    return newSpending;
  };

  const handleBracketClick = (bracket) => {
    setActiveBracket(bracket.id);
    const val = Number(bracket.value);
    setIncome(val);
    if (autoPopulate) setSpending(distributeIncome(val, categories));
  };

  const handleAutoPopulate = () => {
    const next = !autoPopulate;
    setAutoPopulate(next);
    if (next) setSpending(distributeIncome(income, categories));
  };

  const updateSpend = (slug, value) => {
    setSpending((prev) => ({ ...prev, [slug]: Number(value) }));
  };

  const handleSubmit = async () => {
    if (shouldBlockCalculation()) {
      savePendingCalc({ income, spending, autoPopulate });
      setShowSignupGate(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/calculate`, { spending, income }, { headers: authHeaders() });
      onResults?.(res.data, { spending, income });
      onRankingUpdate?.(res.data?.ranking_cards || res.data?.all_cards || res.data?.cards || res.data || []);
      if (!isAuthenticated()) incrementCalculationCount();
      try {
        const calcCards = Array.isArray(res.data) ? res.data : (res.data?.cards || res.data?.ranking_cards || []);
        sessionStorage.setItem('lastCalcResults', JSON.stringify({ cards: calcCards, spending, income, timestamp: Date.now() }));
      } catch (e) {
        // ignore quota errors
      }
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } catch {
      setError('Calculation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalMonthly = Object.values(spending).reduce((s, v) => s + (Number(v) || 0), 0);
  const totalAnnual = totalMonthly * 12;

  return (
    <section className="cf-calculator" id="calculator-section" ref={ref}>
      <div className="cf-container">
        <div className="cf-section-header">
          <h2>Stop Guessing &amp; Start Saving</h2>
          <p>Don't let your rewards go to waste. Use our calculator to find credit cards in the UAE that actually pay you back based on your lifestyle.</p>
        </div>

        {initLoading ? (
          <div className="cf-loading">
            <div className="cf-spinner" />
            <p>Loading calculator…</p>
          </div>
        ) : (
          <div className="cf-calc-panel">
            <div className="cf-calc-grid">

              {/* ── Left – Monthly Income ── */}
              <div className="cf-calc-column">
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '28px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}>
                  <h3 style={{ margin: '0 0 4px', color: '#191C1D' }}>Monthly Income</h3>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#6B7280',
                    lineHeight: 1.5,
                    margin: '4px 0 16px',
                  }}>
                    Tell us your monthly salary in AED to filter eligible cards.
                  </p>

                  <label style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#C9920A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px',
                    display: 'block',
                  }}>
                    Monthly Salary (AED)
                  </label>

                  <div className="cf-income-input-wrap">
                    <span>AED</span>
                    <input
                      className="cf-income-input"
                      type="text"
                      inputMode="numeric"
                      value={income === 0 ? '' : income.toLocaleString('en-US')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '');
                        const num = parseInt(raw, 10);
                        setIncome(isNaN(num) ? 0 : num);
                        setActiveBracket(null);
                      }}
                      style={{ background: 'white', colorScheme: 'light' }}
                    />
                  </div>

                  <div className="cf-bracket-btns">
                    {brackets.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleBracketClick(b)}
                        style={{
                          padding: '6px 16px',
                          borderRadius: '999px',
                          border: activeBracket === b.id ? 'none' : '1.5px solid #E5E7EB',
                          background: activeBracket === b.id ? '#C9920A' : 'white',
                          color: activeBracket === b.id ? 'white' : '#374151',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAutoPopulate}
                    style={{
                      width: '100%',
                      background: autoPopulate ? '#FEF3C7' : 'white',
                      border: autoPopulate ? '1.5px solid #C9920A' : '1.5px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      color: '#374151',
                      fontWeight: 700,
                      marginTop: '12px',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <span style={{ color: '#C9920A', fontSize: '14px' }}>⚡</span>
                    Auto-populate from income
                  </button>
                </div>
              </div>

              {/* ── Right – ONE white panel with everything inside ── */}
              <div className="cf-calc-column">
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  border: '1px solid #E5E7EB',
                }}>

                  {/* Heading row */}
                  <div className="cf-spending-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                  }}>
                    <span style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#0D1B2A',
                    }}>
                      Monthly Spending by Category
                    </span>
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: '#9CA3AF',
                    }}>
                      Adjust sliders or edit amounts
                    </span>
                  </div>

                  {/* Category grid — no individual cards, just rows */}
                  <div className="cf-spending-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    rowGap: '20px',
                    columnGap: '32px',
                    marginBottom: '28px',
                  }}>
                    {categories.map((cat) => (
                      <div key={cat.slug}>
                        {/* Top row: icon+label + input */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CategoryIcon name={cat.icon} size={16} color="#94A3B8" />
                            <span style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#0D1B2A',
                            }}>
                              {cat.label}
                            </span>
                            {cat.tooltip && <CategoryTooltip text={cat.tooltip} />}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min={Number(cat.min_spend) || 0}
                              max={Number(cat.max_spend) || 5000}
                              style={{
                                width: '64px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                textAlign: 'right',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#0D1B2A',
                                background: 'white',
                                outline: 'none',
                                colorScheme: 'light',
                              }}
                              value={spending[cat.slug] ?? 0}
                              onChange={(e) => updateSpend(cat.slug, e.target.value)}
                            />
                            <span style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '11px',
                              color: '#9CA3AF',
                              textTransform: 'uppercase',
                            }}>
                              AED
                            </span>
                          </div>
                        </div>

                        {/* Slider */}
                        <input
                          type="range"
                          className="cat-slider"
                          min={Number(cat.min_spend) || 0}
                          max={Number(cat.max_spend) || 5000}
                          step="50"
                          value={spending[cat.slug] ?? 0}
                          onChange={(e) => {
                            updateSpend(cat.slug, e.target.value);
                            updateSlider(e.target);
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Totals box — light grey inset, 2-column */}
                  <div className="cf-spending-totals" style={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    padding: '20px 24px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0px',
                    marginBottom: '20px',
                  }}>
                    {/* Monthly total */}
                    <div style={{ paddingRight: '24px', borderRight: '1px solid #E5E7EB' }}>
                      <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#6B7280',
                        marginBottom: '6px',
                      }}>
                        Total Monthly Spending
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#C9920A',
                        }}>
                          AED
                        </span>
                        <span style={{
                          fontFamily: 'Manrope, sans-serif',
                          fontSize: '24px',
                          fontWeight: 800,
                          color: '#0D1B2A',
                        }}>
                          {totalMonthly.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Annual total */}
                    <div style={{ paddingLeft: '24px' }}>
                      <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#6B7280',
                        marginBottom: '6px',
                      }}>
                        Total Annual Spending
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#C9920A',
                        }}>
                          AED
                        </span>
                        <span style={{
                          fontFamily: 'Manrope, sans-serif',
                          fontSize: '24px',
                          fontWeight: 800,
                          color: '#0D1B2A',
                        }}>
                          {totalAnnual.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Find My Best Cards button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      width: '100%',
                      background: '#0D1B2A',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '16px',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '16px',
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      opacity: loading ? 0.75 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {loading
                      ? 'Calculating…'
                      : <><span>Find My Best Cards</span><ArrowRight size={18} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px', color: '#C9920A' }} /></>
                    }
                  </button>

                  {error && (
                    <p style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: '#DC2626',
                      marginTop: '8px',
                      textAlign: 'center',
                    }}>
                      {error}
                    </p>
                  )}

                </div>
              </div>

            </div>
          </div>
        )}
      </div>
      {showSignupGate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '440px',
            margin: '0 16px',
            overflow: 'hidden',
          }}>
            <div style={{ background: '#FEF3C7', padding: '24px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Lock size={26} color="#92400E" />
              </div>
              <h2 style={{ fontFamily: 'Manrope', fontSize: '20px', fontWeight: 700, color: '#92400E', margin: '0 0 4px' }}>
                Sign up to continue
              </h2>
              <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#92400E', opacity: 0.85, margin: 0 }}>
                Free account — see all your saved results
              </p>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#374151', margin: '0 0 16px', lineHeight: 1.5 }}>
                You've already used your free calculation. Sign up or log in to:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {[
                  'Run unlimited calculations',
                  'Save your results across devices',
                  'Get personalized card recommendations',
                  'Compare cards side-by-side',
                ].map((benefit, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CircleCheck size={18} color="#10B981" strokeWidth={2} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Inter', fontSize: '13px', color: '#0D1B2A', lineHeight: 1.4 }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: 'Inter', fontSize: '12px', color: '#6B7280', margin: '0 0 20px', textAlign: 'center', fontStyle: 'italic' }}>
                No credit card required
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    background: '#C9920A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: 'Manrope',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Sign Up Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'white',
                    color: '#0D1B2A',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: 'Manrope',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  I already have an account
                </button>
                <button
                  onClick={() => setShowSignupGate(false)}
                  style={{
                    background: 'transparent',
                    color: '#6B7280',
                    border: 'none',
                    padding: '8px',
                    fontFamily: 'Inter',
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
