import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import * as krikApi from '../../api/krikApi'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { StoreRow } from '../../types/api'
import type { DailyEntryRow, DailySheet } from '../../types/shiftKpi'

function money(n: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n))
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

export function DailyShiftPage() {
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [workDate, setWorkDate] = useState('2026-05-08')
  const [sheet, setSheet] = useState<DailySheet | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!storeId) return
    setErr(null)
    setBusy(true)
    try {
      const d = await krikApi.fetchShiftKpiDaily(storeId, workDate)
      setSheet(d)
    } catch {
      setErr('Không tải được bảng công (kiểm tra quyền / API).')
      setSheet(null)
    } finally {
      setBusy(false)
    }
  }, [storeId, workDate])

  useEffect(() => {
    void load()
  }, [load])

  async function saveCell(row: DailyEntryRow, patch: Partial<Record<NumKey, number>>) {
    if (!storeId) return
    try {
      const updated = await krikApi.patchShiftKpiDailyEntry(storeId, {
        entryId: row.entryId,
        expectedVersion: row.version,
        ...patch,
      })
      setSheet((prev: DailySheet | null) => {
        if (!prev) return prev
        return {
          ...prev,
          rows: prev.rows.map((r: DailyEntryRow) => (r.entryId === updated.entryId ? { ...r, ...updated } : r)),
        }
      })
    } catch (e: unknown) {
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
        Giống tab <strong>1.Nhập DL</strong> trên sheet: tổng DT cửa hàng theo ca, sau đó từng NV — giờ
        công / DT cá nhân / chỉ số phụ. Lưu khi rời ô (blur); dùng <code>expectedVersion</code> để tránh
        ghi đè khi hai người sửa cùng lúc.
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
          <button type="button" className="krik-btn krik-btn--ghost" onClick={() => void load()} disabled={busy}>
            Tải lại
          </button>
        </div>
      </div>
      {err ? <p className="krik-alert">{err}</p> : null}
      {sheet ? (
        <>
          <div className="krik-card" style={{ marginBottom: 14 }}>
            <h2 className="krik-page-title" style={{ fontSize: '1rem' }}>
              Tổng doanh thu CH (theo ca) — mock &amp; KPI ngày CH
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 10,
                fontSize: 13,
              }}
            >
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Ca sáng
                </div>
                <strong>{money(sheet.summary.channelRevenueMorning)}</strong>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Ca chiều
                </div>
                <strong>{money(sheet.summary.channelRevenueAfternoon)}</strong>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Ca tối
                </div>
                <strong>{money(sheet.summary.channelRevenueEvening)}</strong>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  KH / Đơn / SP (CH)
                </div>
                <strong>
                  {sheet.summary.storeCustomers} / {sheet.summary.storeOrders} / {sheet.summary.storeProducts}
                </strong>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  KPI ngày CH
                </div>
                <strong>{money(sheet.summary.storeDayKpiTarget)}</strong>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  DT API (mock)
                </div>
                <strong>{money(sheet.summary.mockApiRevenueTotal)}</strong>
              </div>
            </div>
          </div>
          <div className="krik-card krik-scroll-wide">
            <div className="krik-table-wrap">
              <table className="krik-table krik-sheet-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã</th>
                    <th>Họ tên</th>
                    <th>CD</th>
                    <th>HĐ</th>
                    <th>GC S</th>
                    <th>GC C</th>
                    <th>GC T</th>
                    <th>GC BS</th>
                    <th>DT S</th>
                    <th>DT C</th>
                    <th>DT T</th>
                    <th>KH</th>
                    <th>Thử</th>
                    <th>Đơn</th>
                    <th>SP</th>
                    <th>Target NV</th>
                    <th>%KPI</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.map((row: DailyEntryRow, i: number) => (
                    <DailyRowInputs key={row.entryId} index={i + 1} row={row} onSave={saveCell} />
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

function DailyRowInputs({
  index,
  row,
  onSave,
}: {
  index: number
  row: DailyEntryRow
  onSave: (row: DailyEntryRow, patch: Partial<Record<NumKey, number>>) => void
}) {
  const blur =
    (field: NumKey, parser: (v: string) => number) =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim()
      const next = parser(raw === '' ? '0' : raw)
      if (Number.isNaN(next) || next < 0) return
      const cur = row[field] as number
      if (next === cur) return
      onSave(row, { [field]: next } as Partial<Record<NumKey, number>>)
    }

  return (
    <tr key={`${row.entryId}-${row.version}`}>
      <td>{index}</td>
      <td>
        <code>{row.staffCode}</code>
      </td>
      <td>{row.fullName}</td>
      <td>{row.positionCode}</td>
      <td>{row.contractType}</td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.hoursMorning}
          onBlur={blur('hoursMorning', parseFloat)}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.hoursAfternoon}
          onBlur={blur('hoursAfternoon', parseFloat)}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.hoursEvening}
          onBlur={blur('hoursEvening', parseFloat)}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.hoursExtra}
          onBlur={blur('hoursExtra', parseFloat)}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.revenueMorning}
          onBlur={blur('revenueMorning', parseFloat)}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.revenueAfternoon}
          onBlur={blur('revenueAfternoon', parseFloat)}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.revenueEvening}
          onBlur={blur('revenueEvening', parseFloat)}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.customers}
          onBlur={blur('customers', (s) => parseInt(s, 10))}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.tryOns}
          onBlur={blur('tryOns', (s) => parseInt(s, 10))}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.orders}
          onBlur={blur('orders', (s) => parseInt(s, 10))}
        />
      </td>
      <td>
        <input
          className="krik-input krik-cell-input"
          defaultValue={row.products}
          onBlur={blur('products', (s) => parseInt(s, 10))}
        />
      </td>
      <td>{money(row.targetNv)}</td>
      <td>
        <span className="krik-pill-kpi">{row.percentNv.toFixed(1)}%</span>
      </td>
    </tr>
  )
}

function axiosIsConflict(e: unknown): boolean {
  return axios.isAxiosError(e) && e.response?.status === 409
}
