import { useState, useEffect } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../../utils/api';
import AdminNavbar from '../../components/admin/AdminNavbar';
import CategoryIcon from '../../components/CategoryIcon';

function adminAxios() {
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
  });
}

const EMPTY_FORM = {
  slug: '', name: '', icon: 'Circle',
  min_spend: 0, max_spend: 5000, default_spend: 500, sort_order: 0,
};

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#374151' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', marginBottom: 0 }}>{hint}</p>}
    </div>
  );
}

const INPUT = {
  width: '100%', padding: '10px', border: '1px solid #E5E7EB',
  borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', boxSizing: 'border-box',
};

const TH = { padding: '14px 20px', textAlign: 'left', color: 'white', fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' };
const TD = { padding: '14px 20px', fontFamily: 'Inter', fontSize: '14px', color: '#0D1B2A' };

export default function AdminSpendingCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const fetchCategories = () => {
    adminAxios().get('/admin/spending-categories')
      .then((res) => setCategories(res.data))
      .catch((err) => { if (err.response?.status === 401) navigate('/admin/login'); });
  };

  useEffect(() => { fetchCategories(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon || 'Circle',
      min_spend: cat.min_spend ?? 0,
      max_spend: cat.max_spend ?? 5000,
      default_spend: cat.default_spend ?? 500,
      sort_order: cat.display_order ?? 0,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await adminAxios().put(`/admin/spending-categories/${editingId}`, {
          name: form.name,
          icon: form.icon,
          min_spend: Number(form.min_spend),
          max_spend: Number(form.max_spend),
          default_spend: Number(form.default_spend),
          sort_order: Number(form.sort_order),
        });
      } else {
        await adminAxios().post('/admin/spending-categories', {
          slug: form.slug,
          name: form.name,
          icon: form.icon,
          min_spend: Number(form.min_spend),
          max_spend: Number(form.max_spend),
          default_spend: Number(form.default_spend),
          sort_order: Number(form.sort_order),
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      await adminAxios().delete(`/admin/spending-categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete category');
    }
  };

  return (
    <div style={{ background: '#F3F4F5', minHeight: '100vh' }}>
      <AdminNavbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'Manrope', fontSize: '32px', fontWeight: 800, color: '#0D1B2A', margin: 0 }}>
              Spending Categories
            </h1>
            <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
              Manage the spending categories used in the cashback calculator and card rates.
            </p>
          </div>
          <button
            onClick={openAdd}
            style={{ background: '#C9920A', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 20px', fontFamily: 'Manrope', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Add New Category
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#0D1B2A' }}>
              <tr>
                <th style={TH}>Icon</th>
                <th style={TH}>Name</th>
                <th style={TH}>Slug</th>
                <th style={TH}>Min (AED)</th>
                <th style={TH}>Max (AED)</th>
                <th style={TH}>Default (AED)</th>
                <th style={TH}>Sort</th>
                <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #F3F4F5' }}>
                  <td style={{ ...TD, width: '60px' }}>
                    <CategoryIcon name={cat.icon} size={20} color="#94A3B8" />
                  </td>
                  <td style={{ ...TD, fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ ...TD, fontFamily: 'monospace', fontSize: '13px', color: '#6B7280' }}>{cat.slug}</td>
                  <td style={TD}>{Number(cat.min_spend).toLocaleString()}</td>
                  <td style={TD}>{Number(cat.max_spend).toLocaleString()}</td>
                  <td style={TD}>{Number(cat.default_spend).toLocaleString()}</td>
                  <td style={TD}>{cat.display_order}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Edit">
                        <Pencil size={16} color="#C9920A" />
                      </button>
                      <button onClick={() => handleDelete(cat.id, cat.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Delete">
                        <Trash2 size={16} color="#FD2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'Inter', fontSize: '14px' }}>
                    No spending categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'Manrope', fontSize: '20px', fontWeight: 700, color: '#0D1B2A', margin: '0 0 20px' }}>
              {editingId ? 'Edit Spending Category' : 'Add New Spending Category'}
            </h2>

            {!editingId && (
              <Field label="Slug" hint="Lowercase, no spaces. Cannot be changed after creation.">
                <input
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="e.g. education"
                  style={INPUT}
                />
              </Field>
            )}

            <Field label="Display Name">
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Education"
                style={INPUT}
              />
            </Field>

            <Field
              label="Icon Name"
              hint={<>Use any Lucide icon name from <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" style={{ color: '#C9920A' }}>lucide.dev/icons</a></>}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  value={form.icon}
                  onChange={(e) => set('icon', e.target.value)}
                  placeholder="e.g. ShoppingCart"
                  style={{ ...INPUT, flex: 1 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Inter', fontSize: '12px', color: '#6B7280' }}>Preview:</span>
                  <CategoryIcon name={form.icon} size={22} color="#94A3B8" />
                </div>
              </div>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Min Spend (AED)" hint="Slider minimum">
                <input type="number" value={form.min_spend} onChange={(e) => set('min_spend', e.target.value)} style={INPUT} />
              </Field>
              <Field label="Max Spend (AED)" hint="Slider maximum">
                <input type="number" value={form.max_spend} onChange={(e) => set('max_spend', e.target.value)} style={INPUT} />
              </Field>
              <Field label="Default Spend (AED)" hint="Initial slider value">
                <input type="number" value={form.default_spend} onChange={(e) => set('default_spend', e.target.value)} style={INPUT} />
              </Field>
              <Field label="Sort Order" hint="Lower = appears first">
                <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} style={INPUT} />
              </Field>
            </div>

            {error && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px', fontFamily: 'Inter' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600 }}
              >Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: '#C9920A', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600 }}
              >{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Category'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
