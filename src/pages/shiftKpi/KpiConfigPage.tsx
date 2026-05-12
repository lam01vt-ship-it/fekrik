import { useCallback, useEffect, useState } from 'react'
import * as krikApi from '../../api/krikApi'
import { MoneyCellInput } from '../../components/MoneyCellInput'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { StoreRow } from '../../types/api'
import type { StoreMonthlyKpiConfig } from '../../types/shiftKpi'
import { formatMoneyEn, parseMoneyEn } from '../../utils/moneyFormat'

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
      setTarget(formatMoneyEn(c.monthlyTargetAmount, 0))
      setWeek(c.weekRatiosJson)
      setDay(c.dayRatiosJson)
      setShift(c.shiftRatiosJson)
    } catch {
      setErr('Không tải được cấu hình.')
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
    const amt = parseMoneyEn(target)
    if (amt < 0) {
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
      setErr('Không lưu được. Kiểm tra quyền hoặc tháng đã khoá.')
    }
  }

  return (
    <>
      <p className="krik-page-lead">
        Thiết lập KPI tháng và chuỗi JSON tỷ trọng (tuần, ngày trong tuần, ca). Chỉ tài khoản quản trị & nhân sự
        được lưu.
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
            {cfg.isMonthLocked ? (
              <input className="krik-input krik-money-input" readOnly disabled value={target} />
            ) : (
              <MoneyCellInput
                value={parseMoneyEn(target) || 0}
                syncKey={`${storeId}-${yearMonth}-${cfg.updatedAt}`}
                maxFractionDigits={0}
                onCommit={(n) => setTarget(formatMoneyEn(n, 0))}
                className="krik-input krik-money-input"
              />
            )}
          </label>
          <label className="krik-field">
            Tỷ trọng theo tuần (JSON, 5 giá trị)
            <textarea className="krik-input" style={{ minHeight: 72 }} value={week} onChange={(e) => setWeek(e.target.value)} />
          </label>
          <label className="krik-field">
            Tỷ trọng theo ngày trong tuần (JSON)
            <textarea className="krik-input" style={{ minHeight: 72 }} value={day} onChange={(e) => setDay(e.target.value)} />
          </label>
          <label className="krik-field">
            Tỷ trọng theo ca (JSON)
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
