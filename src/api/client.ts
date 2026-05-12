import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('krik_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
