import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppLayout } from './layout/AppLayout'
import { AdminPage } from './pages/AdminPage'
import { LoginPage } from './pages/LoginPage'
import { StoresPage } from './pages/StoresPage'
import { DailyShiftPage } from './pages/shiftKpi/DailyShiftPage'
import { KpiConfigPage } from './pages/shiftKpi/KpiConfigPage'
import { MonthlyShiftPage } from './pages/shiftKpi/MonthlyShiftPage'
import { PayrollPage } from './pages/shiftKpi/PayrollPage'
import { StaffListPage } from './pages/shiftKpi/StaffListPage'
import { RequireAuth } from './routes/RequireAuth'
import { RequireRole } from './routes/RequireRole'
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<MonthlyShiftPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="staff-shift-kpi/daily" element={<DailyShiftPage />} />
            <Route path="staff-shift-kpi/monthly" element={<Navigate to="/app" replace />} />
            <Route
              path="staff-shift-kpi/kpi-config"
              element={
                <RequireRole roles={['AdminHR', 'AreaManager', 'StoreManager']}>
                  <KpiConfigPage />
                </RequireRole>
              }
            />
            <Route
              path="staff-shift-kpi/staff"
              element={
                <RequireRole roles={['AdminHR', 'AreaManager', 'StoreManager']}>
                  <StaffListPage />
                </RequireRole>
              }
            />
            <Route path="staff-shift-kpi/payroll" element={<PayrollPage />} />
            <Route
              path="admin"
              element={
                <RequireRole roles={['AdminHR']}>
                  <AdminPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
