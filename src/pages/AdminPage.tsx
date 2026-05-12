import { useEffect, useState } from 'react'
import * as krikApi from '../api/krikApi'
import type { UserListItem } from '../types/api'

const roleVi: Record<string, string> = {
  AdminHR: 'Quản trị & nhân sự',
  AreaManager: 'Quản lý khu vực',
  StoreManager: 'Quản lý cửa hàng',
  SalesStaff: 'Nhân viên bán hàng',
}

function rolesVi(roles: string[]) {
  return roles.map((r) => roleVi[r] ?? r).join(', ')
}

export function AdminPage() {
  const [ping, setPing] = useState<string | null>(null)
  const [users, setUsers] = useState<UserListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const p = await krikApi.adminPing()
        const u = await krikApi.fetchUsers()
        if (!cancelled) {
          setPing(p.message)
          setUsers(u)
        }
      } catch {
        if (!cancelled) setError('Không có quyền hoặc máy chủ lỗi.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <p className="krik-page-lead">Chỉ tài khoản quản trị & nhân sự: kiểm tra API và danh sách người dùng.</p>
      {error ? <p className="krik-alert">{error}</p> : null}
      <div className="krik-card">
        <h2 className="krik-page-title">Kiểm tra API</h2>
        <p style={{ margin: 0, fontSize: 14 }}>
          <strong>/api/admin/ping</strong>: {ping ?? '…'}
        </p>
      </div>
      <div className="krik-card">
        <h2 className="krik-page-title" style={{ marginBottom: 12 }}>
          Người dùng
        </h2>
        <div className="krik-table-wrap">
          <table className="krik-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Họ tên</th>
                <th>Mã cửa hàng</th>
                <th>Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {users === null ? (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--muted)' }}>
                    Đang tải…
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.fullName}</td>
                    <td>{u.storeId ?? '—'}</td>
                    <td>{rolesVi(u.roles)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
