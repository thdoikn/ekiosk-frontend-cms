import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

function hydrateUser() {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try { return jwtDecode(token) } catch { return null }
}

export const useAuthStore = create((set) => ({
  token:   localStorage.getItem('access_token') || null,
  idToken: localStorage.getItem('id_token') || null,
  user:    hydrateUser(),

  login: (access, refresh) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    const decoded = jwtDecode(access)
    set({ token: access, user: decoded })
  },

  setAuth: ({ user, access, refresh, id_token }) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    if (id_token) localStorage.setItem('id_token', id_token)
    set({ token: access, idToken: id_token || null, user })
  },

  logout: () => {
    const idToken = localStorage.getItem('id_token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('id_token')
    set({ token: null, idToken: null, user: null })

    const authority = import.meta.env.VITE_OIDC_AUTHORITY
    if (idToken && authority) {
      const logoutEndpoint = authority.replace('/protocol/openid-connect/auth', '/protocol/openid-connect/logout')
      const params = new URLSearchParams({
        id_token_hint:            idToken,
        post_logout_redirect_uri: window.location.origin + '/login?logged_out=1',
      })
      window.location.replace(`${logoutEndpoint}?${params.toString()}`)
    }
  },
}))
