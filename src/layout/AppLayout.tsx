import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function pageMeta(pathname: string): { module: string; title: string } {
  const p = pathname.replace(/\/$/, '') || '/app'
  if (p === '/app') return { module: 'Trang chủ', title: 'Tổng quan' }
  if (p.endsWith('/stores')) return { module: 'Vận hành', title: 'Cửa hàng' }
  if (p.endsWith('/admin')) return { module: 'Quản trị', title: 'Người dùng' }
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
