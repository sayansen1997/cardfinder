import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = '/api';

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [tab, setTab] = useState('leads');
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API}/admin/leads`, { headers: { Authorization: `Bearer ${token}` } });
      setLeads(res.data);
    } catch {
      navigate('/admin/login');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <button onClick={logout} style={{ padding: '0.4rem 1rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('leads')}
          style={{ padding: '0.4rem 1rem', background: tab === 'leads' ? '#1a1a2e' : '#eee', color: tab === 'leads' ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Leads ({leads.length})
        </button>
      </div>

      {tab === 'leads' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Email', 'Income', 'Nationality', 'Consent', 'Status', 'Source', 'Date'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={tdStyle}>{lead.id}</td>
                  <td style={tdStyle}>{lead.email}</td>
                  <td style={tdStyle}>{lead.income_range}</td>
                  <td style={tdStyle}>{lead.nationality}</td>
                  <td style={tdStyle}>{lead.consent ? 'Yes' : 'No'}</td>
                  <td style={tdStyle}>{lead.status}</td>
                  <td style={tdStyle}>{lead.utm_source}</td>
                  <td style={tdStyle}>{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const tdStyle = { border: '1px solid #eee', padding: '0.5rem 0.75rem', fontSize: '0.85rem' };
const thStyle = { ...tdStyle, background: '#1a1a2e', color: '#fff', fontWeight: 600 };
