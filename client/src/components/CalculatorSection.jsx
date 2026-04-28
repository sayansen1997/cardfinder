import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../utils/api';

function updateSlider(el) {
  if (!el) return;
  const min = parseFloat(el.min) || 0;
  const max = parseFloat(el.max) || 5000;
  const val = parseFloat(el.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;
  el.style.background = `linear-gradient(to right, #C9920A ${pct}%, #334155 ${pct}%)`;
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
        startBracket = brks.find((b) => Number(b.value) === initialIncome) || null;
      } else {
        startBracket = brks[2] || brks[0];
        startIncome = startBracket ? Number(startBracket.value) : 25000;
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

  const fetchBenchmarks = async (bracketStr) => {
    try {
      const res = await axios.get(`${API_BASE}/cards/benchmarks/${bracketStr}`);
      const filled = {};
      res.data.forEach((b) => { filled[b.category_name] = b.monthly_amount; });
      setSpending((prev) => ({ ...prev, ...filled }));
    } catch {
      // keep existing values
    }
  };

  const handleBracketClick = async (bracket) => {
    setActiveBracket(bracket.id);
    setIncome(Number(bracket.value));
    if (autoPopulate) await fetchBenchmarks(bracket.bracket);
  };

  const handleAutoToggle = async (checked) => {
    setAutoPopulate(checked);
    if (checked) {
      const active = brackets.find((b) => b.id === activeBracket);
      if (active) await fetchBenchmarks(active.bracket);
    }
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
          <>
            <div className="cf-calc-panel">
              <div className="cf-calc-grid">
                {/* Left – income */}
                <div className="cf-calc-column">
                  <h3>Monthly Income</h3>
                  <p className="helper">Your salary determines card eligibility</p>

                  <div className="cf-income-input-wrap">
                    <span>AED</span>
                    <input
                      className="cf-income-input"
                      type="number"
                      min="0"
                      value={income}
                      onChange={(e) => {
                        setIncome(Number(e.target.value));
                        setActiveBracket(null);
                      }}
                    />
                  </div>

                  <div className="cf-bracket-btns">
                    {brackets.map((b) => (
                      <button
                        key={b.id}
                        className={`cf-bracket-btn${activeBracket === b.id ? ' active' : ''}`}
                        onClick={() => handleBracketClick(b)}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  <label className="cf-auto-toggle">
                    <input
                      type="checkbox"
                      checked={autoPopulate}
                      onChange={(e) => handleAutoToggle(e.target.checked)}
                    />
                    Auto-populate from income
                  </label>
                </div>

                {/* Right – spending categories 2-col grid */}
                <div className="cf-calc-column">
                  <h3>Monthly Spending by Category</h3>
                  <p className="helper">Adjust each category to match your actual spending</p>

                  <div className="cf-cat-grid">
                    {categories.map((cat) => (
                      <div key={cat.slug} className="cf-cat-item">
                        <div className="cf-cat-header">
                          <span className="cf-cat-icon">{cat.icon}</span>
                          <span className="cf-cat-label">{cat.label}</span>
                          <div className="cf-cat-input-wrap">
                            <span>AED</span>
                            <input
                              type="number"
                              className="cf-cat-input"
                              min="0"
                              value={spending[cat.slug] ?? 0}
                              onChange={(e) => updateSpend(cat.slug, e.target.value)}
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          className="cat-slider"
                          min="0"
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

                  <div className="cf-totals-card">
                    <div className="cf-total-row">
                      <span className="t-label">Total Monthly Expenses</span>
                      <span className="t-value">AED {totalMonthly.toLocaleString()}</span>
                    </div>
                    <div className="cf-total-row">
                      <span className="t-label">Total Annual Expenses</span>
                      <span className="t-value">AED {totalAnnual.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="cf-calc-error">{error}</p>}

            <button className="cf-btn-calculate" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Calculating…' : 'Find My Best Cards →'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
