export type StoreStaff = {
  id: string
  staffCode: string
  fullName: string
  positionCode: string
  contractType: string
  hourlyRate: number
  teamBonusBase: number
  linkedUserId: string | null
  linkedEmail: string | null
}

export type StoreDailySummary = {
  workDate: string
  channelRevenueMorning: number
  channelRevenueAfternoon: number
  channelRevenueEvening: number
  storeCustomers: number
  storeOrders: number
  storeProducts: number
  storeDayKpiTarget: number
  tongDoanhThuHeThong: number
  isDayLocked: boolean
}

export type DailyEntryRow = {
  entryId: string
  staffId: string
  staffCode: string
  fullName: string
  positionCode: string
  contractType: string
  version: number
  hoursMorning: number
  hoursAfternoon: number
  hoursEvening: number
  hoursExtra: number
  revenueMorning: number
  revenueAfternoon: number
  revenueEvening: number
  customers: number
  tryOns: number
  orders: number
  products: number
  weightNv: number
  targetNv: number
  revenueTotal: number
  percentNv: number
  canPatch: boolean
}

export type DailySheet = {
  storeId: string
  workDate: string
  monthLocked: boolean
  dayLocked: boolean
  summary: StoreDailySummary
  rows: DailyEntryRow[]
}

export type StoreMonthlyKpiConfig = {
  storeId: string
  yearMonth: string
  monthlyTargetAmount: number
  weekRatiosJson: string
  dayRatiosJson: string
  shiftRatiosJson: string
  isMonthLocked: boolean
  updatedAt: string
}

export type MonthlyDailySeriesItem = {
  workDate: string
  staffRevenue: number
  channelRevenue: number
  storeDayKpiTarget: number
  isDayLocked: boolean
}

export type MonthlyTopStaff = {
  staffId: string
  staffCode: string
  fullName: string
  positionCode: string
  totalRevenue: number
  totalHours: number
}

export type MonthlyDashboard = {
  yearMonth: string
  monthlyTarget: number
  revenueFromStaffEntries: number
  tongDoanhThuHeThongThang: number
  kpiAchievedPct: number
  discrepancyOver5Pct: boolean
  isMonthLocked: boolean
  dailySeries: MonthlyDailySeriesItem[]
  topStaff: MonthlyTopStaff[]
}

export type PayrollRow = {
  staffId: string
  staffCode: string
  fullName: string
  positionCode: string
  contractType: string
  hourlyRate: number
  hoursMorning: number
  hoursAfternoon: number
  hoursEvening: number
  hoursExtra: number
  totalHours: number
  revenueMorning: number
  revenueAfternoon: number
  revenueEvening: number
  totalRevenue: number
  commissionPctApplied: number
  salaryRevenue: number
  salaryFixed: number
  teamBonus: number
  totalSalary: number
  hypotheticalSalaryRevenueAt95: number | null
}
