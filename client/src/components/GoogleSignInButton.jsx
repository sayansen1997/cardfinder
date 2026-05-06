import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import API_BASE from '../utils/api'
import { getUTMs, clearUTMs } from '../utils/utm'

export default function GoogleSignInButton({ onSuccess, onError, mode = 'signup' }) {
  const buttonRef = useRef(null)
  const navigate = useNavigate()

  const [pendingCredential, setPendingCredential] = useState(null)
  const [showReactivateModal, setShowReactivateModal] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [reactivateError, setReactivateError] = useState('')

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) {
        setTimeout(initializeGoogle, 100)
        return
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'login' ? 'signin_with' : 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 360,
      })
    }

    initializeGoogle()
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCredentialResponse = async (response) => {
    try {
      const utms = getUTMs()
      const result = await axios.post(`${API_BASE}/users/google-auth`, {
        credential: response.credential,
        ...utms,
      })

      clearUTMs()
      localStorage.setItem('userToken', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data.user))

      if (onSuccess) {
        onSuccess(result.data.user, result.data.profile_complete)
      } else if (result.data.reactivated) {
        navigate('/dashboard?reactivated=true')
      } else if (!result.data.profile_complete) {
        navigate('/complete-profile')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.requires_reactivation) {
        setPendingCredential(response.credential)
        setShowReactivateModal(true)
      } else {
        console.error('Google auth failed:', err)
        if (onError) onError(err)
      }
    }
  }

  const handleConfirmReactivate = async () => {
    if (!pendingCredential) return
    setReactivating(true)
    setReactivateError('')

    try {
      const utms = getUTMs()
      const result = await axios.post(`${API_BASE}/users/google-auth`, {
        credential: pendingCredential,
        ...utms,
        reactivate: true,
      })

      clearUTMs()
      localStorage.setItem('userToken', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data.user))
      setShowReactivateModal(false)

      if (onSuccess) {
        onSuccess(result.data.user, result.data.profile_complete)
      } else {
        navigate('/dashboard?reactivated=true')
      }
    } catch (err) {
      setReactivateError(err.response?.data?.error || 'Reactivation failed. Please try again.')
      setReactivating(false)
    }
  }

  const handleCancelReactivate = () => {
    setShowReactivateModal(false)
    setPendingCredential(null)
    setReactivateError('')
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div ref={buttonRef}></div>
      </div>

      {showReactivateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '480px', overflow: 'hidden' }}>

            <div style={{ background: '#FEF3C7', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RotateCw size={22} color="#92400E" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Manrope', fontSize: '18px', fontWeight: 700, color: '#92400E', margin: 0 }}>
                  Welcome back!
                </h2>
                <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#92400E', margin: '2px 0 0', opacity: 0.85 }}>
                  We found a previous account
                </p>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#374151', margin: '0 0 16px', lineHeight: 1.5 }}>
                An account with this Google email was previously deleted.
              </p>

              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                  Reactivate to restore:
                </p>
                <ul style={{ fontFamily: 'Inter', fontSize: '13px', color: '#14532D', margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
                  <li>Your account access</li>
                  <li>Your previous profile information</li>
                  <li>Your Google profile picture</li>
                </ul>
              </div>

              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                  Note:
                </p>
                <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#7F1D1D', margin: 0, lineHeight: 1.5 }}>
                  Saved calculations from before deletion will not be restored.
                </p>
              </div>

              {reactivateError && (
                <div style={{ marginTop: '12px', padding: '10px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontFamily: 'Inter', fontSize: '13px' }}>
                  {reactivateError}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F3F4F5' }}>
              <button
                onClick={handleCancelReactivate}
                disabled={reactivating}
                style={{ background: '#E5E7EB', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: reactivating ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReactivate}
                disabled={reactivating}
                style={{ background: '#C9920A', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: 'white', cursor: reactivating ? 'not-allowed' : 'pointer', opacity: reactivating ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCw size={16} color="white" />
                {reactivating ? 'Reactivating...' : 'Yes, Reactivate'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
