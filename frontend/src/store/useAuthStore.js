import { create } from 'zustand'
import api from '../api/axiosInstance'

const TOKEN_KEY   = 'survey_access_token'
const REFRESH_KEY = 'survey_refresh_token'

const useAuthStore = create((set, get) => ({
  user:         null,
  accessToken:  localStorage.getItem(TOKEN_KEY) || null,
  isLoading:    false,
  error:        null,

  isAuthenticated: () => !!get().accessToken,

  setTokens: (access, refresh) => {
    localStorage.setItem(TOKEN_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
    set({ accessToken: access })
  },

  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    set({ accessToken: null, user: null })
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.post('/auth/register', { email, password, name })
      const { access_token, refresh_token, user } = res.data.data
      get().setTokens(access_token, refresh_token)
      set({ user, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, refresh_token, user } = res.data.data
      get().setTokens(access_token, refresh_token)
      set({ user, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  logout: async () => {
    const refresh = localStorage.getItem(REFRESH_KEY)
    try {
      await api.post('/auth/logout', { refresh_token: refresh })
    } catch { /* ignore */ }
    get().clearTokens()
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data.data })
    } catch {
      get().clearTokens()
    }
  },
}))

export default useAuthStore
