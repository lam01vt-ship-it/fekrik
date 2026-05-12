import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login, token, ready } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const [email, setEmail] = useState('admin@krik.local')
  const [password, setPassword] = useState('Admin123!')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (ready && token) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch {
      setError('Sai email hoặc mật khẩu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="krik-login-page">
      <div className="krik-login-hero">
        <div className="krik-login-hero-inner">
          <div className="krik-login-logo" aria-hidden>K</div>
          <h1>Krik</h1>
          <p className="krik-login-tagline">Hệ thống quản lý KPI &amp; bảng công nhân viên cửa hàng</p>
        </div>
      </div>
      <div className="krik-login-panel">
        <div className="krik-login-card">
          <h2>Đăng nhập</h2>
          <p className="krik-login-sub">Dùng tài khoản được cấp để truy cập hệ thống.</p>
          <form onSubmit={onSubmit}>
            <label className="krik-field">
              Email
              <input
                className="krik-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="vidu@krik.local"
              />
            </label>
            <label className="krik-field">
              Mật khẩu
              <span className="krik-password-wrap">
                <input
                  className="krik-input krik-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Mật khẩu"
                />
                <button
                  type="button"
                  className="krik-password-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={-1}
                >
                  {showPassword ? <IcEyeOff /> : <IcEye />}
                </button>
              </span>
            </label>
            {error ? <p className="krik-alert">{error}</p> : null}
            <button type="submit" className="krik-btn krik-btn--primary krik-login-submit" disabled={busy}>
              {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function IcEye() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IcEyeOff() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.06 10.06 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 4.06-4.94" />
      <path d="M9.9 4.24A9.94 9.94 0 0 1 12 4c6.5 0 10 7 10 7a18.45 18.45 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <path d="M2 2l20 20" />
    </svg>
  )
}
