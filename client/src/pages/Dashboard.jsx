import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../utils/api';
import DashboardNavbar from '../components/DashboardNavbar';
import CalculatorSection from '../components/CalculatorSection';
import TopResults from '../components/TopResults';
import CardRankingTable from '../components/CardRankingTable';
import Footer from '../components/Footer';
import './dashboard.css';
import './home.css';

export default function Dashboard() {
  const [userName, setUserName] = useState('');

  const [rankingData, setRankingData] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [calcResults, setCalcResults] = useState([]);
  const [calcSpending, setCalcSpending] = useState({});
  const [calcIncome, setCalcIncome] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const calculatorRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    axios
      .get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUserName(res.data.name || res.data.first_name || ''))
      .catch(() => setUserName(''));

    // Save any pending calculation stored before login
    const pending = localStorage.getItem('pendingCalculation');
    if (pending) {
      try {
        const payload = JSON.parse(pending);
        axios.post(`${API_BASE}/users/calculations`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      } catch { /* ignore */ }
      localStorage.removeItem('pendingCalculation');
    }
  }, []);

  const handleResults = (data, meta) => {
    setCalcResults(data);
    if (meta) {
      setCalcSpending(meta.spending || {});
      setCalcIncome(meta.income || 0);
    }
    setShowResults(true);
  };

  const handleSaveCalc = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return false;
    const top3 = calcResults.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.name,
      bank: c.bank,
      net_annual_savings: c.net_annual_savings,
      cashback_breakdown: c.cashback_breakdown,
    }));
    try {
      await axios.post(
        `${API_BASE}/users/calculations`,
        {
          monthly_income: calcIncome,
          spending: calcSpending,
          top_cards: top3,
          net_savings: top3[0]?.net_annual_savings ?? 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true;
    } catch {
      return false;
    }
  };

  const handleRankingUpdate = (data) => {
    setRankingData(data);
    setRankingLoading(false);
  };

  const handleRecalculate = () => {
    setShowResults(false);
    setCalcResults([]);
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToResults = () => {
    const el = document.getElementById('results-section') || document.getElementById('calculator');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="db-page">
      <DashboardNavbar firstName={userName} />

      {/* Welcome banner */}
      <div className="db-banner">
        <div className="cf-container">
          <div className="db-banner-inner">
            <div>
              <p className="db-welcome">
                Welcome 👋{userName ? ` ${userName}.` : '.'}
              </p>
              <h1 className="db-title">Best Credit Card Calculator</h1>
              <p className="db-subtitle">
                Don't let your rewards go to waste. Use our calculator to find credit cards
                in the UAE that actually pay you back based on your lifestyle.
              </p>
            </div>
            <button className="db-view-cards-link" onClick={scrollToResults}>
              View Recommended Cards →
            </button>
          </div>
        </div>
      </div>

      <CalculatorSection
        ref={calculatorRef}
        onResults={handleResults}
        onRankingUpdate={handleRankingUpdate}
      />

      {showResults && (
        <TopResults results={calcResults} onRecalculate={handleRecalculate} onSave={handleSaveCalc} />
      )}

      <CardRankingTable rankingData={rankingData} loading={rankingLoading} />

      <Footer />
    </div>
  );
}
