import { useCallback, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { ApiError, tokenStorage, userStorage } from '../api/client'
import type { AuthUser } from '../api/types'
import { AuthContext } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => userStorage.get<AuthUser>())
  const [hasToken, setHasToken] = useState(() => Boolean(tokenStorage.get()))

  const persistSession = useCallback(async (res: authApi.AuthResponse) => {
    if (!res.token) return null
    tokenStorage.set(res.token)
    setHasToken(true)

    let nextUser = res.user ?? null
    if (!nextUser) nextUser = await authApi.getLoggedUser().catch(() => null)
    if (nextUser) userStorage.set(nextUser)
    setUser(nextUser)
    return nextUser
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password })
      if (!res.token) {
        throw new ApiError(res.message ?? 'Invalid email or password', 401, res)
      }
      return persistSession(res)
    },
    [persistSession],
  )

  const register = useCallback(
    async (payload: authApi.RegisterPayload) => {
      const res = await authApi.register(payload)
      if (res.status && res.status.toLowerCase() !== 'success' && !res.token) {
        throw new ApiError(res.message ?? 'Registration failed', 422, res)
      }
      if (res.token) {
        await persistSession(res)
        return true
      }
      return false
    },
    [persistSession],
  )

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined) // revoke server-side, best effort
    tokenStorage.clear()
    setHasToken(false)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: hasToken, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
