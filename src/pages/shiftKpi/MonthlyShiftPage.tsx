import { useCallback, useEffect, useState } from 'react'
import * as krikApi from '../../api/krikApi'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { StoreRow } from '../../types/api'
import type { MonthlyDashboard } from '../../types/shiftKpi'
import { formatMoneyEn } from '../../utils/moneyFormat'

export function MonthlyShiftPage() {
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [yearMonth, setYearMonth] = useState('2026-05')
  const [dash, setDash] = useState<MonthlyDashboard | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!storeId) return
    setErr(null)
    try {
      const d = await krikApi.fetchMonthlyDashboard(storeId, yearMonth)
      setDash(d)
    } catch {
      setErr('Không tải được tổng quan tháng.')
      setDash(null)
    }
  }, [storeId, yearMonth])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <p className="krik-page-lead">
        So sánh mục tiêu KPI tháng với tổng doanh thu nhập từ bảng công nhân viên và tổng cột đối chiếu kênh
        trong bảng tổng ngày. Hiển thị cảnh báo khi chênh lệch trên 5%.
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
            Tháng (yyyy-MM)
            <input
              className="krik-input"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
            />
          </label>
          <button type="button" className="krik-btn krik-btn--ghost" onClick={() => void load()}>
            Tải lại
          </button>
        </div>
      </div>
      {err ? <p className="krik-alert">{err}</p> : null}
      {dash ? (
        <div className="krik-card">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            <Metric label="KPI tháng (mục tiêu)" value={`${formatMoneyEn(dash.monthlyTarget, 0)} ₫`} />
            <Metric label="Doanh thu nhập (nhân viên)" value={`${formatMoneyEn(dash.revenueFromStaffEntries, 0)} ₫`} />
            <Metric label="Tổng đối chiếu kênh (tháng)" value={`${formatMoneyEn(dash.tongDoanhThuHeThongThang, 0)} ₫`} />
            <Metric label="Tỷ lệ hoàn thành KPI" value={`${formatMoneyEn(dash.kpiAchievedPct, 2)}%`} />
            <Metric
              label="Chênh lệch &gt; 5%"
              value={dash.discrepancyOver5Pct ? 'Có cờ cảnh báo' : 'Trong ngưỡng'}
              warn={dash.discrepancyOver5Pct}
            />
            <Metric label="Khoá tháng" value={dash.isMonthLocked ? 'Đã khoá' : 'Mở'} />
          </div>
        </div>
      ) : (
        <p className="muted">Chọn cửa hàng.</p>
      )}
    </>
  )
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: `1px solid ${warn ? '#fecaca' : 'var(--border)'}`,
        background: warn ? '#fff7ed' : '#fafbff',
      }}
    >
      <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 16, textAlign: 'right' }} className="krik-money">
        {value}
      </div>
    </div>
  )
}
