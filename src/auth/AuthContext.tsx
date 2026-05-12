import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserSummary } from '../types/api'
import * as krikApi from '../api/krikApi'

type AuthState = {
  user: UserSummary | null
  token: string | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const STORAGE_KEY = 'krik_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [user, setUser] = useState<UserSummary | null>(null)
  const [ready, setReady] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setUser(null)
      return
    }
    const me = await krikApi.fetchMe()
    setUser(me)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!token) {
        setReady(true)
        return
      }
      try {
        const me = await krikApi.fetchMe()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await krikApi.login(email, password)
    localStorage.setItem(STORAGE_KEY, res.accessToken)
    setToken(res.accessToken)
    setUser(res.user)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      logout,
      refreshMe,
    }),
    [user, token, ready, login, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
