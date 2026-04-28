import { Link, useLocation, useNavigate } from 'react-router-dom';


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
        <img src="/card-finder_logo.svg" alt="Card Finder" style={{ height: '36px', width: 'auto' }} />
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
