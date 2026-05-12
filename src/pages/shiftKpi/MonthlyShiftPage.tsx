import { useCallback, useEffect, useMemo, useState } from 'react'
import * as krikApi from '../../api/krikApi'
import { useAuth } from '../../auth/AuthContext'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { StoreRow } from '../../types/api'
import type { MonthlyDailySeriesItem, MonthlyDashboard, MonthlyTopStaff } from '../../types/shiftKpi'
import { formatMoneyEn } from '../../utils/moneyFormat'

function defaultYearMonth(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function MonthlyShiftPage() {
  const { user } = useAuth()
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [yearMonth, setYearMonth] = useState<string>(() => defaultYearMonth())
  const [dash, setDash] = useState<MonthlyDashboard | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!storeId) return
    setErr(null)
    setBusy(true)
    try {
      const d = await krikApi.fetchMonthlyDashboard(storeId, yearMonth)
      setDash(d)
      setMsg(null)
    } catch {
      setErr('Không tải được tổng quan tháng.')
      setDash(null)
    } finally {
      setBusy(false)
    }
  }, [storeId, yearMonth])

  useEffect(() => {
    void load()
  }, [load])

  const onToggleLock = useCallback(async () => {
    if (!storeId || !dash) return
    setErr(null)
    try {
      const nextLocked = !dash.isMonthLocked
      await krikApi.patchKpiMonthLock(storeId, yearMonth, nextLocked)
      setMsg(nextLocked ? 'Đã chốt & khoá tháng.' : 'Đã mở khoá tháng để chỉnh sửa lại.')
      await load()
    } catch {
      setErr('Không đổi được trạng thái khoá tháng.')
    }
  }, [storeId, dash, yearMonth, load])

  const kpiPct = dash?.kpiAchievedPct ?? 0
  const kpiPctClamped = Math.max(0, Math.min(150, kpiPct))
  const kpiTone: 'low' | 'mid' | 'high' = kpiPct >= 100 ? 'high' : kpiPct >= 80 ? 'mid' : 'low'

  const maxDaily = useMemo(() => {
    if (!dash) return 0
    let m = 0
    for (const it of dash.dailySeries) {
      if (it.staffRevenue > m) m = it.staffRevenue
      if (it.channelRevenue > m) m = it.channelRevenue
    }
    return m
  }, [dash])

  const isHR = Boolean(user?.roles?.includes('AdminHR'))

  return (
    <>
      <p className="krik-page-lead">
        Dashboard tổng quan tháng cho cửa hàng đang chọn: tiến độ KPI tháng, biểu đồ doanh thu theo ngày, top nhân viên.
        {isHR ? ' Admin HR có thể chốt & khoá / mở khoá tháng từ đây.' : ''}
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
                  {s.code} — {s.name}
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
          {isHR && storeId && dash ? (
            <button
              type="button"
              className="krik-btn krik-btn--primary"
              onClick={() => void onToggleLock()}
              disabled={busy}
            >
              {dash.isMonthLocked ? 'Mở khoá tháng (HR)' : 'Chốt & khoá tháng (HR)'}
            </button>
          ) : null}
        </div>
      </div>

      {err ? <p className="krik-alert">{err}</p> : null}
      {msg ? <p style={{ color: 'var(--success, #2e7d32)' }}>{msg}</p> : null}

      {dash ? (
        <>
          <section className="krik-card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Tiến độ KPI tháng {dash.yearMonth}</div>
                <div style={{ fontWeight: 800, fontSize: 28, marginTop: 4 }} className="krik-money">
                  {formatMoneyEn(dash.kpiAchievedPct, 2)}%
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Doanh thu nhập (NV) / KPI tháng
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }} className="krik-money">
                  {formatMoneyEn(dash.revenueFromStaffEntries, 0)} ₫ / {formatMoneyEn(dash.monthlyTarget, 0)} ₫
                </div>
              </div>
            </div>
            <ProgressBar pct={kpiPctClamped} tone={kpiTone} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }} className="muted">
              <span>0%</span>
              <span style={{ color: '#1565c0' }}>Mốc 100% — chạm mục tiêu</span>
              <span>150%+</span>
            </div>
          </section>

          <section className="krik-card" style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <Metric label="KPI tháng (mục tiêu)" value={`${formatMoneyEn(dash.monthlyTarget, 0)} ₫`} />
              <Metric label="Doanh thu nhập (NV)" value={`${formatMoneyEn(dash.revenueFromStaffEntries, 0)} ₫`} />
              <Metric
                label="Tổng đối chiếu kênh"
                value={`${formatMoneyEn(dash.tongDoanhThuHeThongThang, 0)} ₫`}
                hint={dash.discrepancyOver5Pct ? 'Lệch > 5% so với DT NV' : 'Trong ngưỡng ±5%'}
                warn={dash.discrepancyOver5Pct}
              />
              <Metric
                label="Trạng thái tháng"
                value={dash.isMonthLocked ? 'Đã chốt & khoá' : 'Đang mở'}
                hint={dash.isMonthLocked ? 'HR đã chốt — chặn sửa cấu hình & bảng công' : 'Manager đang được sửa cấu hình'}
              />
            </div>
          </section>

          <section className="krik-card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 className="krik-page-title" style={{ fontSize: '1rem', margin: 0 }}>
                Doanh thu theo ngày
              </h2>
              <div className="muted" style={{ fontSize: 12 }}>
                <LegendDot color="#2563eb" /> DT NV nhập &nbsp;·&nbsp; <LegendDot color="#94a3b8" /> Đối chiếu kênh
              </div>
            </div>
            {dash.dailySeries.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>Chưa có dữ liệu cho tháng này.</p>
            ) : (
              <DailyChart items={dash.dailySeries} maxValue={maxDaily} />
            )}
          </section>

          <section className="krik-card">
            <h2 className="krik-page-title" style={{ fontSize: '1rem', margin: '0 0 10px' }}>
              Top nhân viên doanh thu (tháng)
            </h2>
            {dash.topStaff.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>Chưa có doanh thu nào trong tháng.</p>
            ) : (
              <TopStaffTable rows={dash.topStaff} />
            )}
          </section>
        </>
      ) : (
        <p className="muted">{busy ? 'Đang tải…' : 'Chọn cửa hàng.'}</p>
      )}
    </>
  )
}

function ProgressBar({ pct, tone }: { pct: number; tone: 'low' | 'mid' | 'high' }) {
  const color = tone === 'high' ? '#15803d' : tone === 'mid' ? '#2563eb' : '#f59e0b'
  return (
    <div
      style={{
        position: 'relative',
        height: 14,
        marginTop: 12,
        background: '#eef2ff',
        borderRadius: 999,
        overflow: 'hidden',
      }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={150}
    >
      <div
        style={{
          width: `${(pct / 150) * 100}%`,
          height: '100%',
          background: color,
          transition: 'width 200ms ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${(100 / 150) * 100}%`,
          width: 1.5,
          background: '#1565c0',
          opacity: 0.7,
        }}
        aria-hidden
      />
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  warn,
}: {
  label: string
  value: string
  hint?: string
  warn?: boolean
}) {
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
      {hint ? (
        <div className="muted" style={{ fontSize: 11, marginTop: 4, textAlign: 'right' }}>
          {hint}
        </div>
      ) : null}
    </div>
  )
}

function LegendDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
        marginRight: 4,
        verticalAlign: 'middle',
      }}
    />
  )
}

function DailyChart({ items, maxValue }: { items: MonthlyDailySeriesItem[]; maxValue: number }) {
  const safeMax = maxValue > 0 ? maxValue : 1
  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${items.length}, minmax(28px, 1fr))`,
          gap: 4,
          alignItems: 'end',
          height: 160,
          paddingBottom: 4,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {items.map((it) => {
          const day = it.workDate.slice(8, 10)
          const staffH = `${(it.staffRevenue / safeMax) * 100}%`
          const chanH = `${(it.channelRevenue / safeMax) * 100}%`
          const tooltip = `Ngày ${it.workDate}\nDT NV: ${formatMoneyEn(it.staffRevenue, 0)} ₫\nKênh: ${formatMoneyEn(it.channelRevenue, 0)} ₫\nKPI ngày: ${formatMoneyEn(it.storeDayKpiTarget, 0)} ₫${it.isDayLocked ? '\n(Đã khoá ngày)' : ''}`
          return (
            <div
              key={it.workDate}
              title={tooltip}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%' }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'end', gap: 2, width: '100%', justifyContent: 'center' }}>
                <div
                  style={{
                    width: 8,
                    height: staffH,
                    background: '#2563eb',
                    borderRadius: 2,
                    opacity: it.isDayLocked ? 0.7 : 1,
                  }}
                />
                <div
                  style={{
                    width: 8,
                    height: chanH,
                    background: '#94a3b8',
                    borderRadius: 2,
                    opacity: it.isDayLocked ? 0.7 : 1,
                  }}
                />
              </div>
              <span style={{ fontSize: 10 }} className="muted">
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopStaffTable({ rows }: { rows: MonthlyTopStaff[] }) {
  return (
    <table className="krik-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Mã NV</th>
          <th>Họ tên</th>
          <th>Chức danh</th>
          <th className="krik-money">Tổng giờ công</th>
          <th className="krik-money">Tổng doanh thu</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.staffId}>
            <td>{i + 1}</td>
            <td><code>{r.staffCode}</code></td>
            <td>{r.fullName}</td>
            <td>{r.positionCode}</td>
            <td className="krik-money">{formatMoneyEn(r.totalHours, 2)}</td>
            <td className="krik-money">{formatMoneyEn(r.totalRevenue, 0)} ₫</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
