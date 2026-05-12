import { useEffect, useState } from 'react'
import * as krikApi from '../api/krikApi'
import type { UserListItem } from '../types/api'

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
        if (!cancelled) setError('Không có quyền hoặc API lỗi.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <p className="krik-page-lead">Chỉ role AdminHR: ping API và danh sách user.</p>
      {error ? <p className="krik-alert">{error}</p> : null}
      <div className="krik-card">
        <h2 className="krik-page-title">API kiểm tra</h2>
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
              <th>StoreId</th>
              <th>Roles</th>
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
                  <td>{u.roles.join(', ')}</td>
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
