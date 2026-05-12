import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'

export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <div className="page">
        <p className="muted">Đang tải…</p>
      </div>
    )
  }

  const ok = user?.roles.some((r) => roles.includes(r)) ?? false
  if (!ok) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
