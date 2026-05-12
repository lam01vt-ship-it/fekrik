import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()
  return (
    <>
      <p className="krik-page-lead">
        Skeleton Krik — JWT và RBAC đã nối với API .NET. Dữ liệu dưới đây lấy từ token hiện tại.
      </p>
      <div className="krik-card">
        <h2 className="krik-page-title">Thông tin phiên</h2>
        <dl className="krik-kv">
          <dt>Email</dt>
          <dd>{user?.email}</dd>
          <dt>Họ tên</dt>
          <dd>{user?.fullName}</dd>
          <dt>Roles</dt>
          <dd>{user?.roles.join(', ') || '—'}</dd>
          <dt>StoreId</dt>
          <dd>{user?.storeId ?? '—'}</dd>
          <dt>AreaIds</dt>
          <dd>{user?.areaIds.length ? user.areaIds.join(', ') : '—'}</dd>
        </dl>
      </div>
    </>
  )
}
