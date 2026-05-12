import { useAuth } from '../auth/AuthContext'

const roleVi: Record<string, string> = {
  AdminHR: 'Quản trị & nhân sự',
  AreaManager: 'Quản lý khu vực',
  StoreManager: 'Quản lý cửa hàng',
  SalesStaff: 'Nhân viên bán hàng',
}

function rolesVi(roles: string[]) {
  return roles.map((r) => roleVi[r] ?? r).join(' · ')
}

export function DashboardPage() {
  const { user } = useAuth()
  return (
    <>
      <p className="krik-page-lead">Thông tin tài khoản đang đăng nhập (từ máy chủ xác thực).</p>
      <div className="krik-card">
        <h2 className="krik-page-title">Thông tin phiên</h2>
        <dl className="krik-kv">
          <dt>Email</dt>
          <dd>{user?.email}</dd>
          <dt>Họ tên</dt>
          <dd>{user?.fullName}</dd>
          <dt>Vai trò</dt>
          <dd>{user?.roles.length ? rolesVi(user.roles) : '—'}</dd>
          <dt>Mã cửa hàng</dt>
          <dd>{user?.storeId ?? '—'}</dd>
          <dt>Mã khu vực</dt>
          <dd>{user?.areaIds.length ? user.areaIds.join(', ') : '—'}</dd>
        </dl>
      </div>
    </>
  )
}
