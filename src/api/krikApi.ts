import type { LoginResponse, StoreRow, UserListItem, UserSummary } from '../types/api'
import { api } from './client'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', { email, password })
  return data
}

export async function fetchMe(): Promise<UserSummary> {
  const { data } = await api.get<UserSummary>('/api/auth/me')
  return data
}

export async function fetchStores(): Promise<StoreRow[]> {
  const { data } = await api.get<StoreRow[]>('/api/stores')
  return data
}

export async function fetchUsers(): Promise<UserListItem[]> {
  const { data } = await api.get<UserListItem[]>('/api/users')
  return data
}

export async function adminPing(): Promise<{ message: string }> {
  const { data } = await api.get<{ message: string }>('/api/admin/ping')
  return data
}
