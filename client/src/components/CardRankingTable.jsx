import { useNavigate } from 'react-router-dom';

function typeBorderClass(type) {
  switch ((type || '').toLowerCase()) {
    case 'travel':  return 'cf-row-border-travel';
    case 'premium': return 'cf-row-border-premium';
    default:        return 'cf-row-border-cashback';
  }
}

function typeBadgeClass(type) {
  switch ((type || '').toLowerCase()) {
    case 'travel':  return 'cf-type-badge cf-type-travel';
    case 'premium': return 'cf-type-badge cf-type-premium';
    default:        return 'cf-type-badge cf-type-cashback';
  }
}

function fmtFee(fee) {
  return Number(fee) === 0 ? 'Free' : `AED ${Number(fee).toLocaleString()}`;
}

export default function CardRankingTable({ rankingData, loading }) {
  const navigate = useNavigate();
  return (
    <section className="cf-ranking" id="rankings">
      <div className="cf-container">
        <div className="cf-ranking-header">
          <h2>Card Ranking</h2>
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
          <div className="cf-table-wrap">
            <table className="cf-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>CARD</th>
                  <th>TYPE</th>
                  <th>NET EARNINGS / YR</th>
                  <th>CASHBACK / YR</th>
                  <th>ANNUAL FEE</th>
                  <th>MIN INCOME</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rankingData.map((card, i) => (
                  <tr key={card.id} className={typeBorderClass(card.card_category)}>
                    <td className="cf-table-rank">{i + 1}</td>
                    <td>
                      <div className="cf-table-card-name">{card.name}</div>
                      <div className="cf-table-bank">{card.bank}</div>
                    </td>
                    <td>
                      <span className={typeBadgeClass(card.card_category)}>
                        {card.card_category || 'Cashback'}
                      </span>
                    </td>
                    <td className="cf-net-earnings">
                      AED {Number(card.net_annual_savings).toLocaleString()}
                    </td>
                    <td>AED {Number(card.total_annual_cashback).toLocaleString()}</td>
                    <td className={`cf-annual-fee${Number(card.annual_fee) === 0 ? ' cf-fee-free' : ''}`}>
                      {fmtFee(card.annual_fee)}
                    </td>
                    <td>AED {Number(card.min_salary).toLocaleString()}</td>
                    <td>
                      <button className="cf-btn-table-compare" onClick={() => navigate(`/compare?cards=${card.id}`)}>Compare →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
