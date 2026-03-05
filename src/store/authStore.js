import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('access_token') || null,
  user: null,

  login: (access, refresh) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    const decoded = jwtDecode(access)
    set({ token: access, user: decoded })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ token: null, user: null })
  },
}))
