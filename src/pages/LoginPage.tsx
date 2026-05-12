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
        <h1>Krik</h1>
        <p>Đăng nhập để sử dụng ứng dụng quản lý cửa hàng. API chạy cổng 5207, giao diện cổng 5173.</p>
      </div>
      <div className="krik-login-panel">
        <div className="krik-login-card">
          <h2>Đăng nhập</h2>
          <p className="krik-login-sub">Danh sách tài khoản thử và dữ liệu mẫu: xem file HUONG_DAN_TEST.md trong mã nguồn API (thư mục bekrik).</p>
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
        </div>
      </div>
    </div>
  )
}
