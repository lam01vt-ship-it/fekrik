import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import * as krikApi from '@/api/krikApi'
import { useShiftKpiStoreId } from '@/hooks/useShiftKpiStoreId'
import type { AppOutletContextValue } from '@/layout/appOutletContext'
import type { StoreRow } from '@/types/api'
import type { PayrollRow } from '@/types/shiftKpi'
import { formatMoneyEn } from '@/utils/moneyFormat'

export function PayrollPage() {
  const { setHeaderActions } = useOutletContext<AppOutletContextValue>()
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [yearMonth, setYearMonth] = useState('2026-05')
  const [rows, setRows] = useState<PayrollRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loadedOnce, setLoadedOnce] = useState(false)

  const load = useCallback(async () => {
    if (!storeId) {
      setRows([])
      setLoadedOnce(false)
      setErr(null)
      return
    }
    setLoadedOnce(false)
    setErr(null)
    try {
      const r = await krikApi.fetchPayroll(storeId, yearMonth)
      setRows(r)
      setLoadedOnce(true)
    } catch {
      setErr('Không tải được bảng lương.')
      setRows([])
      setLoadedOnce(true)
    }
  }, [storeId, yearMonth])

  useEffect(() => {
    void load()
  }, [load])

  const onExport = useCallback(async () => {
    if (!storeId) return
    setErr(null)
    try {
      const blob = await krikApi.downloadPayrollExport(storeId, yearMonth)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll-${yearMonth}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setErr('Xuất tệp Excel thất bại.')
    }
  }, [storeId, yearMonth])

  useEffect(() => {
    setHeaderActions(
      <button
        type="button"
        className="krik-header-btn krik-header-btn--solid"
        disabled={!storeId}
        onClick={() => void onExport()}
      >
        Xuất Excel
      </button>,
    )
    return () => setHeaderActions(null)
  }, [setHeaderActions, storeId, yearMonth, onExport])

  const showEmptyPayroll = Boolean(storeId) && loadedOnce && !err && rows.length === 0

  return (
    <>
      <p className="krik-page-lead">
        Bảng lương tổng hợp theo tháng: lương theo giờ, hoa hồng theo bậc KPI trong cơ sở dữ liệu, thưởng team
        cho quản lý. Chọn cửa hàng và tháng — dữ liệu tải tự động; xuất Excel trên thanh header.
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
        </div>
      </div>
      {err ? <p className="krik-alert">{err}</p> : null}
      <div className="krik-card krik-scroll-wide">
        <div className="krik-table-wrap">
          <table className="krik-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Mã NV</th>
                <th>Chức danh</th>
                <th>HĐ</th>
                <th className="krik-money">Lương/giờ</th>
                <th className="krik-money">GC Sáng</th>
                <th className="krik-money">GC Chiều</th>
                <th className="krik-money">GC Tối</th>
                <th className="krik-money">GC BS</th>
                <th className="krik-money">Tổng GC</th>
                <th className="krik-money">DT Sáng</th>
                <th className="krik-money">DT Chiều</th>
                <th className="krik-money">DT Tối</th>
                <th className="krik-money">Tổng DT</th>
                <th className="krik-money">% HH</th>
                <th className="krik-money">Lương DT</th>
                <th className="krik-money">Lương cứng</th>
                <th className="krik-money">Thưởng team</th>
                <th className="krik-money">Tổng lương</th>
                <th className="krik-money">HH ước (95% KPI)</th>
              </tr>
            </thead>
            <tbody>
              {!storeId ? (
                <tr>
                  <td colSpan={20} style={{ color: 'var(--muted)' }}>
                    Chọn cửa hàng để xem bảng lương.
                  </td>
                </tr>
              ) : !loadedOnce && !err ? (
                <tr>
                  <td colSpan={20} style={{ color: 'var(--muted)' }}>
                    Đang tải…
                  </td>
                </tr>
              ) : showEmptyPayroll ? (
                <tr>
                  <td colSpan={20} style={{ color: 'var(--muted)' }}>
                    Không có bảng lương cho cửa hàng và tháng đã chọn (chưa có dữ liệu công / KPI để tính).
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.staffId}>
                    <td>{r.fullName}</td>
                    <td>{r.staffCode}</td>
                    <td>{r.positionCode}</td>
                    <td>{r.contractType}</td>
                    <td className="krik-money">{formatMoneyEn(r.hourlyRate, 0)}</td>
                    <td className="krik-money">{formatMoneyEn(r.hoursMorning, 2)}</td>
                    <td className="krik-money">{formatMoneyEn(r.hoursAfternoon, 2)}</td>
                    <td className="krik-money">{formatMoneyEn(r.hoursEvening, 2)}</td>
                    <td className="krik-money">{formatMoneyEn(r.hoursExtra, 2)}</td>
                    <td className="krik-money">{formatMoneyEn(r.totalHours, 2)}</td>
                    <td className="krik-money">{formatMoneyEn(r.revenueMorning, 0)}</td>
                    <td className="krik-money">{formatMoneyEn(r.revenueAfternoon, 0)}</td>
                    <td className="krik-money">{formatMoneyEn(r.revenueEvening, 0)}</td>
                    <td className="krik-money">{formatMoneyEn(r.totalRevenue, 0)}</td>
                    <td className="krik-money">{formatMoneyEn(r.commissionPctApplied, 2)}%</td>
                    <td className="krik-money">{formatMoneyEn(r.salaryRevenue, 0)}</td>
                    <td className="krik-money">{formatMoneyEn(r.salaryFixed, 0)}</td>
                    <td className="krik-money">{formatMoneyEn(r.teamBonus, 0)}</td>
                    <td className="krik-money">
                      <strong>{formatMoneyEn(r.totalSalary, 0)}</strong>
                    </td>
                    <td className="krik-money">
                      {r.hypotheticalSalaryRevenueAt95 != null
                        ? formatMoneyEn(r.hypotheticalSalaryRevenueAt95, 0)
                        : '—'}
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
