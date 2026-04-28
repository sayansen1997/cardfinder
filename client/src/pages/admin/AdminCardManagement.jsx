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

const THUMB_COLORS = {
  cashback: '#1A3C5E',
  travel:   '#0F4C2A',
  rewards:  '#4A1C6B',
  flexi:    '#C9920A',
};

function thumbColor(type) {
  return THUMB_COLORS[(type || '').toLowerCase()] || '#1A3C5E';
}

function cardInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtCap(val) {
  if (val == null) return 'Unlimited';
  return `AED ${Number(val).toLocaleString()}`;
}

// ——— Edit Cashback Modal ———

function EditCashbackModal({ card, categories, onClose, onSaved }) {
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAxios().get(`/admin/cards/${card.id}/rates`)
      .then((res) => {
        const map = {};
        res.data.forEach((r) => { map[r.slug] = r.cashback_rate; });
        setRates(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [card.id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await adminAxios().put(`/admin/cards/${card.id}/rates`, { rates });
      onSaved();
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <div>
            <div className="adm-modal-title">{card.name}</div>
            <div className="adm-modal-subtitle">Edit Cashback by Category</div>
          </div>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="adm-modal-body">
          <div className="adm-rate-table-head">
            <span>SPENDING CATEGORY</span>
            <span>CASHBACK RATE (%)</span>
          </div>

          {loading ? (
            <p className="adm-modal-loading">Loading rates…</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.slug} className="adm-rate-row">
                <span className="adm-rate-cat">
                  <span className="adm-rate-icon">{cat.icon}</span>
                  {cat.label}
                </span>
                <div className="adm-rate-input-wrap">
                  <input
                    type="number"
                    className="adm-rate-input"
                    step="0.01"
                    min="0"
                    max="100"
                    value={rates[cat.slug] ?? ''}
                    placeholder="0"
                    onChange={(e) => setRates((prev) => ({ ...prev, [cat.slug]: e.target.value }))}
                  />
                  <span className="adm-rate-pct">%</span>
                </div>
              </div>
            ))
          )}

          {error && <p className="adm-modal-error">{error}</p>}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="adm-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— Add New Card Modal ———

function AddCardModal({ categories, cardTypes, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    bank: '',
    card_category: cardTypes[0] || 'cashback',
    annual_fee: '',
    min_salary: '',
    key_benefits: '',
  });
  const [rates, setRates] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleImage = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleImage(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.bank.trim()) {
      setError('Card name and bank are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adminAxios().post('/admin/cards', { ...form, rates });
      onSaved();
    } catch {
      setError('Failed to add card. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal adm-modal-lg">
        <div className="adm-add-modal-header">
          <div>
            <div className="adm-add-modal-title">Add New Card</div>
            <div className="adm-add-modal-subtitle">Define asset parameters and reward structures</div>
          </div>
          <button className="adm-add-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="adm-modal-body">
          {/* Image upload zone */}
          <div
            className={`adm-upload-zone${imagePreview ? ' has-preview' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Card preview" className="adm-upload-preview" />
            ) : (
              <>
                <span className="adm-upload-icon">☁</span>
                <p className="adm-upload-label">Click to upload or drag and drop</p>
                <p className="adm-upload-hint">PNG, JPG or SVG (Recommended size: 1011 × 638px)</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleImage(e.target.files[0])}
          />

          {/* Row 1: Card Name | Bank Name */}
          <div className="adm-form-row2">
            <div className="adm-form-group">
              <label className="adm-form-label">Card Name *</label>
              <input
                className="adm-form-input"
                placeholder="e.g. Falcon Priority Plus"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Bank Name *</label>
              <input
                className="adm-form-input"
                placeholder="e.g. Emirates NBD"
                value={form.bank}
                onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 2: Card Category | Annual Fee */}
          <div className="adm-form-row2">
            <div className="adm-form-group">
              <label className="adm-form-label">Card Category</label>
              <select
                className="adm-form-input"
                value={form.card_category}
                onChange={(e) => setForm((f) => ({ ...f, card_category: e.target.value }))}
              >
                {cardTypes.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Annual Fee (AED)</label>
              <input
                className="adm-form-input"
                type="number"
                min="0"
                placeholder="0.00"
                value={form.annual_fee}
                onChange={(e) => setForm((f) => ({ ...f, annual_fee: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 3: Min Income | Max Cap */}
          <div className="adm-form-row2" style={{ marginBottom: '20px' }}>
            <div className="adm-form-group">
              <label className="adm-form-label">Minimum Income (AED)</label>
              <input
                className="adm-form-input"
                type="number"
                min="0"
                placeholder="5,000"
                value={form.min_salary}
                onChange={(e) => setForm((f) => ({ ...f, min_salary: e.target.value }))}
              />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Maximum Cap (AED/Month)</label>
              <input
                className="adm-form-input"
                type="number"
                min="0"
                placeholder="Unlimited"
                value={form.monthly_cap || ''}
                onChange={(e) => setForm((f) => ({ ...f, monthly_cap: e.target.value }))}
              />
            </div>
          </div>

          {/* Key Benefits */}
          <div className="adm-form-group" style={{ marginBottom: '20px' }}>
            <label className="adm-form-label">Key Benefits (one per line)</label>
            <textarea
              className="adm-form-input adm-form-textarea"
              placeholder={'Up to 5% cashback on groceries\nFree for life'}
              rows={3}
              value={form.key_benefits}
              onChange={(e) => setForm((f) => ({ ...f, key_benefits: e.target.value }))}
            />
          </div>

          {/* Cashback setup */}
          <div className="adm-cashback-section">
            <div className="adm-cashback-section-title">
              <span>🏷</span> Initial Cashback Setup
            </div>
            <div className="adm-cashback-grid">
              {categories.map((cat) => (
                <div key={cat.slug} className="adm-cashback-cell">
                  <label className="adm-cashback-label">{cat.slug.toUpperCase()}</label>
                  <div className="adm-cashback-input-wrap">
                    <input
                      type="number"
                      className="adm-cashback-input"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={rates[cat.slug] || ''}
                      onChange={(e) => setRates((r) => ({ ...r, [cat.slug]: e.target.value }))}
                    />
                    <span className="adm-cashback-pct">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="adm-modal-error">{error}</p>}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="adm-btn-save" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Adding…' : 'Add Card →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— Main Page ———

const LIMIT = 12;

export default function AdminCardManagement() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [incomeFilter, setIncomeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [cardTypes, setCardTypes] = useState(['cashback']);

  const [editCard, setEditCard] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const searchTimer = useRef(null);

  const fetchCards = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await adminAxios().get('/admin/cards', {
        params: { page: pg, limit: LIMIT, search, category: categoryFilter, income: incomeFilter },
      });
      setCards(res.data.cards);
      setTotal(res.data.total);
      setPage(pg);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, incomeFilter, navigate]);

  // Initial data load
  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/categories`),
      axios.get(`${API_BASE}/income-brackets`),
      adminAxios().get('/admin/card-types'),
    ]).then(([catsRes, brksRes, typesRes]) => {
      setCategories(catsRes.data);
      setBrackets(brksRes.data);
      if (typesRes.data.length) setCardTypes(typesRes.data);
    }).catch((err) => {
      if (err.response?.status === 401) navigate('/admin/login');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cards when filters change
  useEffect(() => {
    fetchCards(1);
  }, [categoryFilter, incomeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchCards(1), 350);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setIncomeFilter('');
  };

  const handleEditSaved = () => {
    setEditCard(null);
    fetchCards(page);
  };

  const handleAddSaved = () => {
    setShowAdd(false);
    fetchCards(1);
  };

  const handleDeleteCard = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminAxios().delete(`/admin/cards/${id}`);
      fetchCards(page);
    } catch {
      alert('Failed to delete card. Please try again.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <AdminNavbar />

      <div className="adm-page">
        {/* Header */}
        <div className="adm-page-header">
          <div>
            <h1 className="adm-page-title">Card Management</h1>
            <p className="adm-page-subtitle">Configure and update the financial product ecosystem.</p>
          </div>
          <button className="adm-btn-add" onClick={() => setShowAdd(true)}>
            + Add New Card
          </button>
        </div>

        {/* Filter bar */}
        <div className="adm-filter-bar">
          <div className="adm-search-wrap">
            <span className="adm-search-icon">🔍</span>
            <input
              className="adm-search-input"
              placeholder="Search card names, banks, or features..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <select
            className="adm-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>

          <select
            className="adm-filter-select"
            value={incomeFilter}
            onChange={(e) => setIncomeFilter(e.target.value)}
          >
            <option value="">Any Income Range</option>
            {brackets.map((b) => (
              <option key={b.id} value={b.value}>{b.label} / month</option>
            ))}
          </select>

          <button className="adm-btn-clear" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Card Name</th>
                <th>Category</th>
                <th>Annual Fee (AED)</th>
                <th>Min. Income (AED)</th>
                <th>Max. Cap</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="adm-table-loading">Loading…</td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan="7" className="adm-table-loading">No cards found.</td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id}>
                    <td>
                      <div className="adm-card-name-cell">
                        <div
                          className="adm-card-thumb"
                          style={{ background: thumbColor(card.card_category) }}
                        >
                          {cardInitials(card.name)}
                        </div>
                        <div>
                          <div className="adm-card-name">{card.name}</div>
                          <div className="adm-card-bank">{card.bank}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="adm-type-badge">
                        {(card.card_category || 'cashback').charAt(0).toUpperCase() +
                          (card.card_category || 'cashback').slice(1)}
                      </span>
                    </td>
                    <td>{Number(card.annual_fee).toLocaleString()}</td>
                    <td>{Number(card.min_salary).toLocaleString()}</td>
                    <td>{fmtCap(card.max_cap)}</td>
                    <td>{formatDate(card.created_at)}</td>
                    <td>
                      <div className="adm-actions">
                        <button
                          className="adm-action-icon"
                          title="Edit cashback rates"
                          onClick={() => setEditCard(card)}
                        >
                          ✏️
                        </button>
                        <button
                          className="adm-action-cashback"
                          onClick={() => setEditCard(card)}
                        >
                          CASHBACK %
                        </button>
                        <button
                          className="adm-action-icon"
                          title="Delete card"
                          onClick={() => handleDeleteCard(card.id, card.name)}
                          style={{ color: '#DC2626' }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="adm-pagination">
          <span className="adm-page-info">
            Showing {cards.length} of {total} Cards
          </span>
          <div className="adm-page-pills">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`adm-page-pill${p === page ? ' active' : ''}`}
                onClick={() => fetchCards(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {editCard && (
        <EditCashbackModal
          card={editCard}
          categories={categories}
          onClose={() => setEditCard(null)}
          onSaved={handleEditSaved}
        />
      )}

      {showAdd && (
        <AddCardModal
          categories={categories}
          cardTypes={cardTypes}
          onClose={() => setShowAdd(false)}
          onSaved={handleAddSaved}
        />
      )}
    </>
  );
}
