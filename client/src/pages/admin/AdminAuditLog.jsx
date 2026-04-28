import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/admin/AdminNavbar';
import API_BASE from '../../utils/api';
import './admin.css';

// ——— Helpers ———

function adminAxios() {
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
  });
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

const ACTION_STYLES = {
  'UPDATED CASHBACK': { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0' },
  'MODIFIED APR':     { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
  'STATUS CHANGE':    { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
  'ASSET UPDATE':     { bg: '#F3E8FF', color: '#6B21A8', border: '#E9D5FF' },
};

function ActionBadge({ type }) {
  const style = ACTION_STYLES[type] || { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
  return (
    <span
      className="adm-action-badge"
      style={{ background: style.bg, color: style.color, borderColor: style.border }}
    >
      {type || 'UNKNOWN'}
    </span>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

const LIMIT = 10;

export default function AdminAuditLog() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [cardFilter, setCardFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(() => isoDate(new Date(Date.now() - 30 * 864e5)));
  const [dateTo, setDateTo] = useState(() => isoDate(new Date()));
  const [showDateInputs, setShowDateInputs] = useState(false);

  const [actionTypes, setActionTypes] = useState([]);
  const [exporting, setExporting] = useState(false);

  const cardTimer = useRef(null);
  const dateRef = useRef(null);

  const fetchLogs = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await adminAxios().get('/admin/audit', {
        params: { page: pg, limit: LIMIT, card: cardFilter, type: typeFilter, from: dateFrom, to: dateTo },
      });
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPage(pg);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [cardFilter, typeFilter, dateFrom, dateTo, navigate]);

  useEffect(() => {
    adminAxios().get('/admin/audit/types')
      .then((res) => setActionTypes(res.data))
      .catch((err) => { if (err.response?.status === 401) navigate('/admin/login'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchLogs(1);
  }, [typeFilter, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCardChange = (val) => {
    setCardFilter(val);
    clearTimeout(cardTimer.current);
    cardTimer.current = setTimeout(() => fetchLogs(1), 300);
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setShowDateInputs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await adminAxios().get('/admin/audit', {
        params: { export: 'csv', card: cardFilter, type: typeFilter, from: dateFrom, to: dateTo },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setExporting(false);
    }
  };

  const dateRangeLabel = () => {
    if (dateFrom === isoDate(new Date(Date.now() - 30 * 864e5)) && dateTo === isoDate(new Date())) {
      return 'Last 30 Days';
    }
    return `${formatDate(dateFrom)} – ${formatDate(dateTo)}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const pageNums = getPageNumbers(page, totalPages);
  const showing = { from: (page - 1) * LIMIT + 1, to: Math.min(page * LIMIT, total) };

  return (
    <>
      <AdminNavbar />

      <div className="adm-page">
        {/* Header */}
        <div className="adm-page-header">
          <div>
            <h1 className="adm-page-title">Audit Logs</h1>
            <p className="adm-page-subtitle">
              Track every administrative action across with precision and accountability.
            </p>
          </div>
          <button className="adm-btn-export" onClick={handleExportCsv} disabled={exporting}>
            {exporting ? 'Exporting…' : '⬇ Export CSV'}
          </button>
        </div>

        {/* Filter bar — 3 columns */}
        <div className="adm-audit-filter-bar">
          {/* Date range */}
          <div className="adm-filter-col" ref={dateRef}>
            <span className="adm-filter-label">DATE RANGE</span>
            <div
              className="adm-filter-field adm-filter-clickable"
              onClick={() => setShowDateInputs((v) => !v)}
            >
              <span className="adm-filter-field-icon">📅</span>
              <span>{dateRangeLabel()}</span>
            </div>
            {showDateInputs && (
              <div className="adm-date-picker-dropdown">
                <div className="adm-date-row">
                  <label>From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="adm-date-input"
                  />
                </div>
                <div className="adm-date-row">
                  <label>To</label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    max={isoDate(new Date())}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="adm-date-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card name */}
          <div className="adm-filter-col">
            <span className="adm-filter-label">CARD NAME</span>
            <div className="adm-filter-field">
              <span className="adm-filter-field-icon">💳</span>
              <input
                className="adm-filter-text-input"
                placeholder="Search cards..."
                value={cardFilter}
                onChange={(e) => handleCardChange(e.target.value)}
              />
            </div>
          </div>

          {/* Change type */}
          <div className="adm-filter-col">
            <span className="adm-filter-label">CHANGE TYPE</span>
            <div className="adm-filter-field">
              <select
                className="adm-filter-select-inline"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Changes</option>
                {actionTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Audit table */}
        <div className="adm-table-wrap">
          <table className="adm-table adm-audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action Performed</th>
                <th>Card Name</th>
                <th>Field Changed</th>
                <th>Old Value</th>
                <th>New Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="adm-table-loading">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" className="adm-table-loading">No audit logs found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="adm-log-date">{formatDate(log.changed_at)}</div>
                      <div className="adm-log-time">{formatTime(log.changed_at)}</div>
                    </td>
                    <td><ActionBadge type={log.action_type} /></td>
                    <td className="adm-log-card-name">{log.card_name || '—'}</td>
                    <td className="adm-log-field">{log.field_name || '—'}</td>
                    <td className="adm-log-old">{log.old_value || '—'}</td>
                    <td className="adm-log-new">{log.new_value || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="adm-pagination">
          <span className="adm-page-info">
            {total === 0
              ? 'No logs found'
              : `Showing ${showing.from} – ${showing.to} of ${total} logs`}
          </span>

          <div className="adm-page-pills">
            <button
              className="adm-page-pill adm-page-arrow"
              disabled={page <= 1}
              onClick={() => fetchLogs(page - 1)}
            >
              ‹
            </button>

            {pageNums.map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="adm-page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`adm-page-pill${p === page ? ' active adm-page-dark' : ''}`}
                  onClick={() => fetchLogs(p)}
                >
                  {p}
                </button>
              )
            )}

            <button
              className="adm-page-pill adm-page-arrow"
              disabled={page >= totalPages}
              onClick={() => fetchLogs(page + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
