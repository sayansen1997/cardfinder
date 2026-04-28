import { Link, useLocation, useNavigate } from 'react-router-dom';

function EagleLogo() {
  return (
    <svg width="30" height="24" viewBox="0 0 34 28" fill="none" aria-hidden="true">
      <path
        d="M17 0 L7 9 H1 L7 15 L1 22 L11 18 L15 28 L17 24 L19 28 L23 18 L33 22 L27 15 L33 9 H27 Z"
        fill="#C9920A"
      />
    </svg>
  );
}

function getAdminInitial() {
  const token = localStorage.getItem('adminToken');
  if (!token) return 'A';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.email || 'A').charAt(0).toUpperCase();
  } catch {
    return 'A';
  }
}

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="adm-navbar">
      <Link to="/admin/cards" className="adm-navbar-logo">
        <EagleLogo />
        <span className="adm-navbar-logo-text">
          CARD&nbsp;<span className="adm-gold-text">FINDER</span>
        </span>
      </Link>

      <div className="adm-navbar-center">
        <Link
          to="/admin/cards"
          className={`adm-navbar-link${isActive('/admin/cards') ? ' active' : ''}`}
        >
          Card Management
        </Link>
        <Link
          to="/admin/audit"
          className={`adm-navbar-link${isActive('/admin/audit') ? ' active' : ''}`}
        >
          Audit Log
        </Link>
      </div>

      <div className="adm-navbar-right">
        <div className="adm-avatar">{getAdminInitial()}</div>
        <button className="adm-logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
