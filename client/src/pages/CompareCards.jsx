import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';
import DashboardNavbar from '../components/DashboardNavbar';
import CardRankingTable from '../components/CardRankingTable';
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
  const [searchParams] = useSearchParams();
  const [allCards, setAllCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slots, setSlots] = useState([null, null, null]);
  const [compareData, setCompareData] = useState([]);
  const [spending, setSpending] = useState({});
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

  /* ——— Fetch all cards + categories ——— */
  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/cards`),
      axios.get(`${API_BASE}/categories`),
    ]).then(([cardsRes, catsRes]) => {
      const cards = cardsRes.data || [];
      const cats = (catsRes.data || []).sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );
      setAllCards(cards);
      setCategories(cats);

      const defaultSpending = {};
      cats.forEach((c) => {
        defaultSpending[c.name] = Number(c.default_spend) || 0;
      });
      setSpending(defaultSpending);

      // Priority: location.state.cardIds > ?cards= query param > default first 3
      const stateIds = location.state?.cardIds || [];
      const paramId = searchParams.get('cards');
      let initialSlots;
      if (stateIds.length > 0) {
        const ordered = stateIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean);
        initialSlots = [ordered[0] || null, ordered[1] || null, ordered[2] || null];
      } else if (paramId) {
        const target = cards.find((c) => c.id === Number(paramId));
        const rest = cards.filter((c) => c.id !== Number(paramId));
        initialSlots = [target || null, rest[0] || null, rest[1] || null];
      } else {
        initialSlots = [cards[0] || null, cards[1] || null, cards[2] || null];
      }
      setSlots(initialSlots);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
              Side-by-side comparison of cashback, fees, and benefits for your spending profile.
            </p>
          </div>
          <div className="cc-header-actions">
            <button
              className="cc-btn-outline"
              onClick={() => window.print()}
            >
              Save Results
            </button>
            <button
              className="cc-btn-gold"
              onClick={() => runCompare(slots, spending)}
            >
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
            const d = getD(i);
            return (
              <div key={i} className="cc-slot">
                {i === 0 && activeSlots.length > 0 && (
                  <span className="cc-top-pick">Top Pick</span>
                )}

                {card ? (
                  <>
                    <div
                      className="cc-thumb"
                      style={{ background: gradient(i) }}
                    >
                      {abbr(card.name)}
                    </div>
                    <p className="cc-slot-name">{card.name}</p>
                    <p className="cc-slot-bank">{card.bank}</p>
                  </>
                ) : (
                  <div
                    className="cc-thumb"
                    style={{ background: '#E5E7EB', color: '#9CA3AF', fontSize: 12 }}
                  >
                    Empty
                  </div>
                )}

                {/* Swap dropdown */}
                <div className="cc-swap-wrap">
                  <button
                    className="cc-swap-btn"
                    onClick={() =>
                      setOpenDropdown(openDropdown === i ? null : i)
                    }
                  >
                    ⇄ Swap Card
                  </button>
                  {openDropdown === i && (
                    <div className="cc-dropdown">
                      {allCards.map((ac) => (
                        <button
                          key={ac.id}
                          className={`cc-dd-item${
                            card && card.id === ac.id ? ' active' : ''
                          }`}
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
                            <span style={{ color: '#6B7280', fontSize: 11 }}>
                              {ac.bank}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {card && (
                  <a
                    href={card.apply_link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cc-apply-btn"
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
                  >
                    Apply Now
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* ——— Comparison table ——— */}
        <div className="cc-table-wrap">
          {/* Section label: Key Features */}
          <div className="cc-section-row-label">Key Features</div>

          {/* Card Category */}
          <div className="cc-trow">
            <div className="cc-td-label">Card Category</div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="cc-td">
                {slots[i]?.card_category || '—'}
              </div>
            ))}
          </div>

          {/* Annual Fees */}
          <div className="cc-trow">
            <div className="cc-td-label">Annual Fee</div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="cc-td">
                {slots[i] ? fmtFee(slots[i].annual_fee) : '—'}
                {slots[i]?.fee_notes && (
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>
                    ({slots[i].fee_notes})
                  </span>
                )}
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
                        <li key={bi}>{b}</li>
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
            <div className="cc-td-label cc-savings-label">Est. Net Annual Savings</div>
            {[0, 1, 2].map((i) => {
              const d = getD(i);
              return (
                <div key={i} className="cc-td cc-savings-val">
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
                    {cat.icon && (
                      <span className="cc-cat-icon">{cat.icon}</span>
                    )}
                    {cat.label || cat.name}
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
              <div className="cc-trow cc-trow-savings">
                <div className="cc-td-label cc-savings-label">Net Annual Savings</div>
                {[0, 1, 2].map((i) => {
                  const d = getD(i);
                  return (
                    <div key={i} className="cc-td cc-savings-val">
                      {d ? fmtAED(d.net_annual_savings) : '—'}
                    </div>
                  );
                })}
              </div>

              {/* Apply Now row */}
              <div className="cc-trow cc-apply-row">
                <div className="cc-td-label" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="cc-td cc-apply-td">
                    {slots[i] ? (
                      <a
                        href={slots[i].apply_link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cc-apply-btn-table"
                        style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
                      >
                        Apply Now
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="cc-disclaimer">
          * Cashback estimates are based on your spending profile and card rates. Actual rewards
          may vary. Annual fees and cashback caps apply. Always check the issuer&apos;s website
          for current terms and conditions.
        </p>
      </div>

      <CardRankingTable rankingData={rankingData} loading={rankingLoading} />
      <Footer />
    </div>
  );
}
