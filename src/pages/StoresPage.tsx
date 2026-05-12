import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import * as krikApi from '../api/krikApi'
import { messageFromApiError } from '../api/apiError'
import { useAuth } from '../auth/AuthContext'
import { KrikConfirmModal, KrikMessageModal, KrikModal } from '../components/KrikModal'
import type { AppOutletContextValue } from '../layout/appOutletContext'
import type { AreaRow, StoreRow } from '../types/api'

const emptyForm = { code: '', name: '', areaId: '' }

type Notice = { variant: 'success' | 'error'; title: string; message: string }

export function StoresPage() {
  const { user } = useAuth()
  const { setHeaderActions } = useOutletContext<AppOutletContextValue>()
  const canManage = useMemo(
    () => Boolean(user?.roles.includes('AdminHR') || user?.roles.includes('AreaManager')),
    [user?.roles],
  )

  const [rows, setRows] = useState<StoreRow[] | null>(null)
  const [areas, setAreas] = useState<AreaRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [storeModal, setStoreModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<StoreRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const loadStores = useCallback(async () => {
    try {
      const data = await krikApi.fetchStores()
      setRows(data)
    } catch {
      setRows(null)
      setNotice({
        variant: 'error',
        title: 'Lỗi',
        message: 'Không tải được danh sách cửa hàng.',
      })
    }
  }, [])

  const loadAreas = useCallback(async () => {
    if (!canManage) return
    try {
      const a = await krikApi.fetchAreas()
      setAreas(a)
    } catch {
      setAreas([])
    }
  }, [canManage])

  useEffect(() => {
    void loadStores()
  }, [loadStores])

  useEffect(() => {
    void loadAreas()
  }, [loadAreas])

  const openAdd = useCallback(() => {
    setEditing(null)
    setForm((f) => ({
      code: '',
      name: '',
      areaId: f.areaId || areas[0]?.id || '',
    }))
    setStoreModal('add')
  }, [areas])

  const openEdit = useCallback(
    (row: StoreRow) => {
      if (!canManage) return
      setEditing(row)
      setForm({ code: row.code, name: row.name, areaId: row.areaId })
      setStoreModal('edit')
    },
    [canManage],
  )

  const onExport = useCallback(async () => {
    try {
      const blob = await krikApi.downloadStoresExport()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cua-hang.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      setNotice({ variant: 'success', title: 'Thành công', message: 'Đã tải file Excel.' })
    } catch (err) {
      setNotice({
        variant: 'error',
        title: 'Thất bại',
        message: messageFromApiError(err, 'Xuất Excel thất bại.'),
      })
    }
  }, [])

  const runBatchDelete = useCallback(async () => {
    if (!canManage || selected.size === 0) return
    const n = selected.size
    setDeleteOpen(false)
    try {
      await krikApi.postStoresBatchDelete([...selected])
      setSelected(new Set())
      await loadStores()
      setNotice({ variant: 'success', title: 'Thành công', message: `Đã xoá ${n} cửa hàng.` })
    } catch (err) {
      setNotice({
        variant: 'error',
        title: 'Thất bại',
        message: messageFromApiError(err, 'Không xoá được (còn dữ liệu tham chiếu hoặc không có quyền).'),
      })
    }
  }, [canManage, selected, loadStores])

  useEffect(() => {
    setHeaderActions(
      <>
        <button type="button" className="krik-header-btn" onClick={() => void onExport()}>
          Xuất Excel
        </button>
        {canManage ? (
          <>
            <button type="button" className="krik-header-btn krik-header-btn--solid" onClick={openAdd}>
              Thêm cửa hàng
            </button>
            <button
              type="button"
              className="krik-header-btn"
              disabled={selected.size === 0}
              onClick={() => setDeleteOpen(true)}
            >
              Xoá đã chọn ({selected.size})
            </button>
          </>
        ) : null}
      </>,
    )
    return () => setHeaderActions(null)
  }, [setHeaderActions, canManage, selected.size, onExport, openAdd])

  const allIds = useMemo(() => (rows ?? []).map((r) => r.id), [rows])
  const allSelected = rows !== null && rows.length > 0 && allIds.every((id) => selected.has(id))

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIds))
  }

  async function submitStore(e: React.FormEvent) {
    e.preventDefault()
    if (!canManage) return
    try {
      if (storeModal === 'add') {
        await krikApi.postStore({
          code: form.code.trim(),
          name: form.name.trim(),
          areaId: form.areaId,
        })
        setStoreModal(null)
        setForm(emptyForm)
        setSelected(new Set())
        await loadStores()
        setNotice({ variant: 'success', title: 'Thành công', message: 'Đã thêm cửa hàng.' })
      } else if (storeModal === 'edit' && editing) {
        await krikApi.putStore(editing.id, {
          name: form.name.trim(),
          areaId: form.areaId,
        })
        setStoreModal(null)
        setEditing(null)
        await loadStores()
        setNotice({ variant: 'success', title: 'Thành công', message: 'Đã cập nhật cửa hàng.' })
      }
    } catch (err) {
      setNotice({
        variant: 'error',
        title: 'Thất bại',
        message: messageFromApiError(
          err,
          storeModal === 'add'
            ? 'Không thêm được (mã trùng hoặc không có quyền).'
            : 'Không cập nhật được cửa hàng.',
        ),
      })
    }
  }

  const areaOptions = areas.length > 0 ? areas : editing ? [{ id: editing.areaId, code: editing.areaCode, name: editing.areaName }] : []

  return (
    <>
      <p className="krik-page-lead">
        Danh sách theo phạm vi: quản trị xem tất cả, quản lý khu vực xem cửa hàng thuộc khu, quản lý cửa hàng và
        nhân viên bán hàng chỉ thấy một cửa hàng. Bấm vào dòng để sửa (nếu có quyền quản lý cửa hàng).
      </p>

      <KrikModal
        open={storeModal !== null}
        title={storeModal === 'add' ? 'Thêm cửa hàng' : 'Sửa cửa hàng'}
        onClose={() => {
          setStoreModal(null)
          setEditing(null)
        }}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="krik-btn krik-btn--ghost"
              onClick={() => {
                setStoreModal(null)
                setEditing(null)
              }}
            >
              Huỷ
            </button>
            <button type="submit" form="store-form-dialog" className="krik-btn krik-btn--primary">
              {storeModal === 'add' ? 'Thêm' : 'Lưu'}
            </button>
          </>
        }
      >
        <form id="store-form-dialog" onSubmit={(e) => void submitStore(e)}>
          {storeModal === 'edit' && editing ? (
            <label className="krik-field">
              Mã cửa hàng
              <input className="krik-input" value={form.code} readOnly disabled />
            </label>
          ) : (
            <label className="krik-field">
              Mã
              <input
                className="krik-input"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                required
              />
            </label>
          )}
          <label className="krik-field">
            Tên
            <input
              className="krik-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="krik-field">
            Khu
            <select
              className="krik-input"
              value={form.areaId}
              onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
              required
              disabled={!canManage || areaOptions.length === 0}
            >
              {areaOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </label>
        </form>
      </KrikModal>

      <KrikConfirmModal
        open={deleteOpen}
        title="Xoá cửa hàng"
        message={`Xoá ${selected.size} cửa hàng đã chọn? Thao tác không hoàn tác.`}
        confirmLabel="Xoá"
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void runBatchDelete()}
      />

      <KrikMessageModal
        open={notice !== null}
        variant={notice?.variant ?? 'success'}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />

      <div className="krik-card">
        <div className="krik-table-wrap">
          <table className="krik-table">
            <thead>
              <tr>
                {canManage ? (
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Chọn tất cả" />
                  </th>
                ) : null}
                <th>Mã</th>
                <th>Tên</th>
                <th>Khu</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr>
                  <td colSpan={canManage ? 4 : 3} style={{ color: 'var(--muted)' }}>
                    Đang tải…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 4 : 3} style={{ color: 'var(--muted)' }}>
                    Không có cửa hàng trong phạm vi của bạn.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr
                    key={s.id}
                    className={canManage ? 'krik-table-row--click' : undefined}
                    onClick={() => {
                      if (canManage) openEdit(s)
                    }}
                  >
                    {canManage ? (
                      <td
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                          aria-label={`Chọn ${s.code}`}
                        />
                      </td>
                    ) : null}
                    <td>
                      <code>{s.code}</code>
                    </td>
                    <td>{s.name}</td>
                    <td>
                      {s.areaName} <span style={{ color: 'var(--muted)' }}>({s.areaCode})</span>
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
