import { api } from './client'
import type { AuthUser } from './types'

/** Auth endpoints — Postman: Auth › Login / Register / Logged User / Change Password / Logout */

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  roles?: string[]
}

export interface AuthResponse {
  status?: string
  message?: string
  token?: string
  user?: AuthUser
}

export function login(payload: LoginPayload) {
  return api<AuthResponse>('/login', { method: 'POST', body: payload, anonymous: true })
}

export function register(payload: RegisterPayload) {
  return api<AuthResponse>('/register', { method: 'POST', body: payload, anonymous: true })
}

export async function getLoggedUser(): Promise<AuthUser | null> {
  const res = await api<Record<string, unknown>>('/loggeduser')
  return (res.user ?? res.users ?? res.data ?? null) as AuthUser | null
}

export function changePassword(password: string) {
  return api<AuthResponse>('/changepassword', { method: 'POST', body: { password } })
}

export function logout() {
  return api<AuthResponse>('/logout', { method: 'POST' })
}
