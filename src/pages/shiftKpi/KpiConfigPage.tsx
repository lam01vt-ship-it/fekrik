import { useCallback, useEffect, useMemo, useState } from 'react'
import * as krikApi from '../../api/krikApi'
import { useAuth } from '../../auth/AuthContext'
import { MoneyCellInput } from '../../components/MoneyCellInput'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { StoreRow } from '../../types/api'
import type { StoreMonthlyKpiConfig } from '../../types/shiftKpi'
import { formatMoneyEn, parseMoneyEn } from '../../utils/moneyFormat'

function localYearMonth(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function KpiConfigPage() {
  const { user } = useAuth()
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [yearMonth, setYearMonth] = useState('2026-05')
  const [cfg, setCfg] = useState<StoreMonthlyKpiConfig | null>(null)
  const [target, setTarget] = useState('')
  const [week, setWeek] = useState('')
  const [day, setDay] = useState('')
  const [shift, setShift] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const roles = user?.roles ?? []
  const isHR = roles.includes('AdminHR')
  const isAreaManager = roles.includes('AreaManager')
  const isStoreManager = roles.includes('StoreManager')
  const isStoreManagerEditWindow = useMemo(() => {
    const today = new Date()
    return today.getDate() === 1 && yearMonth === localYearMonth(today)
  }, [yearMonth])
  const canEditConfig = isAreaManager || (isStoreManager && isStoreManagerEditWindow)
  const canProposeConfig = isAreaManager || isStoreManager
  const formLocked = useMemo(() => Boolean(cfg?.isMonthLocked) || !canEditConfig, [cfg, canEditConfig])

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
    if (!canEditConfig) {
      if (isStoreManager && !isStoreManagerEditWindow) {
        setErr('QLCH chỉ sửa cấu hình KPI tháng vào ngày mùng 1 của chính tháng đó.')
        return
      }
      setErr('Bạn không có quyền sửa cấu hình KPI tháng. Liên hệ Quản lý khu vực / QLCH để đề xuất.')
      return
    }
    if (cfg?.isMonthLocked) {
      setErr('Tháng đã chốt — đề nghị HR mở khoá trước khi sửa.')
      return
    }
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
      setMsg('Đã lưu đề xuất. Chờ HR chốt (accept & khoá tháng).')
    } catch {
      setErr('Không lưu được. Kiểm tra quyền hoặc tháng đã khoá.')
    }
  }

  async function onToggleLock() {
    if (!storeId || !cfg) return
    if (!isHR) {
      setErr('Chỉ Admin HR mới chốt & khoá / mở khoá tháng KPI.')
      return
    }
    setErr(null)
    setMsg(null)
    try {
      const nextLocked = !cfg.isMonthLocked
      const c = await krikApi.patchKpiMonthLock(storeId, yearMonth, nextLocked)
      setCfg(c)
      setMsg(nextLocked ? 'Đã chốt & khoá tháng.' : 'Đã mở khoá tháng để chỉnh sửa lại.')
    } catch {
      setErr('Không đổi được trạng thái khoá tháng.')
    }
  }

  const roleHint = isHR
    ? 'Vai trò HR: chỉ đọc cấu hình do Quản lý khu vực / QLCH đề xuất, accept bằng cách bấm "Chốt & khoá tháng" đầu kỳ; mở khoá khi cần điều chỉnh.'
    : isAreaManager
      ? 'Vai trò Quản lý khu vực: cập nhật KPI tháng cho cửa hàng trong khu vực. Khi HR đã chốt & khoá tháng, đề nghị HR mở khoá trước khi sửa.'
      : isStoreManager
        ? isStoreManagerEditWindow
          ? 'Vai trò QLCH: hôm nay là mùng 1 của tháng đang chọn nên bạn được đề xuất / chỉnh KPI tháng. Sau khi HR chốt, form sẽ bị khoá.'
          : 'Vai trò QLCH: chỉ được đề xuất / chỉnh KPI tháng vào ngày mùng 1 của chính tháng đó (theo giờ máy đang chạy hệ thống).'
      : 'Bạn chỉ có quyền xem cấu hình KPI tháng.'

  return (
    <>
      <p className="krik-page-lead">
        Cấu hình KPI tháng theo cửa hàng. <strong>Quản lý khu vực</strong> nhập đề xuất KPI tháng; <strong>QLCH</strong> chỉ được sửa vào ngày mùng 1 của tháng đang cấu hình;
        <strong> Admin HR</strong> đọc, <strong>accept</strong> đầu kỳ bằng nút <em>Chốt & khoá tháng</em>, và mở khoá lại khi cần điều chỉnh.
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
        <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          {roleHint}
        </p>
      </div>
      {err ? <p className="krik-alert">{err}</p> : null}
      {msg ? <p style={{ color: 'var(--success, #2e7d32)' }}>{msg}</p> : null}
      {cfg ? (
        <form className="krik-card" onSubmit={onSave}>
          <p className="muted" style={{ marginTop: 0 }}>
            Cập nhật lần cuối: {new Date(cfg.updatedAt).toLocaleString('vi-VN')} — Trạng thái:{' '}
            <strong>{cfg.isMonthLocked ? 'Đã chốt & khoá (HR)' : 'Đang mở để đề xuất'}</strong>
          </p>
          {isHR ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                className="krik-btn krik-btn--primary"
                disabled={!storeId}
                onClick={() => void onToggleLock()}
              >
                {cfg.isMonthLocked ? 'Mở khoá tháng để chỉnh sửa (HR)' : 'Chốt & khoá tháng (HR)'}
              </button>
            </div>
          ) : null}
          <label className="krik-field">
            KPI tháng (VND)
            {formLocked ? (
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
            <textarea
              className="krik-input"
              style={{ minHeight: 72 }}
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              readOnly={formLocked}
              disabled={formLocked}
            />
          </label>
          {canEditConfig && !cfg.isMonthLocked ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <button type="button" className="krik-btn krik-btn--ghost" onClick={() => setWeek('[20,20,20,20,20]')}>
                Preset: tuần chia đều 20%
              </button>
              <button type="button" className="krik-btn krik-btn--ghost" onClick={() => setDay('[14.29,14.29,14.29,14.29,14.29,14.29,14.29]')}>
                Preset: 7 ngày gần đều (T2–CN)
              </button>
              <button
                type="button"
                className="krik-btn krik-btn--ghost"
                onClick={() => setDay('[16,16,16,16,12,12,12]')}
                title="T2–T5 cao hơn T6–CN (57.14% / 42.86% chia cho 4+3 ngày)"
              >
                Preset: early week / weekend
              </button>
            </div>
          ) : null}
          <label className="krik-field">
            Tỷ trọng theo ngày trong tuần (JSON)
            <textarea
              className="krik-input"
              style={{ minHeight: 72 }}
              value={day}
              onChange={(e) => setDay(e.target.value)}
              readOnly={formLocked}
              disabled={formLocked}
            />
          </label>
          <label className="krik-field">
            Tỷ trọng theo ca (JSON)
            <textarea
              className="krik-input"
              style={{ minHeight: 100 }}
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              readOnly={formLocked}
              disabled={formLocked}
            />
          </label>
          {canProposeConfig ? (
            <button type="submit" className="krik-btn krik-btn--primary" disabled={cfg.isMonthLocked || !canEditConfig}>
              {cfg.isMonthLocked
                ? 'Tháng đã chốt — không sửa được'
                : canEditConfig
                  ? 'Lưu đề xuất KPI'
                  : 'QLCH chỉ sửa ngày mùng 1 của tháng này'}
            </button>
          ) : null}
        </form>
      ) : null}
    </>
  )
}
