import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Check, Calculator } from 'lucide-react'
import API_BASE from '../utils/api'
import DashboardNavbar from '../components/DashboardNavbar'
import CardImage from '../components/CardImage'
import CategoryIcon from '../components/CategoryIcon'
import Footer from '../components/Footer'

export default function CardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')

  const netSavings = searchParams.get('net_savings')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}')
    setUserName((stored.full_name || '').split(' ')[0])
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    axios.get(`${API_BASE}/cards/${id}`)
      .then(res => { setCard(res.data); setLoading(false) })
      .catch(err => {
        setError(err.response?.status === 404 ? 'Card not found' : 'Failed to load card details')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div style={{ background: '#F3F4F5', minHeight: '100vh' }}>
        <DashboardNavbar firstName={userName} />
        <div style={{ padding: '80px', textAlign: 'center', color: '#94A3B8', fontFamily: 'Inter' }}>
          Loading card details...
        </div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div style={{ background: '#F3F4F5', minHeight: '100vh' }}>
        <DashboardNavbar firstName={userName} />
        <div style={{ padding: '80px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Manrope', color: '#0D1B2A' }}>{error || 'Card not found'}</h2>
          <button
            onClick={() => navigate('/')}
            style={{ marginTop: '20px', background: '#C9920A', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Manrope', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const isFree = !card.annual_fee || Number(card.annual_fee) === 0
  const rates = card.rates || []
  const sortedRates = [...rates].sort((a, b) => Number(b.cashback_rate) - Number(a.cashback_rate))
  const highestRate = sortedRates.length > 0 ? Number(sortedRates[0].cashback_rate) : 0

  const getTierStatus = (rate) => {
    if (!rate.monthly_cap) return 'unlimited'
    if (Number(rate.cashback_rate) === highestRate && highestRate > 0) return 'priority'
    return 'standard'
  }

  const formatRate = (rate) => {
    const pct = Number(rate) * 100
    return pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(1)}%`
  }

  const benefits = card.key_benefits
    ? card.key_benefits.split(/[,;\n]/).map(b => b.trim()).filter(Boolean)
    : []

  const TH_STYLE = {
    padding: '14px 20px',
    textAlign: 'left',
    color: '#44474E',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '16px',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ background: '#F3F4F5', minHeight: '100vh' }}>
      <DashboardNavbar firstName={userName} />

      <style>{`
        @media (max-width: 768px) {
          .card-detail-hero {
            grid-template-columns: 1fr !important;
            padding: 24px !important;
            gap: 24px !important;
          }
          .card-detail-hero h1 {
            font-size: 26px !important;
          }
          .card-detail-stats {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            padding: 16px !important;
          }
          .card-detail-stat-divider {
            display: none !important;
          }
          .card-detail-stats > div {
            padding: 12px 0;
            border-bottom: 1px solid #E2E8F0;
          }
          .card-detail-stats > div:last-child {
            border-bottom: none;
          }
          .card-detail-cashback-section {
            padding: 24px !important;
          }
          .card-detail-cashback-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .card-detail-cta {
            padding: 32px 24px !important;
          }
          .card-detail-cta h3 {
            font-size: 20px !important;
            line-height: 28px !important;
          }
          .card-detail-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .card-detail-table-wrapper table td {
            padding: 12px 14px !important;
            font-size: 12px !important;
          }
          .card-detail-table-wrapper table th {
            padding: 12px 14px !important;
            font-size: 10px !important;
          }
          .card-detail-section-padding {
            padding: 0 16px 24px !important;
          }
          .card-detail-hero-section {
            padding: 24px 16px !important;
          }
        }

        @media (max-width: 480px) {
          .card-detail-hero h1 {
            font-size: 22px !important;
          }
          .card-detail-cta h3 {
            font-size: 18px !important;
            line-height: 24px !important;
          }
        }
      `}</style>

      {/* SECTION 1 — Hero */}
      <section className="card-detail-hero-section" style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>
        <div
          className="card-detail-hero"
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px 80px 40px 40px',
            display: 'grid',
            gridTemplateColumns: '40% 60%',
            gap: '40px',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Left — Card image */}
          <div style={{
            background: '#F3F4F5',
            borderRadius: '16px',
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '220px',
          }}>
            <div style={{ width: '100%', maxWidth: '340px' }}>
              <CardImage card={card} height={210} />
            </div>
          </div>

          {/* Right — Details */}
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: '#C9920A', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
              {card.bank}
            </div>

            <h1 style={{ fontFamily: 'Manrope', fontSize: '36px', fontWeight: 800, color: '#001A3D', margin: '0 0 16px', lineHeight: 1.2 }}>
              {card.name}
            </h1>

            {benefits.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                {benefits.map((benefit, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: idx < benefits.length - 1 ? '12px' : '0' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#C9920A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '3px' }}>
                      <Check size={12} color="white" strokeWidth={3} />
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#44474E', lineHeight: 1.5 }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                if (card.apply_link) {
                  let url = card.apply_link
                  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
                  window.open(url, '_blank', 'noopener,noreferrer')
                }
              }}
              disabled={!card.apply_link}
              style={{
                background: card.apply_link ? '#DE9C00' : '#D1D5DB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 32px',
                fontFamily: 'Manrope',
                fontSize: '14px',
                fontWeight: 700,
                cursor: card.apply_link ? 'pointer' : 'not-allowed',
                marginBottom: '32px',
              }}
            >
              {card.apply_link ? 'Apply Now' : 'Link Coming Soon'}
            </button>

            {/* Stats box */}
            <div
              className="card-detail-stats"
              style={{
                background: '#F3F4F5',
                borderRadius: '12px',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, color: '#44474E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  NET ANNUAL SAVINGS
                </div>
                <div style={{ fontFamily: 'Manrope', fontSize: '22px', fontWeight: 800, color: '#7F5700' }}>
                  {netSavings ? `AED ${Number(netSavings).toLocaleString()}` : '—'}
                </div>
                {!netSavings && (
                  <div style={{ fontFamily: 'Inter', fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                    Run the calculator
                  </div>
                )}
              </div>

              <div className="card-detail-stat-divider" style={{ width: '1px', height: '40px', background: '#E2E8F0' }} />

              <div>
                <div style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, color: '#44474E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  ANNUAL FEE
                </div>
                <div style={{ fontFamily: 'Manrope', fontSize: '22px', fontWeight: 800, color: '#001A3D' }}>
                  {isFree ? 'Free' : `AED ${Number(card.annual_fee).toLocaleString()}`}
                </div>
                {isFree && (
                  <div style={{ fontFamily: 'Inter', fontSize: '11px', color: '#44474E', marginTop: '2px' }}>
                    Free for Life
                  </div>
                )}
              </div>

              <div className="card-detail-stat-divider" style={{ width: '1px', height: '40px', background: '#E2E8F0' }} />

              <div>
                <div style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, color: '#44474E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  MIN. MONTHLY INCOME
                </div>
                <div style={{ fontFamily: 'Manrope', fontSize: '22px', fontWeight: 800, color: '#001A3D' }}>
                  AED {Number(card.min_salary || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Cashback and Rewards */}
      <section className="card-detail-section-padding" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 40px' }}>
        <div className="card-detail-cashback-section" style={{ background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

          <div className="card-detail-cashback-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontFamily: 'Manrope', fontSize: '28px', fontWeight: 800, color: '#001A3D', margin: '0 0 8px' }}>
                Cashback and Rewards
              </h2>
              <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#44474E', margin: 0 }}>
                Strategic cashback rates designed for your lifestyle.
              </p>
            </div>
            {card.max_cap && (
              <div style={{ background: '#F3F4F5', border: '1px solid #E5E7EB', borderRadius: '999px', padding: '8px 16px', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: '#7F5700' }}>
                Annual Cashback Cap: AED {Number(card.max_cap).toLocaleString()}
              </div>
            )}
          </div>

          {sortedRates.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'Inter', fontSize: '14px' }}>
              No cashback rates available for this card.
            </div>
          ) : (
            <div className="card-detail-table-wrapper" style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F3F4F5' }}>
                    <th style={TH_STYLE}>Spending Category</th>
                    <th style={TH_STYLE}>Cashback Rate</th>
                    <th style={TH_STYLE}>Monthly Cap</th>
                    <th style={TH_STYLE}>Tier Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRates.map((rate, i) => {
                    const tier = getTierStatus(rate)
                    return (
                      <tr key={rate.category_id || i} style={{ borderTop: '1px solid #F3F4F5' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CategoryIcon name={rate.category_icon} size={18} color="#94A3B8" />
                            <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#001A3D' }}>
                              {rate.category_name?.replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontFamily: 'Manrope', fontSize: '20px', fontWeight: 800, color: '#C9920A' }}>
                          {formatRate(rate.cashback_rate)}
                        </td>
                        <td style={{ padding: '16px 20px', fontFamily: 'Inter', fontSize: '14px', color: '#44474E' }}>
                          {rate.monthly_cap ? `AED ${Number(rate.monthly_cap).toLocaleString()}` : '—'}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {tier === 'priority' && (
                            <span style={{ background: '#001A3D', color: 'white', fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', display: 'inline-block' }}>
                              Priority Tier
                            </span>
                          )}
                          {tier === 'unlimited' && (
                            <span style={{ background: '#D1FAE5', color: '#065F46', fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', display: 'inline-block' }}>
                              UNLIMITED
                            </span>
                          )}
                          {tier === 'standard' && (
                            <span style={{ background: '#F3F4F5', color: '#6B7280', fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', display: 'inline-block' }}>
                              STANDARD
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3 — CTA Banner */}
      <section className="card-detail-section-padding" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 60px' }}>
        <div className="card-detail-cta" style={{
          background: '#001A3D',
          borderRadius: '20px',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
        }}>
          <h3 style={{
            color: '#FFF',
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
              navigate('/')
              setTimeout(() => {
                const calc = document.getElementById('calculator')
                if (calc) calc.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }, 100)
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
  )
}
