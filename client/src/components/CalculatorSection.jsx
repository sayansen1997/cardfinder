import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../utils/api';

function updateSlider(el) {
  if (!el) return;
  const min = parseFloat(el.min) || 0;
  const max = parseFloat(el.max) || 5000;
  const val = parseFloat(el.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;
  el.style.background = `linear-gradient(to right, #C9920A ${pct}%, #E5E7EB ${pct}%)`;
}

export default function CalculatorSection({ ref, onResults, onRankingUpdate, initialIncome }) {
  const [categories, setCategories] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [income, setIncome] = useState(0);
  const [activeBracket, setActiveBracket] = useState(null);
  const [spending, setSpending] = useState({});
  const [autoPopulate, setAutoPopulate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);

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
        startBracket = brks[0];
        startIncome = startBracket ? Number(startBracket.value) : 0;
      }
      setIncome(startIncome);
      setActiveBracket(startBracket?.id ?? null);

      const defaultSpend = {};
      cats.forEach((c) => { defaultSpend[c.slug] = Number(c.default_spend) || 0; });
      setSpending(defaultSpend);
      setInitLoading(false);

      axios.post(`${API_BASE}/calculate`, { spending: defaultSpend })
        .then((r) => onRankingUpdate?.(r.data))
        .catch(() => {});
    }).catch(() => setInitLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.querySelectorAll('input[type="range"].cat-slider').forEach(updateSlider);
  }, [spending]);

  const distributeIncome = (currentIncome, cats) => {
    const splits = {
      groceries:  0.12,
      dining:     0.08,
      travel:     0.10,
      fuel:       0.06,
      shopping:   0.15,
      utilities:  0.10,
      car_rental: 0.05,
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
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/calculate`, { spending });
      onResults?.(res.data, { spending, income });
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
    <section className="cf-calculator" id="calculator" ref={ref}>
      <div className="cf-container">
        <div className="cf-section-header">
          <h2>Stop Guessing &amp; Start Saving</h2>
          <p>Enter your monthly spending to find the credit card that earns you the most.</p>
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
                  <h3 style={{ margin: '0 0 4px' }}>Monthly Income</h3>
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
                  <div style={{
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
                  <div style={{
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
                            <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                            <span style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#0D1B2A',
                            }}>
                              {cat.label}
                            </span>
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
                                outline: 'none',
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
                  <div style={{
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
                      : <><span>Find My Best Cards</span><span style={{ color: '#C9920A', fontSize: '18px' }}>→</span></>
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
    </section>
  );
}
