import api from '../api/axiosInstance'

export const createSession  = ()             => api.post('/sessions')
export const saveAnswer     = (id, data)     => api.patch(`/sessions/${id}/answers`, data)
export const getSession     = (id)           => api.get(`/sessions/${id}`)
export const submitSurvey   = (id)           => api.post(`/sessions/${id}/submit`, {})
export const getOutput      = (id)           => api.get(`/sessions/${id}/output`)
export const sendEmail      = (id, email)    => api.post(`/sessions/${id}/email`, { email })
