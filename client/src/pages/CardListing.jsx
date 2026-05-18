import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Calculator } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';
import API_BASE from '../utils/api';
import { CARD_CATEGORY_FILTERS, getCardsForCategory } from '../utils/cardFilters';
import '../styles/card-listing.css';

const BANK_COLORS = {
  'ADCB': '#0D1B2A',
  'Emirates NBD': '#8B0000',
  'HSBC': '#DB0011',
  'Dubai First': '#003C2D',
  'Liv': '#FFD100',
  'Rakbank': '#C8102E',
  'Emirates Islamic': '#003E2A',
  'Mashreq': '#FF6B35',
  'FAB': '#00284C',
  'Ajman Bank': '#005EB8',
  'Al Hilal Bank': '#0066B3',
  'CBD': '#003366',
  'ADIB': '#8B0000',
};

const getBankColor = (bank) => BANK_COLORS[bank] || '#001A3D';

const getBankInitials = (bank) => {
  if (!bank) return 'CC';
  const parts = bank.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return bank.substring(0, 2).toUpperCase();
};

const CardTile = ({ card }) => {
  const navigate = useNavigate();
  const bankColor = getBankColor(card.bank);
  const initials = getBankInitials(card.bank);
  const raw = card.card_category || 'Cashback';
  const cardCategoryLabel = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <div className="cl-card-tile">
      <div className="cl-card-image-wrapper">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            style={{ maxWidth: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '112px',
            background: bankColor,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'Manrope',
            fontSize: '32px',
            fontWeight: 800,
          }}>
            {initials}
          </div>
        )}
      </div>

      <div className="cl-card-body">
        <div style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          background: '#FEF3C7',
          color: '#92400E',
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '4px 12px',
          borderRadius: '999px',
        }}>
          {cardCategoryLabel}
        </div>

        <h3 className="cl-card-name">{card.name}</h3>
        <div className="cl-card-bank">{card.bank}</div>

        <button
          className="cl-select-btn"
          onClick={() => navigate(`/cards/${card.id}`)}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default function CardListing() {
  const navigate = useNavigate();
  const token = localStorage.getItem('userToken');

  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [annualFeeFilter, setAnnualFeeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { returnTo: '/cards' } });
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE}/cards`)
      .then((res) => {
        const activeCards = (res.data || []).filter((c) => c.status === 'active');
        setAllCards(activeCards);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch cards:', err);
        setLoading(false);
      });
  }, [token]);

  const filteredCards = useMemo(() => {
    let result = categoryFilter
      ? getCardsForCategory(allCards, categoryFilter)
      : allCards;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (c) => c.name?.toLowerCase().includes(q) || c.bank?.toLowerCase().includes(q)
      );
    }

    if (annualFeeFilter === 'free') {
      result = result.filter((c) => Number(c.annual_fee) === 0);
    } else if (annualFeeFilter === 'under500') {
      result = result.filter((c) => Number(c.annual_fee) > 0 && Number(c.annual_fee) < 500);
    } else if (annualFeeFilter === '500plus') {
      result = result.filter((c) => Number(c.annual_fee) >= 500);
    }

    return result;
  }, [allCards, categoryFilter, searchTerm, annualFeeFilter]);

  if (!token) return null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
        <DashboardNavbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ fontFamily: 'Inter', fontSize: '14px', color: '#6B7280' }}>
            Loading cards...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <DashboardNavbar />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 40px' }}>
        <h1 style={{
          fontFamily: 'Manrope',
          fontSize: '32px',
          fontWeight: 800,
          color: '#001A3D',
          margin: '0 0 24px',
        }}>
          Credit Cards in the UAE
        </h1>

        {/* Filters Row */}
        <div className="cl-filters-row">
          <div className="cl-search-wrapper">
            <Search size={16} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search cards by name or bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={annualFeeFilter}
            onChange={(e) => setAnnualFeeFilter(e.target.value)}
          >
            <option value="all">All Fees</option>
            <option value="free">Free for Life</option>
            <option value="under500">Under AED 500</option>
            <option value="500plus">AED 500+</option>
          </select>
        </div>

        {/* Two-column layout */}
        <div className="cl-main-layout">
          {/* Sidebar */}
          <aside className="cl-sidebar">
            <p className="cl-sidebar-title">Filter by</p>
            <button
              className={`cl-cat-tab${categoryFilter === null ? ' active' : ''}`}
              onClick={() => setCategoryFilter(null)}
            >
              All Cards
            </button>
            {CARD_CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.id}
                className={`cl-cat-tab${categoryFilter === cat.id ? ' active' : ''}`}
                onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </aside>

          {/* Card grid */}
          <main>
            <div className="cl-result-count">
              Showing {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}
            </div>

            {filteredCards.length === 0 ? (
              <div className="cl-empty">
                <p>No cards match your filters</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setAnnualFeeFilter('all');
                    setCategoryFilter(null);
                  }}
                  style={{ color: '#E5A00D', textDecoration: 'underline' }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="cl-card-grid">
                {filteredCards.map((card) => (
                  <CardTile key={card.id} card={card} />
                ))}
              </div>
            )}
          </main>
        </div>

      </div>

      <section
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '40px 24px 60px',
        }}
      >
        <div
          style={{
            background: '#001A3D',
            borderRadius: '20px',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '24px',
          }}
        >
          <h3 style={{
            color: '#FFFFFF',
            textAlign: 'center',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '22px',
            fontStyle: 'normal',
            fontWeight: 700,
            lineHeight: '32px',
            margin: 0,
          }}>
            Calculate the exact cashback you could earn in 60 seconds
          </h3>

          <button
            onClick={() => {
              navigate('/');
              setTimeout(() => {
                const calcSection = document.getElementById('calculator-section')
                  || document.querySelector('.cf-calculator');
                if (calcSection) {
                  calcSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
            style={{
              background: '#C9920A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 28px',
              fontFamily: 'Manrope',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Calculator size={18} color="white" />
            Go to Calculator
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
