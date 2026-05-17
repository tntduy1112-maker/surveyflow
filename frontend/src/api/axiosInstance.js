import axios from 'axios'

const TOKEN_KEY   = 'survey_access_token'
const REFRESH_KEY = 'survey_refresh_token'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
})

// Attach access token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Silent refresh on 401
let refreshing = false
let queue = []

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      const refresh = localStorage.getItem(REFRESH_KEY)
      if (!refresh) {
        localStorage.removeItem(TOKEN_KEY)
        return Promise.reject(new Error(err.response?.data?.error?.message || 'Unauthorized'))
      }

      if (refreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject, config: original }))
      }

      refreshing = true
      original._retry = true

      try {
        const res = await axios.post('/api/v1/auth/refresh', { refresh_token: refresh })
        const { access_token, refresh_token } = res.data.data
        localStorage.setItem(TOKEN_KEY, access_token)
        if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
        api.defaults.headers.Authorization = `Bearer ${access_token}`
        queue.forEach(({ resolve, config }) => {
          config.headers.Authorization = `Bearer ${access_token}`
          resolve(api(config))
        })
        queue = []
        return api(original)
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        queue.forEach(({ reject }) => reject(new Error('Session expired')))
        queue = []
        return Promise.reject(new Error('Session expired. Please log in again.'))
      } finally {
        refreshing = false
      }
    }

    const message = err.response?.data?.error?.message || err.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default api
