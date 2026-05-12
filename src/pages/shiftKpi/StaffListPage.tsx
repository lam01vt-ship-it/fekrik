import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import * as krikApi from '../../api/krikApi'
import { messageFromApiError } from '../../api/apiError'
import { KrikConfirmModal, KrikMessageModal, KrikModal } from '../../components/KrikModal'
import { MoneyCellInput } from '../../components/MoneyCellInput'
import { useShiftKpiStoreId } from '../../hooks/useShiftKpiStoreId'
import type { AppOutletContextValue } from '../../layout/appOutletContext'
import type { StoreRow } from '../../types/api'
import type { StoreStaff } from '../../types/shiftKpi'
import { formatMoneyEn, parseMoneyEn } from '../../utils/moneyFormat'

const defaultForm = {
  staffCode: '',
  fullName: '',
  positionCode: 'NVBH_FT',
  contractType: 'CT',
  hourlyRate: formatMoneyEn(48000, 2),
  teamBonusBase: formatMoneyEn(0, 2),
  loginEmail: '',
  loginPassword: '',
}

type Notice = { variant: 'success' | 'error'; title: string; message: string }

function staffToForm(s: StoreStaff) {
  return {
    staffCode: s.staffCode,
    fullName: s.fullName,
    positionCode: s.positionCode,
    contractType: s.contractType,
    hourlyRate: formatMoneyEn(Number(s.hourlyRate), 2),
    teamBonusBase: formatMoneyEn(Number(s.teamBonusBase), 2),
    loginEmail: '',
    loginPassword: '',
  }
}

export function StaffListPage() {
  const { setHeaderActions } = useOutletContext<AppOutletContextValue>()
  const { stores, storeId, setStoreId } = useShiftKpiStoreId()
  const [rows, setRows] = useState<StoreStaff[]>([])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [staffModal, setStaffModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<StoreStaff | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const load = useCallback(async () => {
    if (!storeId) {
      setRows([])
      return
    }
    try {
      const r = await krikApi.fetchShiftKpiStaff(storeId)
      setRows(r)
    } catch {
      setRows([])
      setNotice({
        variant: 'error',
        title: 'Lỗi',
        message: 'Không tải được danh sách nhân viên.',
      })
    }
  }, [storeId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setSelected(new Set())
  }, [storeId])

  const openAdd = useCallback(() => {
    if (!storeId) return
    setEditing(null)
    setForm(defaultForm)
    setStaffModal('add')
  }, [storeId])

  const openEdit = useCallback((s: StoreStaff) => {
    setEditing(s)
    setForm(staffToForm(s))
    setStaffModal('edit')
  }, [])

  const allIds = useMemo(() => rows.map((r) => r.id), [rows])
  const allSelected = rows.length > 0 && allIds.every((id) => selected.has(id))

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

  const runBatchDelete = useCallback(async () => {
    if (!storeId || selected.size === 0) return
    const n = selected.size
    const ids = [...selected]
    setDeleteConfirmOpen(false)
    try {
      for (const id of ids) {
        await krikApi.deleteShiftKpiStaff(storeId, id)
      }
      setSelected(new Set())
      await load()
      setNotice({ variant: 'success', title: 'Thành công', message: `Đã xoá ${n} nhân viên.` })
    } catch (err) {
      setNotice({
        variant: 'error',
        title: 'Thất bại',
        message: messageFromApiError(err, 'Không xoá hết được (một số dòng có thể đã bị xoá hoặc không có quyền).'),
      })
      await load()
    }
  }, [storeId, selected, load])

  useEffect(() => {
    setHeaderActions(
      <>
        <button
          type="button"
          className="krik-header-btn krik-header-btn--solid"
          disabled={!storeId}
          onClick={openAdd}
        >
          Thêm nhân viên
        </button>
        <button
          type="button"
          className="krik-header-btn"
          disabled={!storeId || selected.size === 0}
          onClick={() => setDeleteConfirmOpen(true)}
        >
          Xoá đã chọn ({selected.size})
        </button>
      </>,
    )
    return () => setHeaderActions(null)
  }, [setHeaderActions, storeId, selected.size, openAdd])

  async function submitStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!storeId) return
    try {
      if (staffModal === 'add') {
        await krikApi.postShiftKpiStaff(storeId, {
          staffCode: form.staffCode.trim(),
          fullName: form.fullName.trim(),
          positionCode: form.positionCode,
          contractType: form.contractType,
          hourlyRate: parseMoneyEn(form.hourlyRate),
          teamBonusBase: parseMoneyEn(form.teamBonusBase),
          linkedUserId: null,
          loginEmail: form.loginEmail.trim(),
          loginPassword: form.loginPassword,
        })
        setStaffModal(null)
        setForm(defaultForm)
        setSelected(new Set())
        await load()
        setNotice({ variant: 'success', title: 'Thành công', message: 'Đã thêm nhân viên và tài khoản đăng nhập.' })
      } else if (staffModal === 'edit' && editing) {
        const hasLinked = Boolean(editing.linkedUserId)
        const email = form.loginEmail.trim()
        const pwd = form.loginPassword
        await krikApi.putShiftKpiStaff(storeId, editing.id, {
          staffCode: form.staffCode.trim(),
          fullName: form.fullName.trim(),
          positionCode: form.positionCode,
          contractType: form.contractType,
          hourlyRate: parseMoneyEn(form.hourlyRate),
          teamBonusBase: parseMoneyEn(form.teamBonusBase),
          linkedUserId: editing.linkedUserId,
          loginEmail: hasLinked ? null : email || null,
          loginPassword: hasLinked ? null : pwd || null,
        })
        setStaffModal(null)
        setEditing(null)
        await load()
        setNotice({ variant: 'success', title: 'Thành công', message: 'Đã cập nhật nhân viên.' })
      }
    } catch (err) {
      setNotice({
        variant: 'error',
        title: 'Thất bại',
        message: messageFromApiError(
          err,
          staffModal === 'add'
            ? 'Không thêm được (mã trùng, email trùng, thiếu email/mật khẩu hoặc không có quyền).'
            : 'Không cập nhật được nhân viên.',
        ),
      })
    }
  }

  const showLoginBlock = staffModal === 'add' || (staffModal === 'edit' && editing && !editing.linkedUserId)

  return (
    <>
      <p className="krik-page-lead">
        Thêm nhân viên bắt buộc kèm email và mật khẩu đăng nhập. Sửa nhân viên: bấm vào dòng; nếu chưa có tài
        khoản, có thể nhập email và mật khẩu trong form sửa để tạo đăng nhập. Chọn checkbox và dùng nút Xoá đã chọn
        trên header để xoá nhiều người.
      </p>
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

      <KrikModal
        open={staffModal !== null}
        title={staffModal === 'add' ? 'Thêm nhân viên' : 'Sửa nhân viên'}
        onClose={() => {
          setStaffModal(null)
          setEditing(null)
        }}
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="krik-btn krik-btn--ghost"
              onClick={() => {
                setStaffModal(null)
                setEditing(null)
              }}
            >
              Huỷ
            </button>
            <button type="submit" form="staff-form-dialog" className="krik-btn krik-btn--primary">
              {staffModal === 'add' ? 'Thêm' : 'Lưu'}
            </button>
          </>
        }
      >
        <form id="staff-form-dialog" onSubmit={(e) => void submitStaff(e)} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              className="krik-input"
              placeholder="Mã nhân viên"
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
          {staffModal === 'edit' && editing?.linkedEmail ? (
            <label className="krik-field">
              Email đăng nhập
              <input className="krik-input" value={editing.linkedEmail} readOnly disabled />
            </label>
          ) : null}
          {showLoginBlock ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                className="krik-input"
                type="email"
                autoComplete="off"
                placeholder={staffModal === 'add' ? 'Email đăng nhập' : 'Email đăng nhập (nếu tạo tài khoản)'}
                value={form.loginEmail}
                onChange={(e) => setForm((f) => ({ ...f, loginEmail: e.target.value }))}
                required={staffModal === 'add'}
                style={{ flex: 1, minWidth: 200 }}
              />
              <input
                className="krik-input"
                type="password"
                autoComplete="new-password"
                placeholder={staffModal === 'add' ? 'Mật khẩu (tối thiểu 6 ký tự)' : 'Mật khẩu (khi tạo tài khoản)'}
                value={form.loginPassword}
                onChange={(e) => setForm((f) => ({ ...f, loginPassword: e.target.value }))}
                required={staffModal === 'add'}
                style={{ flex: 1, minWidth: 200 }}
              />
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              className="krik-input"
              value={form.positionCode}
              onChange={(e) => setForm((f) => ({ ...f, positionCode: e.target.value }))}
            >
              <option value="QLCH">Quản lý cửa hàng</option>
              <option value="CHP">Phó cửa hàng</option>
              <option value="NVBH_FT">Bán hàng (chính thức)</option>
              <option value="NVBH_PT">Bán hàng (thời vụ)</option>
              <option value="NVBV">Bảo vệ</option>
            </select>
            <select
              className="krik-input"
              value={form.contractType}
              onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))}
            >
              <option value="CT">Chính thức</option>
              <option value="TV">Thời vụ</option>
            </select>
            <label className="krik-field">
              Đơn giá một giờ (VND)
              <MoneyCellInput
                value={parseMoneyEn(form.hourlyRate) || 0}
                syncKey={`${staffModal}-${editing?.id ?? 'new'}-${form.staffCode}`}
                maxFractionDigits={2}
                onCommit={(n) => setForm((f) => ({ ...f, hourlyRate: formatMoneyEn(n, 2) }))}
                className="krik-input krik-money-input"
              />
            </label>
            <label className="krik-field">
              Thưởng team quản lý (VND)
              <MoneyCellInput
                value={parseMoneyEn(form.teamBonusBase) || 0}
                syncKey={`${staffModal}-${editing?.id ?? 'new'}-${form.staffCode}-tb`}
                maxFractionDigits={2}
                onCommit={(n) => setForm((f) => ({ ...f, teamBonusBase: formatMoneyEn(n, 2) }))}
                className="krik-input krik-money-input"
              />
            </label>
          </div>
        </form>
      </KrikModal>

      <KrikConfirmModal
        open={deleteConfirmOpen}
        title="Xoá nhân viên"
        message={`Xoá ${selected.size} nhân viên đã chọn? Thao tác không hoàn tác.`}
        confirmLabel="Xoá"
        danger
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void runBatchDelete()}
      />

      <KrikMessageModal
        open={notice !== null}
        variant={notice?.variant ?? 'success'}
        title={notice?.title ?? ''}
        message={notice?.message ?? ''}
        onClose={() => setNotice(null)}
      />

      <div className="krik-card krik-table-wrap">
        <table className="krik-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Chọn tất cả" />
              </th>
              <th>Mã</th>
              <th>Họ tên</th>
              <th>Chức danh</th>
              <th>Hợp đồng</th>
              <th className="krik-money">Lương theo giờ</th>
              <th>Email đăng nhập</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ color: 'var(--muted)' }}>
                  {storeId ? 'Chưa có nhân viên ở cửa hàng này.' : 'Chọn cửa hàng để xem danh sách.'}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="krik-table-row--click" onClick={() => openEdit(r)}>
                  <td
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={`Chọn ${r.staffCode}`}
                    />
                  </td>
                  <td>
                    <code>{r.staffCode}</code>
                  </td>
                  <td>{r.fullName}</td>
                  <td>{r.positionCode}</td>
                  <td>{r.contractType}</td>
                  <td className="krik-money">{formatMoneyEn(Number(r.hourlyRate), 2)}</td>
                  <td>{r.linkedEmail ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
