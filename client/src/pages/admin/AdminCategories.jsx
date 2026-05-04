import { useState, useEffect } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../../utils/api';
import AdminNavbar from '../../components/admin/AdminNavbar';

function adminAxios() {
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
  });
}

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [error, setError] = useState('');

  const fetchCategories = () => {
    adminAxios().get('/admin/card-categories')
      .then((res) => setCategories(res.data))
      .catch((err) => {
        if (err.response?.status === 401) navigate('/admin/login');
      });
  };

  useEffect(() => { fetchCategories(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    setError('');
    try {
      await adminAxios().post('/admin/card-categories', {
        slug: newSlug,
        name: newName,
        sort_order: parseInt(newSortOrder) || 0,
      });
      setShowAddModal(false);
      setNewSlug('');
      setNewName('');
      setNewSortOrder(0);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleEdit = async (id) => {
    try {
      await adminAxios().put(`/admin/card-categories/${id}`, {
        name: editingCategory.name,
        sort_order: parseInt(editingCategory.sort_order) || 0,
      });
      setEditingCategory(null);
      fetchCategories();
    } catch {
      alert('Failed to update category');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      await adminAxios().delete(`/admin/card-categories/${id}`);
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
              Card Categories
            </h1>
            <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
              Manage card category options used across the platform.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: '#C9920A', color: 'white', border: 'none',
              borderRadius: '8px', padding: '12px 20px',
              fontFamily: 'Manrope', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Add New Category
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#0D1B2A' }}>
              <tr>
                {['SLUG', 'NAME', 'SORT ORDER', 'ACTIONS'].map((h, i) => (
                  <th key={h} style={{
                    padding: '14px 20px',
                    textAlign: i === 3 ? 'right' : 'left',
                    color: 'white', fontFamily: 'Inter', fontSize: '11px',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #F3F4F5' }}>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '13px', color: '#6B7280' }}>
                    {cat.slug}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#0D1B2A' }}>
                    {editingCategory?.id === cat.id ? (
                      <input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: '4px', width: '100%', fontFamily: 'Inter', fontSize: '14px' }}
                      />
                    ) : cat.name}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter', fontSize: '14px', color: '#0D1B2A' }}>
                    {editingCategory?.id === cat.id ? (
                      <input
                        type="number"
                        value={editingCategory.sort_order}
                        onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: e.target.value })}
                        style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: '4px', width: '80px', fontFamily: 'Inter', fontSize: '14px' }}
                      />
                    ) : cat.sort_order}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {editingCategory?.id === cat.id ? (
                        <>
                          <button
                            onClick={() => handleEdit(cat.id)}
                            style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600 }}
                          >Save</button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            style={{ background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600 }}
                          >Cancel</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingCategory({ ...cat })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            title="Edit"
                          >
                            <Pencil size={16} color="#C9920A" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            title="Delete"
                          >
                            <Trash2 size={16} color="#FD2626" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'Inter', fontSize: '14px' }}>
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '480px' }}>
              <h2 style={{ fontFamily: 'Manrope', fontSize: '20px', fontWeight: 700, color: '#0D1B2A', margin: '0 0 20px' }}>
                Add New Category
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#374151' }}>Slug</label>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="e.g. crypto_rewards"
                  style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', marginBottom: 0 }}>Lowercase, no spaces. Will be auto-formatted.</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#374151' }}>Display Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Crypto Rewards"
                  style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#374151' }}>Sort Order</label>
                <input
                  type="number"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', marginBottom: 0 }}>Lower numbers appear first.</p>
              </div>

              {error && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px', fontFamily: 'Inter' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowAddModal(false); setError(''); }}
                  style={{ background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600 }}
                >Cancel</button>
                <button
                  onClick={handleAdd}
                  style={{ background: '#C9920A', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600 }}
                >Add Category</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
