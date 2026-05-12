import axios from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'
import * as krikApi from '../../api/krikApi'
import { useAuth } from '../../auth/AuthContext'
import { MoneyCellInput } from '../../components/MoneyCellInput'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { AppOutletContextValue } from '../../layout/appOutletContext'
import type { StoreRow } from '../../types/api'
import type { DailyEntryRow, DailySheet } from '../../types/shiftKpi'
import { formatMoneyEn } from '../../utils/moneyFormat'

function localTodayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MANAGER_ROLES = new Set(['AdminHR', 'AreaManager', 'StoreManager'])

function sumStaffRollup(rows: DailyEntryRow[]) {
  let revenueMorning = 0
  let revenueAfternoon = 0
  let revenueEvening = 0
  let customers = 0
  let tryOns = 0
  let orders = 0
  let products = 0
  for (const r of rows) {
    revenueMorning += r.revenueMorning
    revenueAfternoon += r.revenueAfternoon
    revenueEvening += r.revenueEvening
    customers += r.customers
    tryOns += r.tryOns
    orders += r.orders
    products += r.products
  }
  const tongBaCa = revenueMorning + revenueAfternoon + revenueEvening
  return {
    revenueMorning,
    revenueAfternoon,
    revenueEvening,
    customers,
    tryOns,
    orders,
    products,
    tongBaCa,
  }
}

type NumKey = keyof Pick<
  DailyEntryRow,
  | 'hoursMorning'
  | 'hoursAfternoon'
  | 'hoursEvening'
  | 'hoursExtra'
  | 'revenueMorning'
  | 'revenueAfternoon'
  | 'revenueEvening'
  | 'customers'
  | 'tryOns'
  | 'orders'
  | 'products'
>

const DAILY_SHEET_COL_STORAGE_KEY = 'krik-daily-sheet-col-widths-v1'

const DAILY_SHEET_DEFAULT_COL_WIDTHS: number[] = [
  44, 88, 200, 112, 56, 100, 100, 100, 100, 116, 116, 116, 88, 88, 88, 88, 108, 80,
]

function readDailySheetColWidths(): number[] {
  const fallback = [...DAILY_SHEET_DEFAULT_COL_WIDTHS]
  try {
    const raw = localStorage.getItem(DAILY_SHEET_COL_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length !== DAILY_SHEET_DEFAULT_COL_WIDTHS.length) return fallback
    return parsed.map((v, i) => {
      const d = DAILY_SHEET_DEFAULT_COL_WIDTHS[i] ?? 80
      const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : d
      return Math.min(560, Math.max(40, n))
    })
  } catch {
    return fallback
  }
}

export function DailyShiftPage() {
  const { setHeaderActions } = useOutletContext<AppOutletContextValue>()
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [workDate, setWorkDate] = useState(() => localTodayYmd())
  const [sheet, setSheet] = useState<DailySheet | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { user } = useAuth()

  const canEditPastDays = Boolean(user?.roles?.some((r) => MANAGER_ROLES.has(r)))
  const isPastWorkDate = workDate < localTodayYmd()
  const tableReadOnly = isPastWorkDate && !canEditPastDays

  const staffRollup = useMemo(() => (sheet ? sumStaffRollup(sheet.rows) : null), [sheet])
  const [colWidths, setColWidths] = useState<number[]>(() => readDailySheetColWidths())
  const colWidthsRef = useRef(colWidths)
  colWidthsRef.current = colWidths

  const tableWidthPx = useMemo(() => colWidths.reduce((a, b) => a + b, 0), [colWidths])

  const startResizeColumn = useCallback((colIndex: number, e: ReactPointerEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const pid = e.pointerId
    let lastX = e.clientX
    const originX = e.clientX
    const originW = colWidthsRef.current[colIndex] ?? 80
    const clamp = (w: number) => Math.min(560, Math.max(48, Math.round(w)))

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return
      lastX = ev.clientX
      const w = clamp(originW + (lastX - originX))
      setColWidths((prev) => {
        if (prev[colIndex] === w) return prev
        const next = [...prev]
        next[colIndex] = w
        return next
      })
    }

    const finish = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', finish)
      handle.removeEventListener('pointercancel', finish)
      try {
        handle.releasePointerCapture(pid)
      } catch {
        /* already released */
      }
      lastX = ev.clientX
      const w = clamp(originW + (lastX - originX))
      setColWidths((prev) => {
        const next = [...prev]
        next[colIndex] = w
        try {
          localStorage.setItem(DAILY_SHEET_COL_STORAGE_KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
    }

    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', finish)
    handle.addEventListener('pointercancel', finish)
  }, [])

  const load = useCallback(async () => {
    if (!storeId) return
    setErr(null)
    setBusy(true)
    try {
      const d = await krikApi.fetchShiftKpiDaily(storeId, workDate)
      setSheet(d)
    } catch {
      setErr('Không tải được bảng công.')
      setSheet(null)
    } finally {
      setBusy(false)
    }
  }, [storeId, workDate])

  useEffect(() => {
    void load()
  }, [load])

  const onExportExcel = useCallback(async () => {
    if (!storeId) return
    setErr(null)
    try {
      const blob = await krikApi.downloadDailyShiftExport(storeId, workDate)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bang-con-ngay-${workDate}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setErr('Xuất Excel thất bại.')
    }
  }, [storeId, workDate])

  useEffect(() => {
    setHeaderActions(
      <button
        type="button"
        className="krik-header-btn krik-header-btn--solid"
        disabled={!storeId || busy}
        onClick={() => void onExportExcel()}
      >
        Xuất Excel
      </button>,
    )
    return () => setHeaderActions(null)
  }, [setHeaderActions, storeId, workDate, busy, onExportExcel])

  async function saveCell(row: DailyEntryRow, patch: Partial<Record<NumKey, number>>) {
    if (!storeId) return
    if (isPastWorkDate && !canEditPastDays) {
      setErr('Ngày làm việc đã qua: chỉ quản lý cửa hàng / khu vực / Admin HR được sửa.')
      return
    }
    try {
      await krikApi.patchShiftKpiDailyEntry(storeId, {
        entryId: row.entryId,
        expectedVersion: row.version,
        ...patch,
      })
      await load()
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        setErr('Không có quyền sửa ngày đã qua. Liên hệ quản lý.')
        return
      }
      if (axiosIsConflict(e)) {
        setErr('Phiên bản dữ liệu đã đổi — đang tải lại.')
        await load()
        return
      }
      setErr('Lưu thất bại.')
    }
  }

  return (
    <>
      <p className="krik-page-lead">
        Nhập giờ làm và doanh thu theo ca cho từng nhân viên. Dữ liệu lưu khi rời ô nhập; sau khi lưu hệ thống tải lại bảng để cập nhật mục tiêu và % KPI cho mọi nhân viên. Mặc định chọn{' '}
        <strong>ngày hiện tại</strong>. <strong>Ngày đã qua</strong> chỉ quản lý cửa hàng / khu vực / Admin HR được sửa.
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
            Ngày làm việc
            <input
              className="krik-input"
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
            />
          </label>
        </div>
        {tableReadOnly ? (
          <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
            Ngày làm việc đã qua: chỉ tài khoản quản lý được chỉnh sửa bảng công.
          </p>
        ) : null}
      </div>
      {err ? <p className="krik-alert">{err}</p> : null}
      {sheet ? (
        <>
          <div className="krik-card" style={{ marginBottom: 14 }}>
            <h2 className="krik-page-title" style={{ fontSize: '1rem', marginBottom: 8 }}>
              Tổng hợp theo ngày (cửa hàng)
            </h2>
            <p className="muted" style={{ fontSize: 12, margin: '0 0 12px', lineHeight: 1.45 }}>
              <strong>Doanh thu theo ca</strong> và <strong>KH / Đơn / SP</strong> dưới đây là <strong>tổng</strong> các giá trị đang có trên bảng nhân viên.{' '}
              <strong>KPI ngày cửa hàng</strong> lấy từ bản ghi cửa hàng trong hệ thống — không đổi khi chỉnh doanh thu trên bảng (chỉnh qua cấu hình KPI tháng / đồng bộ nguồn khác nếu có).
            </p>
            <div className="krik-daily-summary-grid">
              {(() => {
                const r = staffRollup ?? sumStaffRollup([])
                return [
                  {
                    label: 'Doanh thu ca sáng (tổng NV)',
                    value: formatMoneyEn(r.revenueMorning, 0),
                  },
                  {
                    label: 'Doanh thu ca chiều (tổng NV)',
                    value: formatMoneyEn(r.revenueAfternoon, 0),
                  },
                  {
                    label: 'Doanh thu ca tối (tổng NV)',
                    value: formatMoneyEn(r.revenueEvening, 0),
                  },
                  {
                    label: 'Khách hàng / Đơn / SP (tổng NV)',
                    value: `${formatMoneyEn(r.customers, 0)} / ${formatMoneyEn(r.orders, 0)} / ${formatMoneyEn(r.products, 0)}`,
                  },
                  {
                    label: 'KPI ngày cửa hàng',
                    value: formatMoneyEn(sheet.summary.storeDayKpiTarget, 0),
                  },
                  {
                    label: 'Tổng doanh thu ba ca (tổng NV)',
                    value: formatMoneyEn(r.tongBaCa, 0),
                  },
                ].map((tile) => (
                  <div key={tile.label} className="krik-daily-summary-tile">
                    <div className="krik-daily-summary-tile-label">{tile.label}</div>
                    <div className="krik-daily-summary-tile-value krik-money">
                      <strong>{tile.value}</strong>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
          <div className="krik-card krik-scroll-wide">
            <div className="krik-table-wrap">
              <table className="krik-table krik-sheet-table" style={{ minWidth: Math.max(tableWidthPx, 720) }}>
                <colgroup>
                  {colWidths.map((w, i) => (
                    <col key={i} style={{ minWidth: w }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <SheetHeadCell colIndex={0} onResizePointerDown={startResizeColumn}>
                      STT
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={1} onResizePointerDown={startResizeColumn}>
                      Mã nhân viên
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={2} onResizePointerDown={startResizeColumn}>
                      Họ tên
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={3} onResizePointerDown={startResizeColumn}>
                      Chức danh
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={4} onResizePointerDown={startResizeColumn}>
                      Hợp đồng
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={5} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Giờ công ca sáng
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={6} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Giờ công ca chiều
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={7} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Giờ công ca tối
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={8} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Giờ công bổ sung
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={9} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Doanh thu ca sáng
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={10} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Doanh thu ca chiều
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={11} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Doanh thu ca tối
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={12} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Khách hàng
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={13} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Lượt thử đồ
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={14} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Đơn hàng
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={15} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Sản phẩm
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={16} className="krik-money" onResizePointerDown={startResizeColumn}>
                      Mục tiêu doanh thu NV
                    </SheetHeadCell>
                    <SheetHeadCell colIndex={17} className="krik-money" onResizePointerDown={startResizeColumn}>
                      % KPI nhân viên
                    </SheetHeadCell>
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.map((row: DailyEntryRow, i: number) => (
                    <DailyRowInputs key={row.entryId} index={i + 1} row={row} readOnly={tableReadOnly} onSave={saveCell} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p className="muted">{busy ? 'Đang tải…' : 'Chọn cửa hàng để xem dữ liệu.'}</p>
      )}
    </>
  )
}

function SheetHeadCell({
  colIndex,
  className,
  children,
  onResizePointerDown,
}: {
  colIndex: number
  className?: string
  children: ReactNode
  onResizePointerDown: (colIndex: number, e: ReactPointerEvent<HTMLElement>) => void
}) {
  return (
    <th className={['krik-th-resizable', className].filter(Boolean).join(' ')} scope="col">
      <div className="krik-th-resizable-inner">
        <span className="krik-th-label-text">{children}</span>
        <span
          className="krik-col-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Kéo để chỉnh độ rộng cột"
          onPointerDown={(e) => onResizePointerDown(colIndex, e)}
        />
      </div>
    </th>
  )
}

function DailyRowInputs({
  index,
  row,
  readOnly,
  onSave,
}: {
  index: number
  row: DailyEntryRow
  readOnly: boolean
  onSave: (row: DailyEntryRow, patch: Partial<Record<NumKey, number>>) => void
}) {
  const syncKey = `${row.entryId}-${row.version}`

  return (
    <tr key={`${row.entryId}-${row.version}`}>
      <td>{index}</td>
      <td>
        <code>{row.staffCode}</code>
      </td>
      <td>{row.fullName}</td>
      <td>{row.positionCode}</td>
      <td>{row.contractType}</td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.hoursMorning}
          syncKey={syncKey}
          maxFractionDigits={2}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { hoursMorning: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.hoursAfternoon}
          syncKey={syncKey}
          maxFractionDigits={2}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { hoursAfternoon: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.hoursEvening}
          syncKey={syncKey}
          maxFractionDigits={2}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { hoursEvening: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.hoursExtra}
          syncKey={syncKey}
          maxFractionDigits={2}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { hoursExtra: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.revenueMorning}
          syncKey={syncKey}
          maxFractionDigits={2}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { revenueMorning: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.revenueAfternoon}
          syncKey={syncKey}
          maxFractionDigits={2}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { revenueAfternoon: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.revenueEvening}
          syncKey={syncKey}
          maxFractionDigits={2}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { revenueEvening: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.customers}
          syncKey={syncKey}
          maxFractionDigits={0}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { customers: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.tryOns}
          syncKey={syncKey}
          maxFractionDigits={0}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { tryOns: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.orders}
          syncKey={syncKey}
          maxFractionDigits={0}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { orders: n })}
        />
      </td>
      <td className="krik-money">
        <MoneyCellInput
          value={row.products}
          syncKey={syncKey}
          maxFractionDigits={0}
          readOnly={readOnly}
          onCommit={(n) => onSave(row, { products: n })}
        />
      </td>
      <td className="krik-money">{formatMoneyEn(row.targetNv, 2)}</td>
      <td className="krik-money">
        <span className="krik-pill-kpi">{formatMoneyEn(row.percentNv, 1)}%</span>
      </td>
    </tr>
  )
}

function axiosIsConflict(e: unknown): boolean {
  return axios.isAxiosError(e) && e.response?.status === 409
}
