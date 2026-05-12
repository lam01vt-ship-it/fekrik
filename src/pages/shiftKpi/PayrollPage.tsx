import { useCallback, useEffect, useState } from 'react'
import * as krikApi from '../../api/krikApi'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { PayrollRow } from '../../types/shiftKpi'
import type { StoreRow } from '../../types/api'

function money(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n))
}

export function PayrollPage() {
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [yearMonth, setYearMonth] = useState('2026-05')
  const [rows, setRows] = useState<PayrollRow[]>([])
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!storeId) return
    setErr(null)
    try {
      const r = await krikApi.fetchPayroll(storeId, yearMonth)
      setRows(r)
    } catch {
      setErr('Không tải được bảng lương.')
    }
  }, [storeId, yearMonth])

  useEffect(() => {
    void load()
  }, [load])

  async function onExport() {
    if (!storeId) return
    try {
      const blob = await krikApi.downloadPayrollExport(storeId, yearMonth)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll-${yearMonth}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setErr('Export Excel thất bại.')
    }
  }

  return (
    <>
      <p className="krik-page-lead">
        Bảng lương tổng hợp theo tháng (giờ × lương/giờ + hoa hồng theo bracket lưu DB + thưởng team QLCH). Xuất
        Excel ~19 cột.
      </p>
      <div className="krik-card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <label className="krik-field" style={{ marginBottom: 0, minWidth: 200 }}>
            Cửa hàng
            <select
              className="krik-input"
              value={storeId ?? ''}
              onChange={(e) => setStoreId(e.target.value || null)}
            >
              <option value="">—</option>
              {stores.map((s: StoreRow) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </select>
          </label>
          <label className="krik-field" style={{ marginBottom: 0 }}>
            Tháng
            <input className="krik-input" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
          </label>
          <button type="button" className="krik-btn krik-btn--ghost" onClick={() => void load()}>
            Tải lại
          </button>
          <button type="button" className="krik-btn krik-btn--primary" onClick={() => void onExport()}>
            Xuất Excel
          </button>
        </div>
      </div>
      {err ? <p className="krik-alert">{err}</p> : null}
      <div className="krik-card krik-scroll-wide">
        <div className="krik-table-wrap">
          <table className="krik-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Mã</th>
                <th>CD</th>
                <th>Tổng GC</th>
                <th>Tổng DT</th>
                <th>%HH</th>
                <th>Lương DT</th>
                <th>Lương cứng</th>
                <th>Thưởng team</th>
                <th>Tổng</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.staffId}>
                  <td>{r.fullName}</td>
                  <td>{r.staffCode}</td>
                  <td>{r.positionCode}</td>
                  <td>{r.totalHours}</td>
                  <td>{money(r.totalRevenue)}</td>
                  <td>{r.commissionPctApplied}%</td>
                  <td>{money(r.salaryRevenue)}</td>
                  <td>{money(r.salaryFixed)}</td>
                  <td>{money(r.teamBonus)}</td>
                  <td>
                    <strong>{money(r.totalSalary)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
