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
        <h1>Krik demo</h1>
        <p>
          Giao diện theo theme Fisa: xanh dương, sidebar và bảng dữ liệu thống nhất. Chạy API (port
          5207) và FE (port 5173) song song.
        </p>
      </div>
      <div className="krik-login-panel">
        <div className="krik-login-card">
          <h2>Đăng nhập</h2>
          <p className="krik-login-sub">Nhập tài khoản seed hoặc user của bạn.</p>
          <form onSubmit={onSubmit}>
            <label className="krik-field">
              Email
              <input
                className="krik-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label className="krik-field">
              Mật khẩu
              <input
                className="krik-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            {error ? <p className="krik-alert">{error}</p> : null}
            <button type="submit" className="krik-btn krik-btn--primary" disabled={busy}>
              {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
          <div className="krik-login-hint">
            <strong>Tài khoản seed</strong> (mật khẩu: <code>Admin123!</code>):
            <ul>
              <li>
                <code>admin@krik.local</code> — AdminHR
              </li>
              <li>
                <code>area@krik.local</code> — AreaManager
              </li>
              <li>
                <code>store@krik.local</code> — StoreManager
              </li>
              <li>
                <code>sales@krik.local</code> — SalesStaff
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
