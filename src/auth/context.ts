import { createContext } from 'react'
import type { RegisterPayload } from '../api/auth'
import type { AuthUser } from '../api/types'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser | null>
  /** Returns true when the API also issued a token (auto-login). */
  register: (payload: RegisterPayload) => Promise<boolean>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
