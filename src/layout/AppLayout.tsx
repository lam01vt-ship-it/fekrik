import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function pageMeta(pathname: string): { module: string; title: string } {
  const p = pathname.replace(/\/$/, '') || '/app'
  if (p === '/app') return { module: 'Trang chủ', title: 'Tổng quan' }
  if (p.endsWith('/stores')) return { module: 'Vận hành', title: 'Cửa hàng' }
  if (p.endsWith('/admin')) return { module: 'Quản trị', title: 'Người dùng' }
  if (p.includes('/staff-shift-kpi/daily')) return { module: 'Vận hành', title: 'Bảng công theo ngày' }
  if (p.includes('/staff-shift-kpi/monthly')) return { module: 'Vận hành', title: 'Tổng quan tháng' }
  if (p.includes('/staff-shift-kpi/kpi-config')) return { module: 'Vận hành', title: 'Cấu hình KPI tháng' }
  if (p.includes('/staff-shift-kpi/staff')) return { module: 'Vận hành', title: 'Danh sách NV' }
  if (p.includes('/staff-shift-kpi/payroll')) return { module: 'Vận hành', title: 'Bảng lương' }
  return { module: 'Krik', title: 'Trang' }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const IcHome = () => (
  <svg className="krik-nav-icon" viewBox="0 0 24 24" aria-hidden>
    <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4H9v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
)

const IcStore = () => (
  <svg className="krik-nav-icon" viewBox="0 0 24 24" aria-hidden>
    <path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    <path d="M2 7l2-3h16l2 3" />
    <path d="M10 11h4" strokeLinecap="round" />
  </svg>
)

const IcShield = () => (
  <svg className="krik-nav-icon" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 21s8-4 8-10V5l-8-3-8 3v6c0 6 8 10 8 10z" />
  </svg>
)

const IcCalendar = () => (
  <svg className="krik-nav-icon" viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 11h18" style={{ opacity: 0.55 }} />
  </svg>
)

const IcChart = () => (
  <svg className="krik-nav-icon" viewBox="0 0 24 24" aria-hidden>
    <path d="M4 20h16M6 16l4-8 4 5 4-9" />
  </svg>
)

const IcSliders = () => (
  <svg className="krik-nav-icon" viewBox="0 0 24 24" aria-hidden>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-4M20 14V3M9 10h6M5 18h2M15 7h2" />
  </svg>
)

const IcUsers = () => (
  <svg className="krik-nav-icon" viewBox="0 0 24 24" aria-hidden>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IcMoney = () => (
  <svg className="krik-nav-icon" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('krik_sidebar_collapsed') === '1'
    } catch {
      return false
    }
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.roles.includes('AdminHR') ?? false
  const canStaffMaster =
    isAdmin || user?.roles.includes('AreaManager') || user?.roles.includes('StoreManager')
  const meta = useMemo(() => pageMeta(location.pathname), [location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem('krik_sidebar_collapsed', collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    if (!menuOpen) return
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen, closeMenu])

  return (
    <div className={`krik-frame${collapsed ? ' is-collapsed' : ''}`}>
      <aside className={`krik-sidenav${collapsed ? ' is-collapsed' : ''}`}>
        <div className="krik-sidebar-brand">
          <div className="krik-sidebar-logo">K</div>
          {!collapsed ? <span className="krik-brand-name">Krik demo</span> : null}
          <button
            type="button"
            className="krik-collapse-btn"
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="krik-menu">
          {!collapsed ? <div className="krik-nav-section-label">Menu</div> : null}
          <NavLink
            to="/app"
            end
            title="Tổng quan"
            className={({ isActive }) => `krik-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="krik-nav-dot" />
            <IcHome />
            <span className="krik-nav-label">Tổng quan</span>
          </NavLink>
          <NavLink
            to="/app/stores"
            title="Cửa hàng"
            className={({ isActive }) => `krik-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="krik-nav-dot" />
            <IcStore />
            <span className="krik-nav-label">Cửa hàng</span>
          </NavLink>
          {!collapsed ? (
            <div className="krik-nav-section-label" style={{ marginTop: 8 }}>
              Công &amp; KPI NV
            </div>
          ) : null}
          <NavLink
            to="/app/staff-shift-kpi/daily"
            title="Bảng công ngày"
            className={({ isActive }) => `krik-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="krik-nav-dot" />
            <IcCalendar />
            <span className="krik-nav-label">Bảng công (ngày)</span>
          </NavLink>
          <NavLink
            to="/app/staff-shift-kpi/monthly"
            title="Tổng quan tháng"
            className={({ isActive }) => `krik-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="krik-nav-dot" />
            <IcChart />
            <span className="krik-nav-label">Tổng quan tháng</span>
          </NavLink>
          {isAdmin ? (
            <NavLink
              to="/app/staff-shift-kpi/kpi-config"
              title="Cấu hình KPI"
              className={({ isActive }) => `krik-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="krik-nav-dot" />
              <IcSliders />
              <span className="krik-nav-label">Cấu hình KPI</span>
            </NavLink>
          ) : null}
          {canStaffMaster ? (
            <NavLink
              to="/app/staff-shift-kpi/staff"
              title="Danh sách NV"
              className={({ isActive }) => `krik-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="krik-nav-dot" />
              <IcUsers />
              <span className="krik-nav-label">Danh sách NV</span>
            </NavLink>
          ) : null}
          <NavLink
            to="/app/staff-shift-kpi/payroll"
            title="Bảng lương"
            className={({ isActive }) => `krik-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="krik-nav-dot" />
            <IcMoney />
            <span className="krik-nav-label">Bảng lương</span>
          </NavLink>
          {isAdmin ? (
            <NavLink
              to="/app/admin"
              title="Admin / Users"
              className={({ isActive }) => `krik-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="krik-nav-dot" />
              <IcShield />
              <span className="krik-nav-label">Admin / Users</span>
            </NavLink>
          ) : null}
        </nav>
        <div className="krik-menu-footer">
          {!collapsed ? (
            <div className="krik-user-compact">
              <span className="name">{user?.fullName}</span>
              <span className="roles">{user?.roles.join(', ')}</span>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="krik-main">
        <header className="krik-main-header">
          <div className="krik-crumbs">
            <span className="app-name">Krik</span>
            <span className="sep">/</span>
            <span className="module">{meta.module}</span>
            <span className="sep">/</span>
            <h1 className="page-title">{meta.title}</h1>
          </div>
          <div className="krik-header-actions">
            <div className="krik-user-menu-wrap" ref={menuRef}>
              <button
                type="button"
                className="krik-user-pill"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
              >
                <span className="krik-user-avatar">{user?.fullName ? initials(user.fullName) : '?'}</span>
                <span>{user?.fullName}</span>
                <span aria-hidden style={{ opacity: 0.85, fontSize: 10 }}>
                  ▾
                </span>
              </button>
              {menuOpen ? (
                <div className="krik-user-dropdown">
                  <div className="head">{user?.fullName}</div>
                  <div className="email">{user?.email}</div>
                  <button
                    type="button"
                    className="krik-dropdown-item"
                    onClick={() => {
                      closeMenu()
                      logout()
                      navigate('/login', { replace: true })
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="krik-main-body">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
