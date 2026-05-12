import { useCallback, useEffect, useState } from 'react'
import * as krikApi from '../../api/krikApi'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { StoreRow } from '../../types/api'
import type { StoreMonthlyKpiConfig } from '../../types/shiftKpi'

export function KpiConfigPage() {
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [yearMonth, setYearMonth] = useState('2026-05')
  const [cfg, setCfg] = useState<StoreMonthlyKpiConfig | null>(null)
  const [target, setTarget] = useState('')
  const [week, setWeek] = useState('')
  const [day, setDay] = useState('')
  const [shift, setShift] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!storeId) return
    setErr(null)
    try {
      const c = await krikApi.fetchKpiMonth(storeId, yearMonth)
      setCfg(c)
      setTarget(String(c.monthlyTargetAmount))
      setWeek(c.weekRatiosJson)
      setDay(c.dayRatiosJson)
      setShift(c.shiftRatiosJson)
    } catch {
      setErr('Không tải được cấu hình (chỉ Admin sửa).')
    }
  }, [storeId, yearMonth])

  useEffect(() => {
    void load()
  }, [load])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!storeId) return
    setMsg(null)
    setErr(null)
    const amt = parseFloat(target.replace(/,/g, ''))
    if (Number.isNaN(amt) || amt < 0) {
      setErr('KPI tháng phải là số ≥ 0.')
      return
    }
    try {
      const c = await krikApi.putKpiMonth(storeId, yearMonth, {
        monthlyTargetAmount: amt,
        weekRatiosJson: week,
        dayRatiosJson: day,
        shiftRatiosJson: shift,
      })
      setCfg(c)
      setMsg('Đã lưu.')
    } catch {
      setErr('Lưu thất bại (cần role AdminHR hoặc tháng đã khoá).')
    }
  }

  return (
    <>
      <p className="krik-page-lead">
        Trang <strong>Cấu hình KPI tháng</strong> — chỉ Admin chỉnh sửa. JSON tỷ trọng tuần / ngày / ca (MVP: lưu
        thẳng chuỗi, derive daily/weekly nâng cao sẽ bổ sung).
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
        </div>
      </div>
      {err ? <p className="krik-alert">{err}</p> : null}
      {msg ? <p style={{ color: 'var(--success, #2e7d32)' }}>{msg}</p> : null}
      {cfg ? (
        <form className="krik-card" onSubmit={onSave}>
          <p className="muted" style={{ marginTop: 0 }}>
            Cập nhật lần cuối: {new Date(cfg.updatedAt).toLocaleString('vi-VN')} — Khoá tháng:{' '}
            <strong>{cfg.isMonthLocked ? 'có' : 'không'}</strong>
          </p>
          <label className="krik-field">
            KPI tháng (VND)
            <input className="krik-input" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
          <label className="krik-field">
            Week ratios JSON (5 tuần, ví dụ [20,20,20,20,20])
            <textarea className="krik-input" style={{ minHeight: 72 }} value={week} onChange={(e) => setWeek(e.target.value)} />
          </label>
          <label className="krik-field">
            Day ratios JSON
            <textarea className="krik-input" style={{ minHeight: 72 }} value={day} onChange={(e) => setDay(e.target.value)} />
          </label>
          <label className="krik-field">
            Shift ratios JSON
            <textarea className="krik-input" style={{ minHeight: 100 }} value={shift} onChange={(e) => setShift(e.target.value)} />
          </label>
          <button type="submit" className="krik-btn krik-btn--primary" disabled={cfg.isMonthLocked}>
            Lưu cấu hình
          </button>
        </form>
      ) : null}
    </>
  )
}
