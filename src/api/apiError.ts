import axios, { type AxiosError } from 'axios'

export function messageFromApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<string | { title?: string; detail?: string }>
    const data = ax.response?.data
    if (typeof data === 'string' && data.trim()) return data.trim()
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim()
      if (typeof data.title === 'string' && data.title.trim()) return data.title.trim()
    }
    if (ax.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  }
  return fallback
}
