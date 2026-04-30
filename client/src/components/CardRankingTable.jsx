import { useNavigate } from 'react-router-dom';

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

export default function CardRankingTable({ rankingData, loading }) {
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
          <a href="#" className="cf-aecb-link">
            Check your AECB Credit Score →
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
                  const rowBg = isTop3 ? '#FFBD4926' : (i % 2 === 0 ? '#14213D' : '#1A2B47');
                  return (
                    <tr
                      key={card.id}
                      style={{ background: rowBg, borderBottom: '1px solid #01142E' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#233250'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}
                    >
                      {/* CARD */}
                      <td style={{ ...TD_BASE }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isTop3 && (
                            <span style={{ color: '#C9920A', fontSize: '14px', lineHeight: 1 }}>★</span>
                          )}
                          <span style={{ fontWeight: 600, color: 'white' }}>{card.name}</span>
                        </div>
                      </td>

                      {/* TYPE */}
                      <td style={{ ...TD_MUTED }}>
                        {card.card_category || 'Cashback'}
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
                          Compare →
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
