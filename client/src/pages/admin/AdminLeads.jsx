import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, Download, FileText, X, MessageSquare, Mail, Calendar, AlertTriangle } from 'lucide-react'
import API_BASE from '../../utils/api'
import AdminNavbar from '../../components/admin/AdminNavbar'

const adminAxios = () => axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
})

const STATUS_COLORS = {
  'New':       { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Contacted': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  'Qualified': { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  'Closed':    { bg: '#F3F4F6', text: '#4B5563', dot: '#6B7280' },
}

export default function AdminLeads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [deletedFilter, setDeletedFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const fetchLeads = () => {
    setLoading(true)
    const params = { page, limit }
    if (statusFilter) params.status = statusFilter
    if (providerFilter) params.auth_provider = providerFilter
    if (searchTerm) params.search = searchTerm
    if (deletedFilter !== 'all') params.deleted = deletedFilter

    adminAxios().get('/admin/leads', { params })
      .then(res => {
        setLeads(Array.isArray(res.data?.leads) ? res.data.leads : [])
        setTotal(res.data?.total || 0)
        setLoading(false)
      })
      .catch(err => {
        console.error('Fetch leads error:', err)
        setLeads([])
        setTotal(0)
        setLoading(false)
        if (err.response?.status === 401) navigate('/admin/login')
      })
  }

  useEffect(() => {
    fetchLeads()
  }, [page, statusFilter, providerFilter, searchTerm, deletedFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAxios().put(`/admin/leads/${id}`, { lead_status: newStatus })
      fetchLeads()
    } catch {
      alert('Failed to update status')
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedLead) return
    setSavingNotes(true)
    try {
      await adminAxios().put(`/admin/leads/${selectedLead.id}`, { admin_notes: editingNotes })
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, admin_notes: editingNotes } : l))
      setSelectedLead({ ...selectedLead, admin_notes: editingNotes })
    } catch {
      alert('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleExport = (format) => {
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (providerFilter) params.append('auth_provider', providerFilter)
    if (searchTerm) params.append('search', searchTerm)
    if (deletedFilter !== 'all') params.append('deleted', deletedFilter)

    const token = localStorage.getItem('adminToken')
    const url = `${API_BASE}/admin/leads/export/${format}?${params.toString()}`

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `leads_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
      })
      .catch(() => alert('Export failed'))
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div style={{ background: '#F3F4F5', minHeight: '100vh' }}>
      <AdminNavbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'Manrope', fontSize: '32px', fontWeight: 800, color: '#0D1B2A', margin: 0 }}>
              Lead Management
            </h1>
            <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
              Track and manage all signed-up users. Total: {total} leads
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleExport('csv')}
              style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 16px', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              style={{ background: '#C9920A', border: 'none', borderRadius: '8px', padding: '10px 16px', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={16} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontSize: '14px', fontFamily: 'Inter', boxSizing: 'border-box' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontSize: '14px', fontFamily: 'Inter', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setPage(1) }}
            style={{ padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontSize: '14px', fontFamily: 'Inter', cursor: 'pointer' }}
          >
            <option value="">All Providers</option>
            <option value="email">Email</option>
            <option value="google">Google</option>
          </select>

          <select
            value={deletedFilter}
            onChange={(e) => { setDeletedFilter(e.target.value); setPage(1) }}
            style={{ padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontSize: '14px', fontFamily: 'Inter', cursor: 'pointer' }}
          >
            <option value="all">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="deleted">Deleted Only</option>
          </select>

          {(statusFilter || providerFilter || searchTerm || deletedFilter !== 'active') && (
            <button
              onClick={() => { setStatusFilter(''); setProviderFilter(''); setSearchTerm(''); setDeletedFilter('all'); setPage(1) }}
              style={{ background: 'none', border: 'none', color: '#C9920A', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'Inter' }}>Loading leads…</div>
          ) : !leads || leads.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'Inter' }}>No leads found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead style={{ background: '#0D1B2A' }}>
                  <tr>
                    {['NAME', 'EMAIL', 'STATUS', 'INCOME', 'NATIONALITY', 'PROVIDER', 'UTM SOURCE', 'SIGNUP DATE', 'NOTES'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'white', fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(leads || []).map(lead => {
                    const status = lead.lead_status || 'New'
                    const colors = STATUS_COLORS[status] || STATUS_COLORS.New
                    const isDeleted = !!lead.deleted_at
                    return (
                      <tr key={lead.id} style={{ borderBottom: '1px solid #F3F4F5', background: isDeleted ? '#FFF5F5' : undefined }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: isDeleted ? '#9CA3AF' : '#0D1B2A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ textDecoration: isDeleted ? 'line-through' : 'none' }}>
                              {lead.full_name || '—'}
                            </span>
                            {isDeleted && (
                              <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                                Deleted
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'Inter', fontSize: '13px', color: isDeleted ? '#9CA3AF' : '#6B7280' }}>
                          {lead.email}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            style={{ padding: '4px 8px', border: 'none', borderRadius: '999px', background: colors.bg, color: colors.text, fontFamily: 'Inter', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', colorScheme: 'light' }}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'Inter', fontSize: '13px', color: '#374151' }}>
                          {lead.income_range || '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'Inter', fontSize: '13px', color: '#374151' }}>
                          {lead.nationality || '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'Inter', fontSize: '12px', color: '#6B7280', textTransform: 'capitalize' }}>
                          {lead.auth_provider || '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'Inter', fontSize: '12px', color: '#6B7280' }}>
                          {lead.utm_source || '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'Inter', fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => { setSelectedLead(lead); setEditingNotes(lead.admin_notes || '') }}
                            style={{ background: lead.admin_notes ? '#FEF3C7' : 'none', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: lead.admin_notes ? '#92400E' : '#9CA3AF' }}
                            title={lead.admin_notes ? 'View notes' : 'Add notes'}
                          >
                            <MessageSquare size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', color: page === 1 ? '#D1D5DB' : '#374151', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ fontFamily: 'Inter', fontSize: '13px', color: '#6B7280', padding: '0 12px' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white', color: page === totalPages ? '#D1D5DB' : '#374151', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        )}

        {/* Notes Modal */}
        {selectedLead && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ background: '#0D1B2A', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
                <div>
                  <h2 style={{ fontFamily: 'Manrope', fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>Lead Notes</h2>
                  <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#94A3B8', margin: '2px 0 0' }}>
                    {selectedLead.full_name || selectedLead.email}
                  </p>
                </div>
                <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'white' }}>
                  <X size={20} />
                </button>
              </div>

              {selectedLead.deleted_at && (
                <div style={{ background: '#FEE2E2', borderLeft: '4px solid #DC2626', padding: '12px 24px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 700, color: '#DC2626', margin: '0 0 2px' }}>
                      Account Deleted
                    </p>
                    <p style={{ fontFamily: 'Inter', fontSize: '12px', color: '#B91C1C', margin: 0 }}>
                      Deleted on {new Date(selectedLead.deleted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {selectedLead.deletion_reason ? ` — ${selectedLead.deletion_reason}` : ''}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Mail size={14} color="#94A3B8" />
                  <span style={{ fontFamily: 'Inter', fontSize: '13px', color: '#374151' }}>{selectedLead.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="#94A3B8" />
                  <span style={{ fontFamily: 'Inter', fontSize: '13px', color: '#374151' }}>
                    Joined {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>

              <div style={{ padding: '20px 24px' }}>
                <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: '#0D1B2A', display: 'block', marginBottom: '8px' }}>
                  Admin Notes
                </label>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Add notes about this lead — call history, conversation context, follow-up reminders..."
                  rows={8}
                  style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontFamily: 'Inter', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setSelectedLead(null)}
                  style={{ background: '#E5E7EB', border: 'none', borderRadius: '6px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  style={{ background: '#C9920A', border: 'none', borderRadius: '6px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: 'white', cursor: savingNotes ? 'not-allowed' : 'pointer', opacity: savingNotes ? 0.6 : 1 }}
                >
                  {savingNotes ? 'Saving…' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
