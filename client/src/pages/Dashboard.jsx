import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const [showReactivatedNotice, setShowReactivatedNotice] = useState(
    searchParams.get('reactivated') === 'true'
  );
  const [userName, setUserName] = useState('');

  const [rankingData, setRankingData] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [calcResults, setCalcResults] = useState([]);
  const [calcHiddenCards, setCalcHiddenCards] = useState([]);
  const [calcHiddenCount, setCalcHiddenCount] = useState(0);
  const [calcSpending, setCalcSpending] = useState({});
  const [calcIncome, setCalcIncome] = useState(0);
  const [platformMinSalary, setPlatformMinSalary] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [saveNotification, setSaveNotification] = useState({ visible: false, message: '' });

  const calculatorRef = useRef(null);

  useEffect(() => {
    if (showReactivatedNotice) {
      const timer = setTimeout(() => setShowReactivatedNotice(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showReactivatedNotice]);

  useEffect(() => {
    // Quick first-paint from localStorage, then confirm with API
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName((storedUser.full_name || '').split(' ')[0]);

    const token = localStorage.getItem('userToken');
    if (!token) return;
    axios
      .get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUserName((res.data.full_name || '').split(' ')[0]))
      .catch(() => {});

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
    const cards = Array.isArray(data) ? data : (data?.cards || []);
    setCalcResults(cards);
    setCalcHiddenCards(Array.isArray(data) ? [] : (data?.hidden_cards || []));
    setCalcHiddenCount(Array.isArray(data) ? 0 : (data?.hidden_count || 0));
    setPlatformMinSalary(Array.isArray(data) ? null : (data?.platform_min_salary || null));
    if (meta) {
      setCalcSpending(meta.spending || {});
      setCalcIncome(meta.income || 0);
    }
    setShowResults(true);

    if (meta?.saveAfterAuth) {
      handleSaveCalc(cards, meta.spending, meta.income).then((ok) => {
        if (ok) {
          setSaveNotification({ visible: true, message: 'Calculation saved to your account!' });
          setTimeout(() => setSaveNotification({ visible: false, message: '' }), 4000);
        }
      });
    }
  };

  const handleSaveCalc = async (resultsData, spendingData, incomeData) => {
    const token = localStorage.getItem('userToken');
    if (!token) return false;
    const raw = resultsData || calcResults;
    const cards = Array.isArray(raw) ? raw : (raw?.cards || []);
    const spending = spendingData || calcSpending;
    const income = incomeData || calcIncome;
    const top3 = cards.slice(0, 3).map((c) => ({
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
          monthly_income: income,
          spending,
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
    setRankingData(Array.isArray(data) ? data : (data?.cards || []));
    setRankingLoading(false);
  };

  const handleRecalculate = () => {
    setShowResults(false);
    setCalcResults([]);
    setCalcHiddenCards([]);
    setCalcHiddenCount(0);
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToResults = () => {
    const el = document.getElementById('results-section') || document.getElementById('calculator');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="db-page">
      <DashboardNavbar firstName={userName} />

      {saveNotification.visible && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#D1FAE5',
          color: '#065F46',
          padding: '12px 20px',
          borderRadius: '8px',
          fontFamily: 'Inter',
          fontSize: '14px',
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap',
        }}>
          <CheckCircle size={18} color="#10B981" />
          {saveNotification.message}
        </div>
      )}

      {showReactivatedNotice && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '8px', padding: '12px 16px', margin: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Inter', fontSize: '14px', color: '#065F46', fontWeight: 600 }}>
          <CheckCircle size={20} color="#10B981" />
          Welcome back! Your account has been reactivated successfully.
        </div>
      )}

      {/* Welcome banner */}
      <div className="db-banner">
        <div className="cf-container">
          <div className="db-banner-inner">
            <div>
              <p className="db-welcome">
                Welcome 👋{userName ? `, ${userName}.` : '.'}
              </p>
            </div>
            <button className="db-view-cards-link" onClick={scrollToResults}>
              View Recommended Cards <ArrowRight size={16} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
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
        <TopResults
          results={calcResults}
          hiddenCards={calcHiddenCards}
          hiddenCount={calcHiddenCount}
          platformMinSalary={platformMinSalary}
          spending={calcSpending}
          income={calcIncome}
          onRecalculate={handleRecalculate}
          onSave={handleSaveCalc}
        />
      )}

      <CardRankingTable
        rankingData={rankingData}
        loading={rankingLoading}
        hiddenCardIds={new Set((calcHiddenCards || []).filter(h => h.soft).map(h => h.id))}
      />

      <Footer />
    </div>
  );
}
