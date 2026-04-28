import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './signup.css';

const FEATURES = [
  {
    icon: '📊',
    title: 'Smart Comparisons',
    desc: 'Compare cashback rates, annual fees, and benefits across all UAE credit cards in one place.',
  },
  {
    icon: '💾',
    title: 'Save calculations',
    desc: 'Save your spending profile and calculation results to revisit and update anytime.',
  },
  {
    icon: '🏆',
    title: 'Access personalized rankings',
    desc: 'Get a ranked list of cards tailored to your exact spending patterns and income.',
  },
];

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function DemoModal({ onClose, onContinue }) {
  return (
    <div
      className="su-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="su-modal">
        <span className="su-modal-icon">🔐</span>
        <h3 className="su-modal-title">Google OAuth Coming Soon</h3>
        <p className="su-modal-text">
          Google Sign-In is not yet configured. For demo purposes, click Continue to
          proceed through the signup flow.
        </p>
        <div className="su-modal-actions">
          <button className="su-modal-continue" onClick={onContinue}>
            Continue as Demo User →
          </button>
          <button className="su-modal-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignUpStep1() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="su-page">
      {/* Left panel */}
      <div className="su-left">
        <div className="su-logo">
          <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
        </div>

        <h1 className="su-heading">
          Find the <span className="su-gold">best credit card</span> for your spending in the UAE.
        </h1>
        <p className="su-tagline">Stop Guessing. Start Saving.</p>

        <div className="su-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="su-feature-item">
              <div className="su-feature-icon">{f.icon}</div>
              <div>
                <div className="su-feature-title">{f.title}</div>
                <div className="su-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="su-right">
        <div className="su-form-box">
          <h2 className="su-form-heading">Create your account</h2>
          <p className="su-form-sub">
            Join thousands of users managing their UAE credit cards effectively.
          </p>

          <button className="su-google-btn" onClick={() => setShowModal(true)}>
            <GoogleIcon />
            Sign in with Google
          </button>

          <p className="su-login-line">
            Already have an account?{' '}
            <button className="su-link-btn" onClick={() => navigate('/login')}>
              Log in
            </button>
          </p>
        </div>
      </div>

      {showModal && (
        <DemoModal
          onClose={() => setShowModal(false)}
          onContinue={() => navigate('/signup/step2', { state: { name: 'Ahmed' } })}
        />
      )}
    </div>
  );
}
