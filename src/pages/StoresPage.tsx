import { useEffect, useState } from 'react'
import * as krikApi from '../api/krikApi'
import type { StoreRow } from '../types/api'

export function StoresPage() {
  const [rows, setRows] = useState<StoreRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await krikApi.fetchStores()
        if (!cancelled) setRows(data)
      } catch {
        if (!cancelled) setError('Không tải được danh sách cửa hàng.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <p className="krik-page-lead">
        Kết quả phụ thuộc role: Admin xem tất cả, AreaManager theo khu, StoreManager / SalesStaff một
        cửa hàng.
      </p>
      {error ? <p className="krik-alert">{error}</p> : null}
      <div className="krik-card">
        <div className="krik-table-wrap">
          <table className="krik-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên</th>
              <th>Khu</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr>
                <td colSpan={3} style={{ color: 'var(--muted)' }}>
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ color: 'var(--muted)' }}>
                  Không có cửa hàng trong phạm vi của bạn.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <code>{s.code}</code>
                  </td>
                  <td>{s.name}</td>
                  <td>
                    {s.areaName} <span style={{ color: 'var(--muted)' }}>({s.areaCode})</span>
                  </td>
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
