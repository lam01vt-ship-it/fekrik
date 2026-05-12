import { useCallback, useEffect, useState } from 'react'
import * as krikApi from '../../api/krikApi'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { StoreStaff } from '../../types/shiftKpi'
import type { StoreRow } from '../../types/api'

export function StaffListPage() {
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [rows, setRows] = useState<StoreStaff[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState({
    staffCode: '',
    fullName: '',
    positionCode: 'NVBH_FT',
    contractType: 'CT',
    hourlyRate: '48000',
    teamBonusBase: '0',
  })

  const load = useCallback(async () => {
    if (!storeId) return
    setErr(null)
    try {
      const r = await krikApi.fetchShiftKpiStaff(storeId)
      setRows(r)
    } catch {
      setErr('Không tải được danh sách NV.')
    }
  }, [storeId])

  useEffect(() => {
    void load()
  }, [load])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!storeId) return
    try {
      await krikApi.postShiftKpiStaff(storeId, {
        staffCode: form.staffCode.trim(),
        fullName: form.fullName.trim(),
        positionCode: form.positionCode,
        contractType: form.contractType,
        hourlyRate: parseFloat(form.hourlyRate) || 0,
        teamBonusBase: parseFloat(form.teamBonusBase) || 0,
        linkedUserId: null,
      })
      setForm({ staffCode: '', fullName: '', positionCode: 'NVBH_FT', contractType: 'CT', hourlyRate: '48000', teamBonusBase: '0' })
      await load()
    } catch {
      setErr('Thêm NV thất bại (mã trùng hoặc không có quyền).')
    }
  }

  async function onDelete(id: string) {
    if (!storeId || !confirm('Xoá nhân viên này?')) return
    try {
      await krikApi.deleteShiftKpiStaff(storeId, id)
      await load()
    } catch {
      setErr('Xoá thất bại.')
    }
  }

  return (
    <>
      <p className="krik-page-lead">Danh sách NV cửa hàng (CRUD tối thiểu). QLCH+ / HR quản lý roster.</p>
      <div className="krik-card" style={{ marginBottom: 14 }}>
        <label className="krik-field" style={{ maxWidth: 320 }}>
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
      </div>
      {err ? <p className="krik-alert">{err}</p> : null}
      <div className="krik-card" style={{ marginBottom: 14 }}>
        <h2 className="krik-page-title" style={{ fontSize: '1rem' }}>
          Thêm NV
        </h2>
        <form onSubmit={onAdd} style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              className="krik-input"
              placeholder="Mã NV"
              value={form.staffCode}
              onChange={(e) => setForm((f) => ({ ...f, staffCode: e.target.value }))}
              required
            />
            <input
              className="krik-input"
              placeholder="Họ tên"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
              style={{ flex: 1, minWidth: 160 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              className="krik-input"
              value={form.positionCode}
              onChange={(e) => setForm((f) => ({ ...f, positionCode: e.target.value }))}
            >
              <option value="QLCH">QLCH</option>
              <option value="NVBH_FT">NVBH_FT</option>
              <option value="NVBH_PT">NVBH_PT</option>
              <option value="NVBV">NVBV</option>
            </select>
            <select
              className="krik-input"
              value={form.contractType}
              onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))}
            >
              <option value="CT">CT</option>
              <option value="TV">TV</option>
            </select>
            <input
              className="krik-input"
              placeholder="Lương/giờ"
              value={form.hourlyRate}
              onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
            />
            <input
              className="krik-input"
              placeholder="Thưởng team QLCH"
              value={form.teamBonusBase}
              onChange={(e) => setForm((f) => ({ ...f, teamBonusBase: e.target.value }))}
            />
          </div>
          <button type="submit" className="krik-btn krik-btn--primary">
            Thêm
          </button>
        </form>
      </div>
      <div className="krik-card krik-table-wrap">
        <table className="krik-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Họ tên</th>
              <th>CD</th>
              <th>HĐ</th>
              <th>Lương/giờ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <code>{r.staffCode}</code>
                </td>
                <td>{r.fullName}</td>
                <td>{r.positionCode}</td>
                <td>{r.contractType}</td>
                <td>{r.hourlyRate}</td>
                <td>
                  <button type="button" className="krik-btn krik-btn--ghost" onClick={() => void onDelete(r.id)}>
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
