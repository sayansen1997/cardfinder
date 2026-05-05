import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import API_BASE from '../utils/api'

export default function GoogleSignInButton({ onSuccess, onError, mode = 'signup' }) {
  const buttonRef = useRef(null)
  const navigate = useNavigate()

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
  }, [mode])

  const handleCredentialResponse = async (response) => {
    try {
      const result = await axios.post(`${API_BASE}/users/google-auth`, {
        credential: response.credential,
      })

      localStorage.setItem('userToken', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data.user))

      if (onSuccess) {
        onSuccess(result.data.user, result.data.profile_complete)
      } else {
        navigate(result.data.profile_complete ? '/dashboard' : '/complete-profile')
      }
    } catch (err) {
      console.error('Google auth failed:', err)
      if (onError) onError(err)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div ref={buttonRef}></div>
    </div>
  )
}
