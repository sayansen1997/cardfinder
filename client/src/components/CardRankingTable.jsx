import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle } from 'lucide-react';

const formatIncome = (val) =>
  `AED ${val >= 1000 ? Math.floor(val / 1000) + 'k' : val}`;

const formatAED = (val) =>
  `AED ${Number(val).toLocaleString()}`;

const formatFee = (val) =>
  `AED ${Number(val) === 0 ? '0' : Number(val).toLocaleString()}`;

const TH_STYLE = {
  padding: '14px 20px',
  textAlign: 'left',
  fontFamily: 'Inter, sans-serif',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#1A2332',
  whiteSpace: 'nowrap',
};

const TD_BASE = {
  padding: '16px 20px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  fontWeight: 400,
  color: '#E5E7EB',
};

const TD_MUTED = {
  ...TD_BASE,
  color: '#D6C4AD',
};

export default function CardRankingTable({ rankingData, loading, hiddenCardIds = new Set() }) {
  const navigate = useNavigate();

  const sorted = [...(rankingData || [])].sort(
    (a, b) => Number(b.net_annual_savings) - Number(a.net_annual_savings)
  );

  return (
    <section className="cf-ranking" id="rankings">
      <div className="cf-container">
        {/* ── Section header ── */}
        <div className="cf-ranking-header">
          <div>
            <h2>Card Ranking</h2>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#94A3B8',
              margin: '6px 0 0',
              lineHeight: 1.5,
            }}>
              Full competitive landscape for your spending profile
            </p>
          </div>
          <a href="https://etihadbureau.ae/Individual/CreditScore" target="_blank" rel="noopener noreferrer" className="cf-aecb-link">
            Check your AECB Credit Score <ArrowRight size={16} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
          </a>
        </div>

        {loading ? (
          <div className="cf-loading">
            <div className="cf-spinner" />
            <p>Loading rankings…</p>
          </div>
        ) : (
          <div style={{
            background: '#14213D',
            borderRadius: '12px',
            overflow: 'hidden',
            marginTop: '24px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{
                  background: '#FFC868',
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px',
                }}>
                  {['CARD', 'TYPE', 'NET SAVINGS/YR', 'CASHBACK/YR', 'ANNUAL FEE', 'MIN INCOME', ''].map((h, idx) => (
                    <th key={idx} style={TH_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((card, i) => {
                  const isTop3 = i < 3;
                  const isNotRecommended = hiddenCardIds.has(card.id);
                  const rowBg = isTop3 ? '#FFBD4926' : (i % 2 === 0 ? '#14213D' : '#1A2B47');
                  return (
                    <tr
                      key={card.id}
                      style={{ background: rowBg, borderBottom: '1px solid #01142E', opacity: isNotRecommended ? 0.75 : 1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#233250'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}
                    >
                      {/* CARD */}
                      <td style={{ ...TD_BASE }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {isTop3 && (
                            <span style={{ color: '#C9920A', fontSize: '14px', lineHeight: 1 }}>★</span>
                          )}
                          <button
                            onClick={() => {
                              const params = new URLSearchParams()
                              if (card.net_annual_savings !== undefined) params.append('net_savings', card.net_annual_savings)
                              const qs = params.toString()
                              navigate(`/cards/${card.id}${qs ? '?' + qs : ''}`)
                            }}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, textAlign: 'left', textDecoration: 'none', transition: 'color 0.2s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#C9920A' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'white' }}
                          >
                            {card.name}
                          </button>
                          {isNotRecommended && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '3px',
                              background: '#451A03', color: '#FED7AA',
                              fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                              padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.04em',
                              whiteSpace: 'nowrap',
                            }}>
                              <AlertTriangle size={10} strokeWidth={2} />
                              Not recommended
                            </span>
                          )}
                        </div>
                      </td>

                      {/* TYPE */}
                      <td style={{ ...TD_MUTED }}>
                        {card.category_name || card.card_category || 'Cashback'}
                      </td>

                      {/* NET SAVINGS/YR */}
                      <td style={{
                        ...TD_BASE,
                        fontWeight: isTop3 ? 700 : 400,
                        color: isTop3 ? '#FFFFFF' : '#E5E7EB',
                      }}>
                        {formatAED(card.net_annual_savings)}
                      </td>

                      {/* CASHBACK/YR */}
                      <td style={{ ...TD_BASE }}>
                        {formatAED(card.total_annual_cashback)}
                      </td>

                      {/* ANNUAL FEE */}
                      <td style={{ ...TD_MUTED }}>
                        {formatFee(card.annual_fee)}
                      </td>

                      {/* MIN INCOME */}
                      <td style={{ ...TD_MUTED }}>
                        {formatIncome(card.min_salary)}
                      </td>

                      {/* COMPARE */}
                      <td style={{ ...TD_BASE }}>
                        <button
                          onClick={() => navigate(`/compare?cards=${card.id}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#FFBD49',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Compare <ArrowRight size={16} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
