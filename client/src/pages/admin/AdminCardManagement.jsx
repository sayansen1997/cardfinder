import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, Pencil, Plus, CloudUpload, Save, Search, ShieldAlert } from 'lucide-react';
import AdminNavbar from '../../components/admin/AdminNavbar';
import CardImage from '../../components/CardImage';
import CategoryIcon from '../../components/CategoryIcon';
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
        res.data.forEach((r) => {
          map[r.slug] = {
            rate: parseFloat((Number(r.cashback_rate) * 100).toFixed(4)).toString(),
            cap: r.monthly_cap != null ? String(r.monthly_cap) : '',
          };
        });
        setRates(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [card.id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const ratesPayload = {};
      Object.entries(rates).forEach(([slug, value]) => {
        ratesPayload[slug] = {
          cashback_rate: (parseFloat(value.rate) || 0) / 100,
          monthly_cap: value.cap !== '' && value.cap !== null ? Number(value.cap) : null,
        };
      });

      await adminAxios().put(`/admin/cards/${card.id}/rates`, { rates: ratesPayload });
      onSaved();
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const setField = (slug, field, value) =>
    setRates((prev) => ({ ...prev, [slug]: { ...prev[slug], [field]: value } }));

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ width: '620px' }}>
        <div className="adm-modal-header">
          <div>
            <div className="adm-modal-title">{card.name}</div>
            <div className="adm-modal-subtitle">Edit Cashback by Category</div>
          </div>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="adm-modal-body">
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', alignItems: 'center', gap: '16px', padding: '10px 0', borderBottom: '2px solid #E5E7EB', marginBottom: '4px' }}>
            <div style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, color: '#44474E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spending Category</div>
            <div style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, color: '#44474E', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Cashback Rate</div>
            <div style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, color: '#44474E', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Monthly Cap</div>
          </div>

          {loading ? (
            <p className="adm-modal-loading">Loading rates…</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.slug} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CategoryIcon name={cat.icon} size={16} color="#94A3B8" />
                  <span style={{ fontFamily: 'Inter', fontSize: '14px', color: '#0D1B2A', fontWeight: 500 }}>{cat.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={rates[cat.slug]?.rate ?? ''}
                    onChange={(e) => setField(cat.slug, 'rate', e.target.value)}
                    style={{ width: '80px', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontSize: '14px', textAlign: 'center' }}
                  />
                  <span style={{ color: '#94A3B8', fontSize: '14px' }}>%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={rates[cat.slug]?.cap ?? ''}
                    onChange={(e) => setField(cat.slug, 'cap', e.target.value)}
                    style={{ width: '90px', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontSize: '14px', textAlign: 'center' }}
                  />
                  <span style={{ color: '#94A3B8', fontSize: '12px', whiteSpace: 'nowrap' }}>AED</span>
                </div>
              </div>
            ))
          )}

          {error && <p className="adm-modal-error">{error}</p>}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="adm-btn-save" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saving ? 'Saving…' : <><Save size={16} color="white" />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— Edit Card Modal ———

function EditCardModal({ cardId, categories, cardCategories, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    adminAxios().get(`/admin/cards/${cardId}`)
      .then((res) => {
        const c = res.data;
        setForm({
          name: c.name || '',
          bank: c.bank || '',
          card_category: c.card_category || 'cashback',
          annual_fee: c.annual_fee ?? '',
          min_salary: c.min_salary ?? '',
          max_cap: c.max_cap ?? '',
          status: c.status || 'active',
          apply_link: c.apply_link || '',
          fee_notes: c.fee_notes || '',
          key_benefits: (c.key_benefits || '').split(',').map((s) => s.trim()).filter(Boolean).join('\n'),
          eligibility_notes: c.eligibility_notes || '',
          existing_image_url: c.image_url || null,
        });
        setLoading(false);
      })
      .catch(() => { setError('Failed to load card.'); setLoading(false); });
  }, [cardId]);

  const handleImage = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleImage(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.bank.trim()) {
      setError('Card name and bank are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('bank', form.bank);
      formData.append('card_category', form.card_category);
      formData.append('annual_fee', form.annual_fee || '0');
      formData.append('min_salary', form.min_salary || '0');
      formData.append('max_cap', form.max_cap || '');
      formData.append('status', form.status);
      formData.append('apply_link', form.apply_link || '');
      formData.append('fee_notes', form.fee_notes || '');
      formData.append('key_benefits', form.key_benefits || '');
      formData.append('eligibility_notes', form.eligibility_notes || '');
      if (imageFile) formData.append('image', imageFile);

      const resp = await fetch(`${API_BASE}/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: formData,
      });
      if (!resp.ok) throw new Error('Server error');
      onSaved();
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) {
    return (
      <div className="adm-modal-overlay">
        <div className="adm-modal" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#6B7280' }}>Loading card details…</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="adm-modal-overlay" onClick={onClose}>
        <div className="adm-modal" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#DC2626' }}>{error || 'Card not found'}</p>
          <button className="adm-btn-cancel" onClick={onClose} style={{ marginTop: 16 }}>Close</button>
        </div>
      </div>
    );
  }

  const preview = imagePreview || form.existing_image_url;

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal adm-modal-lg">
        <div className="adm-add-modal-header">
          <div>
            <div className="adm-add-modal-title">Edit Card</div>
            <div className="adm-add-modal-subtitle">Update card details, image, and reward rates</div>
          </div>
          <button className="adm-add-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="adm-modal-body">
          {/* Image upload */}
          <div
            className={`adm-upload-zone${preview ? ' has-preview' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {preview ? (
              <>
                <img src={preview} alt="Card preview" className="adm-upload-preview" />
                <p style={{ textAlign: 'center', fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                  Click to replace image
                </p>
              </>
            ) : (
              <>
                <CloudUpload size={32} color="#94A3B8" />
                <p className="adm-upload-label">Click to upload or drag and drop</p>
                <p className="adm-upload-hint">PNG, JPG or SVG (Recommended: 1011 × 638px)</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => handleImage(e.target.files[0])} />

          {/* Row 1: Name | Bank */}
          <div className="adm-form-row2">
            <div className="adm-form-group">
              <label className="adm-form-label">Card Name *</label>
              <input className="adm-form-input" value={form.name}
                onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Bank Name *</label>
              <input className="adm-form-input" value={form.bank}
                onChange={(e) => set('bank', e.target.value)} />
            </div>
          </div>

          {/* Row 2: Category | Status */}
          <div className="adm-form-row2">
            <div className="adm-form-group">
              <label className="adm-form-label">Card Category</label>
              <select className="adm-form-input" value={form.card_category}
                onChange={(e) => set('card_category', e.target.value)}>
                <option value="">Select category...</option>
                {cardCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Status</label>
              <select className="adm-form-input" value={form.status}
                onChange={(e) => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Row 3: Annual Fee | Min Income */}
          <div className="adm-form-row2">
            <div className="adm-form-group">
              <label className="adm-form-label">Annual Fee (AED)</label>
              <input className="adm-form-input" type="number" min="0" value={form.annual_fee}
                onChange={(e) => set('annual_fee', e.target.value)} />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Minimum Income (AED)</label>
              <input className="adm-form-input" type="number" min="0" value={form.min_salary}
                onChange={(e) => set('min_salary', e.target.value)} />
            </div>
          </div>

          {/* Row 4: Max Cap | Apply Link */}
          <div className="adm-form-row2" style={{ marginBottom: 20 }}>
            <div className="adm-form-group">
              <label className="adm-form-label">Total Monthly Cashback Cap (AED/Month, blank = unlimited)</label>
              <input className="adm-form-input" type="number" min="0" placeholder="Unlimited"
                value={form.max_cap} onChange={(e) => set('max_cap', e.target.value)} />
              <div style={{ fontFamily: 'Inter', fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                Caps total cashback per month across all categories combined. Use only if the bank has a total monthly limit.
              </div>
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">Apply Link URL</label>
              <input className="adm-form-input" type="url" placeholder="https://..."
                value={form.apply_link} onChange={(e) => set('apply_link', e.target.value)} />
            </div>
          </div>

          {/* Fee Notes */}
          <div className="adm-form-group" style={{ marginBottom: 16 }}>
            <label className="adm-form-label">Fee Notes</label>
            <input className="adm-form-input" placeholder="e.g. Waived first year"
              value={form.fee_notes} onChange={(e) => set('fee_notes', e.target.value)} />
          </div>

          {/* Key Benefits */}
          <div className="adm-form-group" style={{ marginBottom: 16 }}>
            <label className="adm-form-label">Key Benefits (one per line)</label>
            <textarea className="adm-form-input adm-form-textarea" rows={3}
              value={form.key_benefits} onChange={(e) => set('key_benefits', e.target.value)} />
          </div>

          {/* Eligibility Notes */}
          <div className="adm-form-group" style={{ marginBottom: 20 }}>
            <label className="adm-form-label">Eligibility Notes</label>
            <textarea className="adm-form-input adm-form-textarea" rows={2}
              value={form.eligibility_notes}
              onChange={(e) => set('eligibility_notes', e.target.value)} />
          </div>

          {error && <p className="adm-modal-error">{error}</p>}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="adm-btn-save" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saving ? 'Saving…' : <><Save size={16} color="white" />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— Hide Rules Modal ———

const RULE_TYPE_LABELS = {
  category_sum_below: 'Hide if category sum BELOW threshold',
  category_sum_above: 'Hide if category sum ABOVE threshold',
  total_spend_below:  'Hide if total spending BELOW threshold',
  total_spend_above:  'Hide if total spending ABOVE threshold',
  total_spend_range:  'Hide if total spending NOT in range',
  age_above:          'Hide if user age ABOVE threshold',
  age_below:          'Hide if user age BELOW threshold',
};

function HideRulesModal({ card, categories, onClose }) {
  const [rules, setRules] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_type: 'category_sum_below',
    rule_config: { categories: [], threshold: '' },
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRules = () =>
    adminAxios().get(`/admin/cards/${card.id}/hide-rules`).then((res) => setRules(res.data));

  useEffect(() => { loadRules(); }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const configDefaults = {
    category_sum_below: { categories: [], threshold: '' },
    category_sum_above: { categories: [], threshold: '' },
    total_spend_below:  { threshold: '' },
    total_spend_above:  { threshold: '' },
    total_spend_range:  { min: '', max: '' },
    age_above:          { threshold: '' },
    age_below:          { threshold: '' },
  };

  const existingRuleTypes = new Set(rules.map((r) => r.rule_type));
  const availableRuleTypes = Object.entries(RULE_TYPE_LABELS)
    .filter(([val]) => !existingRuleTypes.has(val));

  const handleOpenAddForm = () => {
    const firstType = availableRuleTypes[0]?.[0] || 'category_sum_below';
    setNewRule({ rule_type: firstType, rule_config: configDefaults[firstType] || {}, description: '' });
    setShowAddForm(true);
  };

  const handleAddRule = async () => {
    setSaving(true);
    setError('');
    try {
      await adminAxios().post(`/admin/cards/${card.id}/hide-rules`, newRule);
      await loadRules();
      setShowAddForm(false);
      const nextType = availableRuleTypes[0]?.[0] || 'category_sum_below';
      setNewRule({ rule_type: nextType, rule_config: configDefaults[nextType] || {}, description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Delete this rule?')) return;
    await adminAxios().delete(`/admin/cards/${card.id}/hide-rules/${ruleId}`);
    await loadRules();
  };

  const setRuleType = (type) => {
    setNewRule({ ...newRule, rule_type: type, rule_config: configDefaults[type] || {} });
  };

  const toggleCategory = (slug, checked) => {
    const current = newRule.rule_config.categories || [];
    setNewRule({
      ...newRule,
      rule_config: {
        ...newRule.rule_config,
        categories: checked ? [...current, slug] : current.filter((c) => c !== slug),
      },
    });
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px', border: '1px solid #E5E7EB',
    borderRadius: '6px', fontFamily: 'Inter', fontSize: '13px',
    boxSizing: 'border-box', background: 'white', color: '#0D1B2A', colorScheme: 'light',
  };
  const labelStyle = {
    fontFamily: 'Inter', fontSize: '12px', fontWeight: 600,
    display: 'block', marginBottom: '4px', color: '#374151',
  };

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ width: '640px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="adm-modal-header">
          <div>
            <div className="adm-modal-title">Hide Rules — {card.name}</div>
            <div className="adm-modal-subtitle">Configure when this card should be hidden from recommendations</div>
          </div>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="adm-modal-body">
          {rules.length === 0 && !showAddForm && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280', fontFamily: 'Inter', fontSize: '13px' }}>
              No hide rules configured. This card will show for all eligible users.
            </div>
          )}

          {rules.map((rule) => (
            <div key={rule.id} style={{
              background: '#F9FAFB', borderRadius: '8px', padding: '12px 16px',
              marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: '#0D1B2A' }}>
                  {RULE_TYPE_LABELS[rule.rule_type] || rule.rule_type}
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                  {rule.description || JSON.stringify(rule.rule_config)}
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                  Config: {JSON.stringify(rule.rule_config)}
                </div>
              </div>
              <button
                onClick={() => handleDeleteRule(rule.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '4px', marginLeft: '8px' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {!showAddForm && availableRuleTypes.length > 0 && (
            <button
              onClick={handleOpenAddForm}
              style={{
                background: '#C9920A', color: 'white', border: 'none',
                borderRadius: '8px', padding: '10px 16px', fontFamily: 'Manrope',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '12px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <Plus size={14} /> Add Hide Rule
            </button>
          )}

          {!showAddForm && availableRuleTypes.length === 0 && rules.length > 0 && (
            <div style={{
              padding: '12px 16px', background: '#F3F4F5', borderRadius: '8px',
              fontFamily: 'Inter', fontSize: '13px', color: '#6B7280',
              marginTop: '12px', textAlign: 'center',
            }}>
              All rule types have been added for this card.
            </div>
          )}

          {showAddForm && (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', marginTop: '16px', background: '#FAFAFA' }}>
              <div style={{ fontFamily: 'Manrope', fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>New Hide Rule</div>

              <label style={labelStyle}>Rule Type</label>
              <select
                value={newRule.rule_type}
                onChange={(e) => setRuleType(e.target.value)}
                style={{ ...inputStyle, marginBottom: '12px' }}
              >
                {availableRuleTypes.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              {(newRule.rule_type === 'category_sum_below' || newRule.rule_type === 'category_sum_above') && (
                <>
                  <label style={labelStyle}>Categories (select all that apply)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {categories.map((cat) => (
                      <label key={cat.slug} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontFamily: 'Inter', fontSize: '12px', cursor: 'pointer',
                        padding: '4px 8px', background: 'white', color: '#0D1B2A',
                        border: '1px solid #E5E7EB', borderRadius: '4px', colorScheme: 'light',
                      }}>
                        <input
                          type="checkbox"
                          checked={(newRule.rule_config.categories || []).includes(cat.slug)}
                          onChange={(e) => toggleCategory(cat.slug, e.target.checked)}
                        />
                        {cat.label || cat.name}
                      </label>
                    ))}
                  </div>
                  <label style={labelStyle}>Threshold (AED/month)</label>
                  <input
                    type="number"
                    value={newRule.rule_config.threshold || ''}
                    onChange={(e) => setNewRule({ ...newRule, rule_config: { ...newRule.rule_config, threshold: Number(e.target.value) } })}
                    style={{ ...inputStyle, marginBottom: '12px' }}
                  />
                </>
              )}

              {(newRule.rule_type === 'total_spend_below' || newRule.rule_type === 'total_spend_above') && (
                <>
                  <label style={labelStyle}>Threshold (AED/month)</label>
                  <input
                    type="number"
                    value={newRule.rule_config.threshold || ''}
                    onChange={(e) => setNewRule({ ...newRule, rule_config: { ...newRule.rule_config, threshold: Number(e.target.value) } })}
                    style={{ ...inputStyle, marginBottom: '12px' }}
                  />
                </>
              )}

              {newRule.rule_type === 'total_spend_range' && (
                <>
                  <label style={labelStyle}>Min (AED/month)</label>
                  <input
                    type="number"
                    value={newRule.rule_config.min || ''}
                    onChange={(e) => setNewRule({ ...newRule, rule_config: { ...newRule.rule_config, min: Number(e.target.value) } })}
                    style={{ ...inputStyle, marginBottom: '12px' }}
                  />
                  <label style={labelStyle}>Max (AED/month)</label>
                  <input
                    type="number"
                    value={newRule.rule_config.max || ''}
                    onChange={(e) => setNewRule({ ...newRule, rule_config: { ...newRule.rule_config, max: Number(e.target.value) } })}
                    style={{ ...inputStyle, marginBottom: '12px' }}
                  />
                </>
              )}

              {(newRule.rule_type === 'age_above' || newRule.rule_type === 'age_below') && (
                <>
                  <label style={labelStyle}>Age threshold (years)</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={newRule.rule_config.threshold || ''}
                    onChange={(e) => setNewRule({ ...newRule, rule_config: { ...newRule.rule_config, threshold: Number(e.target.value) } })}
                    style={{ ...inputStyle, marginBottom: '12px' }}
                  />
                </>
              )}

              <label style={labelStyle}>Description (shown to user when card is hidden)</label>
              <input
                type="text"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="e.g., Card requires more grocery + dining spending"
                style={{ ...inputStyle, marginBottom: '16px' }}
              />

              {error && <p style={{ color: '#DC2626', fontFamily: 'Inter', fontSize: '12px', marginBottom: '8px' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setShowAddForm(false); setError(''); }}
                  style={{ background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '6px', padding: '8px 16px', fontFamily: 'Inter', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRule}
                  disabled={saving}
                  style={{ background: '#C9920A', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontFamily: 'Manrope', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Saving…' : 'Save Rule'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-save" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ——— Add New Card Modal ———

function AddCardModal({ categories, cardCategories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    bank: '',
    card_category: '',
    annual_fee: '',
    min_salary: '',
    max_cap: '',
    key_benefits: '',
  });
  const [rates, setRates] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleImage = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
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
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('bank', form.bank);
      formData.append('card_category', form.card_category);
      formData.append('annual_fee', form.annual_fee || '0');
      formData.append('min_salary', form.min_salary || '0');
      formData.append('max_cap', form.max_cap || '');
      formData.append('key_benefits', form.key_benefits || '');
      const ratesPayload = {};
      Object.entries(rates).forEach(([slug, val]) => {
        const rate = typeof val === 'object' ? val.rate : val;
        const cap = typeof val === 'object' ? val.cap : '';
        ratesPayload[slug] = {
          cashback_rate: (parseFloat(rate) || 0) / 100,
          monthly_cap: cap !== '' && cap != null ? Number(cap) : null,
        };
      });
      formData.append('rates', JSON.stringify(ratesPayload));
      if (imageFile) formData.append('image', imageFile);

      await fetch(`${API_BASE}/admin/cards`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: formData,
      });
      onSaved();
    } catch {
      setError('Failed to add card. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal adm-modal-lg" style={{ overflowX: 'hidden', overflowY: 'auto', maxHeight: '90vh', maxWidth: '700px', width: '100%', boxSizing: 'border-box', padding: '32px' }}>
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
                <CloudUpload size={32} color="#94A3B8" />
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
                <option value="">Select category...</option>
                {cardCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
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
              <label className="adm-form-label">Total Monthly Cashback Cap (AED/Month, blank = unlimited)</label>
              <input
                className="adm-form-input"
                type="number"
                min="0"
                placeholder="Unlimited"
                value={form.max_cap || ''}
                onChange={(e) => setForm((f) => ({ ...f, max_cap: e.target.value }))}
              />
              <div style={{ fontFamily: 'Inter', fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                Caps total cashback per month across all categories combined. Use only if the bank has a total monthly limit.
              </div>
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
          <div style={{ marginBottom: '20px' }}>
            <div className="adm-cashback-section-title" style={{ marginBottom: '8px' }}>
              Initial Cashback Setup
            </div>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', alignItems: 'center', gap: '16px', padding: '8px 0', borderBottom: '2px solid #E5E7EB', marginBottom: '4px' }}>
              <div style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, color: '#44474E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</div>
              <div style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, color: '#44474E', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Rate</div>
              <div style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, color: '#44474E', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Monthly Cap</div>
            </div>
            {categories.map((cat) => (
              <div key={cat.id || cat.slug} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: '1px solid #F3F4F5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CategoryIcon name={cat.icon} size={16} color="#94A3B8" />
                  <span style={{ fontFamily: 'Inter', fontSize: '14px', color: '#0D1B2A', fontWeight: 500 }}>{cat.name || cat.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={rates[cat.slug]?.rate || ''}
                    onChange={(e) => setRates((r) => ({ ...r, [cat.slug]: { ...r[cat.slug], rate: e.target.value } }))}
                    style={{ width: '80px', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontSize: '14px', textAlign: 'center' }}
                  />
                  <span style={{ color: '#94A3B8', fontSize: '14px' }}>%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={rates[cat.slug]?.cap || ''}
                    onChange={(e) => setRates((r) => ({ ...r, [cat.slug]: { ...r[cat.slug], cap: e.target.value } }))}
                    style={{ width: '90px', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontSize: '14px', textAlign: 'center' }}
                  />
                  <span style={{ color: '#94A3B8', fontSize: '12px', whiteSpace: 'nowrap' }}>AED/mo</span>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="adm-modal-error">{error}</p>}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="adm-btn-save" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Adding…' : <><span>Add Card</span><ArrowRight size={16} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} /></>}
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
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [cardTypes, setCardTypes] = useState(['cashback']);
  const [cardCategories, setCardCategories] = useState([]);

  const [editingCardId, setEditingCardId] = useState(null);
  const [editCard, setEditCard] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [hideRulesCard, setHideRulesCard] = useState(null);

  const searchTimer = useRef(null);

  const fetchCards = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await adminAxios().get('/admin/cards', {
        params: { page: pg, limit: LIMIT, search, category: categoryFilter, income: incomeFilter, status: statusFilter },
      });
      setCards(res.data.cards);
      setTotal(res.data.total);
      setPage(pg);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, incomeFilter, statusFilter, navigate]);

  // Initial data load
  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/categories`),
      axios.get(`${API_BASE}/income-brackets`),
      adminAxios().get('/admin/card-types'),
      adminAxios().get('/admin/card-categories'),
    ]).then(([catsRes, brksRes, typesRes, cardCatsRes]) => {
      setCategories(catsRes.data);
      setBrackets(brksRes.data);
      if (typesRes.data.length) setCardTypes(typesRes.data);
      setCardCategories(cardCatsRes.data);
    }).catch((err) => {
      if (err.response?.status === 401) navigate('/admin/login');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cards when filters change
  useEffect(() => {
    fetchCards(1);
  }, [categoryFilter, incomeFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setStatusFilter('');
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
          <button
            className="adm-btn-add"
            onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} color="white" />
            Add New Card
          </button>
        </div>

        {/* Filter bar */}
        <div className="adm-filter-bar">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><Search size={16} color="#94A3B8" /></span>
            <input
              className="adm-search-input"
              placeholder="Search card names, banks, or features..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ background: 'white', color: '#0D1B2A', colorScheme: 'light' }}
            />
          </div>

          <select
            className="adm-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ background: 'white', color: '#0D1B2A', colorScheme: 'light' }}
          >
            <option value="">All Categories</option>
            {cardCategories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <select
            className="adm-filter-select"
            value={incomeFilter}
            onChange={(e) => setIncomeFilter(e.target.value)}
            style={{ background: 'white', color: '#0D1B2A', colorScheme: 'light' }}
          >
            <option value="">Any Income Range</option>
            {brackets.map((b) => (
              <option key={b.id} value={b.value}>{b.label} / month</option>
            ))}
          </select>

          <select
            className="adm-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: 'white', color: '#0D1B2A', colorScheme: 'light' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="adm-table-loading">Loading…</td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan="8" className="adm-table-loading">No cards found.</td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id}>
                    <td>
                      <div className="adm-card-name-cell">
                        <div className="adm-card-thumb" style={{ overflow: 'hidden', padding: 0 }}>
                          <CardImage card={card} height={40} />
                        </div>
                        <div>
                          <div className="adm-card-name">{card.name}</div>
                          <div className="adm-card-bank">{card.bank}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="adm-type-badge">
                        {card.category_name || (card.card_category || 'cashback').charAt(0).toUpperCase() + (card.card_category || 'cashback').slice(1)}
                      </span>
                    </td>
                    <td>{Number(card.annual_fee).toLocaleString()}</td>
                    <td>{Number(card.min_salary).toLocaleString()}</td>
                    <td>{fmtCap(card.max_cap)}</td>
                    <td>
                      <span
                        className="adm-status-badge"
                        data-status={card.status || 'active'}
                      >
                        {card.status === 'inactive' ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>{formatDate(card.created_at)}</td>
                    <td>
                      <div className="adm-actions">
                        <button
                          className="adm-action-icon"
                          title="Edit card"
                          onClick={() => setEditingCardId(card.id)}
                        >
                          <Pencil size={16} color="#C9920A" />
                        </button>
                        <button
                          className="adm-action-cashback"
                          onClick={() => setEditCard(card)}
                        >
                          CASHBACK %
                        </button>
                        <button
                          className="adm-action-icon"
                          title="Hide rules"
                          onClick={() => setHideRulesCard(card)}
                          style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '4px 8px' }}
                        >
                          <ShieldAlert size={15} color="#6B7280" />
                        </button>
                        <button
                          className="adm-action-icon"
                          title="Delete card"
                          onClick={() => handleDeleteCard(card.id, card.name)}
                          style={{ color: '#DC2626' }}
                        >
                          <Trash2 size={18} color="#FD2626" />
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
      {editingCardId && (
        <EditCardModal
          cardId={editingCardId}
          categories={categories}
          cardCategories={cardCategories}
          onClose={() => setEditingCardId(null)}
          onSaved={() => { setEditingCardId(null); fetchCards(page); }}
        />
      )}

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
          cardCategories={cardCategories}
          onClose={() => setShowAdd(false)}
          onSaved={handleAddSaved}
        />
      )}

      {hideRulesCard && (
        <HideRulesModal
          card={hideRulesCard}
          categories={categories}
          onClose={() => setHideRulesCard(null)}
        />
      )}
    </>
  );
}
