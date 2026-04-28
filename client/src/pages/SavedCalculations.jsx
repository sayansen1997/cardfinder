import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../utils/api';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';
import './saved.css';

const BADGE_COLORS = [
  ['#1a3c5e', '#2d6a9f'],
  ['#1b4332', '#2d6a4f'],
  ['#4a148c', '#7b1fa2'],
];

const badgeBg = (i) =>
  `linear-gradient(135deg, ${BADGE_COLORS[i % 3][0]}, ${BADGE_COLORS[i % 3][1]})`;

const abbr = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const profileLabel = (spending) => {
  const total = Object.values(spending || {}).reduce((s, v) => s + Number(v), 0);
  if (total > 8000) return 'High Spend Portfolio';
  if (total > 4000) return 'Mid Spend Portfolio';
  return 'Essentials Portfolio';
};

const topCatSubtitle = (breakdown) => {
  const entries = Object.entries(breakdown || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '));
  return entries.length ? `Best for ${entries.join(' & ')}` : '';
};

function CalcCard({ calc, categories }) {
  const [open, setOpen] = useState(false);

  const income = Number(calc.monthly_income) || 0;
  const netSavings = Number(calc.net_savings) || 0;
  const spending = calc.spending || {};
  const topCards = calc.top_cards || [];

  const catMap = {};
  (categories || []).forEach((c) => {
    catMap[c.name] = c;
    catMap[c.slug] = c;
  });

  return (
    <div className="sc-card">
      <div className="sc-card-header" onClick={() => setOpen((v) => !v)}>
        <div className="sc-icon-box">📊</div>

        <div className="sc-card-meta">
          <div className="sc-card-date">{fmtDate(calc.created_at)}</div>
          <div className="sc-card-sub">
            AED {income.toLocaleString()} Monthly Income &bull; {profileLabel(spending)}
          </div>
        </div>

        <div className="sc-card-right">
          <div className="sc-savings-block">
            <span className="sc-savings-label">Est. Savings</span>
            <span className="sc-savings-val">
              AED {netSavings.toLocaleString()} /yr
            </span>
          </div>
          <span className={`sc-chevron${open ? ' open' : ''}`}>▼</span>
        </div>
      </div>

      {open && (
        <div className="sc-card-body">
          {/* Left: spending categories */}
          <div className="sc-col">
            <div className="sc-col-title">⚙ Spending Categories</div>
            <div className="sc-spend-grid">
              {Object.entries(spending).map(([key, val]) => {
                const cat = catMap[key];
                return (
                  <div key={key} className="sc-spend-item">
                    <div className="sc-spend-cat">
                      {cat?.icon && <span>{cat.icon}</span>}
                      {cat?.label || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                    </div>
                    <div className="sc-spend-amt">
                      AED {Number(val).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sc-divider" />

          {/* Right: top recommendations */}
          <div className="sc-col">
            <div className="sc-col-title">⭐ Top Recommendations</div>
            <div className="sc-rec-list">
              {topCards.slice(0, 3).map((card, i) => (
                <div key={card.id} className={`sc-rec-row${i === 0 ? ' top' : ''}`}>
                  <div
                    className="sc-rec-badge"
                    style={{ background: badgeBg(i) }}
                  >
                    {abbr(card.name)}
                  </div>
                  <div className="sc-rec-info">
                    <div className="sc-rec-name">{card.name}</div>
                    <div className="sc-rec-subtitle">
                      {topCatSubtitle(card.cashback_breakdown)}
                    </div>
                  </div>
                  <div className="sc-rec-savings">
                    <span className="sc-rec-savings-label">Annual Savings</span>
                    <span className="sc-rec-savings-val">
                      AED {Number(card.net_annual_savings).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SavedCalculations() {
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/signup');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(`${API_BASE}/users/calculations`, { headers }),
      axios.get(`${API_BASE}/categories`),
      axios.get(`${API_BASE}/users/me`, { headers }),
    ])
      .then(([calcRes, catsRes, meRes]) => {
        setCalculations(calcRes.data || []);
        setCategories(catsRes.data || []);
        setUserName(meRes.data.name || meRes.data.first_name || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleStartNew = () => {
    navigate('/dashboard');
    setTimeout(() => {
      document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  return (
    <div className="sc-page">
      <DashboardNavbar firstName={userName} />

      <div className="sc-inner">
        {/* Header */}
        <div className="sc-header">
          <div>
            <p className="sc-eyebrow">History</p>
            <h1 className="sc-title">Saved Calculations</h1>
          </div>
          <button className="sc-btn-new" onClick={handleStartNew}>
            🔄 Start New Calculation
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="sc-loading">
            <div className="sc-spinner" />
          </div>
        ) : calculations.length === 0 ? (
          <div className="sc-empty">
            <div className="sc-empty-icon">📋</div>
            <div className="sc-empty-title">No saved calculations yet.</div>
            <div className="sc-empty-sub">
              Run the calculator and save your results to see them here.
            </div>
            <button className="sc-empty-btn" onClick={handleStartNew}>
              Start Calculating →
            </button>
          </div>
        ) : (
          <div className="sc-list">
            {calculations.map((calc) => (
              <CalcCard key={calc.id} calc={calc} categories={categories} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
