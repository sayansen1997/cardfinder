import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../utils/api';
import HomeNavbar from '../components/HomeNavbar';
import HeroSection from '../components/HeroSection';
import CuratedSection from '../components/CuratedSection';
import CalculatorSection from '../components/CalculatorSection';
import TopResults from '../components/TopResults';
import CardRankingTable from '../components/CardRankingTable';
import WhySection from '../components/WhySection';
import Footer from '../components/Footer';
import './home.css';

export default function HomePage() {
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [rankingData, setRankingData] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [calcResults, setCalcResults] = useState([]);
  const [calcSpending, setCalcSpending] = useState({});
  const [calcIncome, setCalcIncome] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const calculatorRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE}/cards`)
      .then((res) => { setCards(res.data); setCardsLoading(false); })
      .catch(() => setCardsLoading(false));
  }, []);

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    const top3 = calcResults.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.name,
      bank: c.bank,
      net_annual_savings: c.net_annual_savings,
      cashback_breakdown: c.cashback_breakdown,
    }));
    const payload = {
      monthly_income: calcIncome,
      spending: calcSpending,
      top_cards: top3,
      net_savings: top3[0]?.net_annual_savings ?? 0,
    };
    if (!token) {
      localStorage.setItem('pendingCalculation', JSON.stringify(payload));
      return false;
    }
    try {
      await axios.post(`${API_BASE}/users/calculations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    scrollToCalculator();
  };

  return (
    <div className="cf-page">
      <HomeNavbar />

      <HeroSection onCalculateClick={scrollToCalculator} />

      <CuratedSection cards={cards} loading={cardsLoading} />

      {/* Calculator CTA Banner */}
      <div className="cf-calc-banner">
        <div className="cf-container">
          <h3>Calculate the exact cashback you could earn in 60 seconds</h3>
          <button className="cf-btn-gold" onClick={scrollToCalculator}>
            Go to Calculator
          </button>
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

      <WhySection />

      <Footer />
    </div>
  );
}
