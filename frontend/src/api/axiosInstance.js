import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message || err.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default api
