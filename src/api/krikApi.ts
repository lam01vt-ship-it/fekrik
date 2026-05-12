import type { LoginResponse, StoreRow, UserListItem, UserSummary } from '../types/api'
import type {
  DailySheet,
  MonthlyDashboard,
  PayrollRow,
  StoreMonthlyKpiConfig,
  StoreStaff,
} from '../types/shiftKpi'
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

export async function fetchShiftKpiStaff(storeId: string): Promise<StoreStaff[]> {
  const { data } = await api.get<StoreStaff[]>(`/api/stores/${storeId}/shift-kpi/staff`)
  return data
}

export async function postShiftKpiStaff(
  storeId: string,
  body: {
    staffCode: string
    fullName: string
    positionCode: string
    contractType: string
    hourlyRate: number
    teamBonusBase: number
    linkedUserId: string | null
  },
): Promise<StoreStaff> {
  const { data } = await api.post<StoreStaff>(`/api/stores/${storeId}/shift-kpi/staff`, body)
  return data
}

export async function deleteShiftKpiStaff(storeId: string, staffId: string): Promise<void> {
  await api.delete(`/api/stores/${storeId}/shift-kpi/staff/${staffId}`)
}

export async function fetchShiftKpiDaily(storeId: string, workDate: string): Promise<DailySheet> {
  const { data } = await api.get<DailySheet>(`/api/stores/${storeId}/shift-kpi/daily`, {
    params: { workDate },
  })
  return data
}

export async function patchShiftKpiDailyEntry(
  storeId: string,
  body: Record<string, unknown>,
): Promise<DailySheet['rows'][0]> {
  const { data } = await api.patch<DailySheet['rows'][0]>(`/api/stores/${storeId}/shift-kpi/daily-entry`, body)
  return data
}

export async function fetchKpiMonth(storeId: string, yearMonth: string): Promise<StoreMonthlyKpiConfig> {
  const { data } = await api.get<StoreMonthlyKpiConfig>(
    `/api/stores/${storeId}/shift-kpi/kpi-months/${encodeURIComponent(yearMonth)}`,
  )
  return data
}

export async function putKpiMonth(
  storeId: string,
  yearMonth: string,
  body: Pick<StoreMonthlyKpiConfig, 'monthlyTargetAmount' | 'weekRatiosJson' | 'dayRatiosJson' | 'shiftRatiosJson'>,
): Promise<StoreMonthlyKpiConfig> {
  const { data } = await api.put<StoreMonthlyKpiConfig>(
    `/api/stores/${storeId}/shift-kpi/kpi-months/${encodeURIComponent(yearMonth)}`,
    body,
  )
  return data
}

export async function fetchMonthlyDashboard(storeId: string, yearMonth: string): Promise<MonthlyDashboard> {
  const { data } = await api.get<MonthlyDashboard>(`/api/stores/${storeId}/shift-kpi/monthly-dashboard`, {
    params: { yearMonth },
  })
  return data
}

export async function fetchPayroll(storeId: string, yearMonth: string): Promise<PayrollRow[]> {
  const { data } = await api.get<PayrollRow[]>(`/api/stores/${storeId}/shift-kpi/payroll`, {
    params: { yearMonth },
  })
  return data
}

export async function downloadPayrollExport(storeId: string, yearMonth: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/api/stores/${storeId}/shift-kpi/payroll-export`, {
    params: { yearMonth },
    responseType: 'blob',
  })
  return data
}
