import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, Download, FileText, X, MessageSquare, Mail, Calendar, AlertTriangle, Trash2, RotateCcw } from 'lucide-react'
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
  const [view, setView] = useState('normal')
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [trashModal, setTrashModal] = useState(null)
  const [trashReason, setTrashReason] = useState('')
  const [trashNotes, setTrashNotes] = useState('')
  const [actioning, setActioning] = useState(false)

  const fetchLeads = () => {
    setLoading(true)
    const params = { page, limit, view }
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
  }, [page, statusFilter, providerFilter, searchTerm, deletedFilter, view]) // eslint-disable-line react-hooks/exhaustive-deps

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
    if (view !== 'normal') params.append('view', view)

    const token = localStorage.getItem('adminToken')
    const url = `${API_BASE}/admin/leads/export/${format}?${params.toString()}`

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `leads_${view === 'trash' ? 'trash_' : ''}${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
      })
      .catch(() => alert('Export failed'))
  }

  const handleTrashLead = async () => {
    if (!trashModal?.lead || !trashReason) return
    setActioning(true)
    try {
      await adminAxios().post(`/admin/leads/${trashModal.lead.id}/trash`, { reason: trashReason, notes: trashNotes })
      setTrashModal(null)
      setTrashReason('')
      setTrashNotes('')
      fetchLeads()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to move to trash')
    } finally {
      setActioning(false)
    }
  }

  const handleRestoreLead = async () => {
    if (!trashModal?.lead) return
    setActioning(true)
    try {
      await adminAxios().post(`/admin/leads/${trashModal.lead.id}/restore`)
      setTrashModal(null)
      fetchLeads()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to restore')
    } finally {
      setActioning(false)
    }
  }

  const handlePermanentDelete = async () => {
    if (!trashModal?.lead) return
    setActioning(true)
    try {
      await adminAxios().delete(`/admin/leads/${trashModal.lead.id}/permanent`)
      setTrashModal(null)
      fetchLeads()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete permanently')
    } finally {
      setActioning(false)
    }
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
              {view === 'trash' ? `Trash — ${total} lead${total !== 1 ? 's' : ''}` : `Track and manage all signed-up users. Total: ${total} leads`}
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

        {/* View toggle tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'white', padding: '6px', borderRadius: '10px', width: 'fit-content' }}>
          <button
            onClick={() => { setView('normal'); setPage(1) }}
            style={{ background: view === 'normal' ? '#0D1B2A' : 'transparent', color: view === 'normal' ? 'white' : '#6B7280', border: 'none', padding: '8px 16px', borderRadius: '6px', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            All Leads
          </button>
          <button
            onClick={() => { setView('trash'); setPage(1) }}
            style={{ background: view === 'trash' ? '#0D1B2A' : 'transparent', color: view === 'trash' ? 'white' : '#6B7280', border: 'none', padding: '8px 16px', borderRadius: '6px', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={14} />
            Trash
          </button>
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

          {view === 'normal' && (
            <select
              value={deletedFilter}
              onChange={(e) => { setDeletedFilter(e.target.value); setPage(1) }}
              style={{ padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontSize: '14px', fontFamily: 'Inter', cursor: 'pointer' }}
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="deleted">Deleted Only</option>
            </select>
          )}

          {(() => {
            const filtersActive = !!(statusFilter || providerFilter || searchTerm || deletedFilter !== 'all')
            return (
              <button
                onClick={() => { setStatusFilter(''); setProviderFilter(''); setSearchTerm(''); setDeletedFilter('all'); setPage(1) }}
                style={{ background: 'none', border: 'none', color: '#C9920A', fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, cursor: filtersActive ? 'pointer' : 'default', opacity: filtersActive ? 1 : 0, visibility: filtersActive ? 'visible' : 'hidden', pointerEvents: filtersActive ? 'auto' : 'none', transition: 'opacity 0.25s ease, visibility 0.25s ease', padding: '8px 12px' }}
              >
                Clear Filters
              </button>
            )
          })()}
        </div>

        <style>{`
          @keyframes rowFadeIn {
            from { opacity: 0.5; }
            to   { opacity: 1; }
          }
          .leads-row-fade { animation: rowFadeIn 0.3s ease; }
        `}</style>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s ease', pointerEvents: loading ? 'none' : 'auto' }}>
          {!leads || leads.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'Inter' }}>
              {loading ? 'Loading leads…' : view === 'trash' ? 'Trash is empty' : 'No leads found'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead style={{ background: view === 'trash' ? '#3B1F6E' : '#0D1B2A' }}>
                  <tr>
                    {['NAME', 'EMAIL', 'STATUS', 'INCOME', 'NATIONALITY', 'PROVIDER', 'UTM SOURCE', 'SIGNUP DATE', 'ACTIONS'].map(h => (
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
                    const isTrashed = !!lead.trashed_at
                    return (
                      <tr key={lead.id} className="leads-row-fade" style={{ borderBottom: '1px solid #F3F4F5', background: isTrashed ? '#F5F3FF' : isDeleted ? '#FFF5F5' : undefined }}>
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
                            {isTrashed && (
                              <span style={{ background: '#EDE9FE', color: '#5B21B6', fontFamily: 'Inter', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                Trashed
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
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {/* Notes button */}
                            <button
                              onClick={() => { setSelectedLead(lead); setEditingNotes(lead.admin_notes || '') }}
                              style={{ background: lead.admin_notes ? '#FEF3C7' : 'none', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: lead.admin_notes ? '#92400E' : '#9CA3AF' }}
                              title={lead.admin_notes ? 'View notes' : 'Add notes'}
                            >
                              <MessageSquare size={14} />
                            </button>

                            {/* Trash — normal view only */}
                            {view === 'normal' && (
                              <button
                                onClick={() => { setTrashModal({ lead, action: 'trash' }); setTrashReason(''); setTrashNotes('') }}
                                style={{ background: 'none', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: '#6B7280' }}
                                title="Move to trash"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}

                            {/* Restore + permanent delete — trash view only */}
                            {view === 'trash' && (
                              <>
                                <button
                                  onClick={() => setTrashModal({ lead, action: 'restore' })}
                                  style={{ background: 'none', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: '#10B981' }}
                                  title="Restore from trash"
                                >
                                  <RotateCcw size={14} />
                                </button>
                                <button
                                  onClick={() => setTrashModal({ lead, action: 'permanent' })}
                                  style={{ background: 'none', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: '#DC2626' }}
                                  title="Permanently delete"
                                >
                                  <AlertTriangle size={14} />
                                </button>
                              </>
                            )}
                          </div>
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

              {selectedLead.trashed_at && (
                <div style={{ background: '#EDE9FE', borderLeft: '4px solid #7C3AED', padding: '12px 24px' }}>
                  <div style={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: '#5B21B6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    In Trash
                  </div>
                  <div style={{ fontFamily: 'Inter', fontSize: '13px', color: '#4C1D95' }}>
                    Moved to trash on {new Date(selectedLead.trashed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {selectedLead.trash_reason && ` — ${selectedLead.trash_reason}`}
                    {selectedLead.trashed_by && ` by ${selectedLead.trashed_by}`}
                  </div>
                  {selectedLead.trash_notes && (
                    <div style={{ fontFamily: 'Inter', fontSize: '13px', color: '#4C1D95', marginTop: '4px', fontStyle: 'italic' }}>
                      "{selectedLead.trash_notes}"
                    </div>
                  )}
                </div>
              )}

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

        {/* Trash Action Modal */}
        {trashModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>

              {/* TRASH MODAL */}
              {trashModal.action === 'trash' && (
                <>
                  <div style={{ background: '#EDE9FE', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={22} color="#5B21B6" />
                    </div>
                    <div>
                      <h2 style={{ fontFamily: 'Manrope', fontSize: '18px', fontWeight: 700, color: '#5B21B6', margin: 0 }}>
                        Move lead to trash
                      </h2>
                      <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#5B21B6', margin: '2px 0 0', opacity: 0.85 }}>
                        {trashModal.lead.full_name || trashModal.lead.email}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: '#0D1B2A', display: 'block', marginBottom: '6px' }}>
                        Reason *
                      </label>
                      <select
                        value={trashReason}
                        onChange={(e) => setTrashReason(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontFamily: 'Inter', fontSize: '14px' }}
                      >
                        <option value="">Select reason...</option>
                        <option value="Junk">Junk</option>
                        <option value="Spam">Spam</option>
                        <option value="Test Account">Test Account</option>
                        <option value="Bounced Email">Bounced Email</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: '#0D1B2A', display: 'block', marginBottom: '6px' }}>
                        Notes (optional)
                      </label>
                      <textarea
                        value={trashNotes}
                        onChange={(e) => setTrashNotes(e.target.value)}
                        placeholder="Additional context..."
                        rows={3}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#0D1B2A', colorScheme: 'light', fontFamily: 'Inter', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F3F4F5' }}>
                    <button onClick={() => setTrashModal(null)} disabled={actioning} style={{ background: '#E5E7EB', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button
                      onClick={handleTrashLead}
                      disabled={actioning || !trashReason}
                      style={{ background: '#5B21B6', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: 'white', cursor: !trashReason ? 'not-allowed' : 'pointer', opacity: !trashReason || actioning ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={16} />
                      {actioning ? 'Moving...' : 'Move to Trash'}
                    </button>
                  </div>
                </>
              )}

              {/* RESTORE MODAL */}
              {trashModal.action === 'restore' && (
                <>
                  <div style={{ background: '#D1FAE5', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RotateCcw size={22} color="#065F46" />
                    </div>
                    <div>
                      <h2 style={{ fontFamily: 'Manrope', fontSize: '18px', fontWeight: 700, color: '#065F46', margin: 0 }}>
                        Restore lead?
                      </h2>
                      <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#065F46', margin: '2px 0 0', opacity: 0.85 }}>
                        {trashModal.lead.full_name || trashModal.lead.email}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '24px' }}>
                    <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                      This lead will be restored to the active leads list. All previous data and notes will be preserved.
                    </p>
                  </div>

                  <div style={{ padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F3F4F5' }}>
                    <button onClick={() => setTrashModal(null)} disabled={actioning} style={{ background: '#E5E7EB', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={handleRestoreLead} disabled={actioning} style={{ background: '#10B981', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RotateCcw size={16} />
                      {actioning ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                </>
              )}

              {/* PERMANENT DELETE MODAL */}
              {trashModal.action === 'permanent' && (
                <>
                  <div style={{ background: '#FEE2E2', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={22} color="#991B1B" />
                    </div>
                    <div>
                      <h2 style={{ fontFamily: 'Manrope', fontSize: '18px', fontWeight: 700, color: '#991B1B', margin: 0 }}>
                        Permanently delete lead?
                      </h2>
                      <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#991B1B', margin: '2px 0 0', opacity: 0.85 }}>
                        {trashModal.lead.full_name || trashModal.lead.email}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '24px' }}>
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px' }}>
                      <p style={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                        Warning — This cannot be undone
                      </p>
                      <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#7F1D1D', margin: 0, lineHeight: 1.5 }}>
                        The lead and all associated data (calculations, notes, UTMs) will be permanently removed from the database. This action is logged in the audit trail but the data itself cannot be recovered.
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F3F4F5' }}>
                    <button onClick={() => setTrashModal(null)} disabled={actioning} style={{ background: '#E5E7EB', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={handlePermanentDelete} disabled={actioning} style={{ background: '#DC2626', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={16} />
                      {actioning ? 'Deleting...' : 'Permanently Delete'}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
