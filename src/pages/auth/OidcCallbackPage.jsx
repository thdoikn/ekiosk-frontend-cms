import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { getOidcRedirectUri } from '../../utils/oidc'

export default function OidcCallbackPage() {
  const setAuth   = useAuthStore((s) => s.setAuth)
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const state  = params.get('state')
    const stored = sessionStorage.getItem('oidc_state')

    if (!code || !state || state !== stored) {
      window.location.replace('/login')
      return
    }

    sessionStorage.removeItem('oidc_state')

    axios
      .post('/api/v1/auth/oidc/callback/', {
        code,
        redirect_uri: getOidcRedirectUri(),
      })
      .then((res) => {
        setAuth({
          user:     res.data.user,
          access:   res.data.access,
          refresh:  res.data.refresh,
          id_token: res.data.id_token,
        })
        window.location.replace('/')
      })
      .catch(() => {
        window.location.replace('/login')
      })
  }, [setAuth])

  return (
    <div style={styles.root}>
      <div style={styles.spinner} />
      <p style={styles.text}>Memverifikasi sesi SSO…</p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#232320',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    fontFamily: "'DM Sans', sans-serif",
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(213,181,126,0.2)',
    borderTopColor: '#d5b57e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  text: {
    color: 'rgba(255,249,235,0.5)',
    fontSize: '14px',
    margin: 0,
  },
}
