import { api, unwrapList } from './client'
import type { AdminUser, Permission, PermissionGroups, Role } from './types'

/** Administrator › User endpoints (Postman collection). */

export type UserListParams = {
  search?: string
  role?: string
  status?: string | number
}

export interface UserPayload {
  name: string
  email: string
  /** Required on create; optional on update — send only to change it. */
  password?: string
  status: boolean
  /** Role NAMES. */
  roles: string[]
  /** Optional direct permission NAMES on top of the role. */
  permissions?: string[]
}

export interface UserFormData {
  roles: Role[]
  permissions: Permission[]
  permission_groups?: PermissionGroups
}

export async function listUsers(params?: UserListParams): Promise<AdminUser[]> {
  const res = await api('/users', { params })
  return unwrapList<AdminUser>(res, 'users')
}

/** GET /users/form_data — roles + permissions for the user form. */
export async function getUserFormData(): Promise<UserFormData> {
  const res = (await api('/users/form_data')) as Record<string, unknown>
  return {
    roles: unwrapList<Role>(res.roles ?? res, 'roles'),
    permissions: unwrapList<Permission>(res.permissions ?? [], 'permissions'),
    permission_groups: (res.permission_groups ?? undefined) as PermissionGroups | undefined,
  }
}

export function createUser(payload: UserPayload) {
  return api<{ status?: string; message?: string; user?: AdminUser }>('/users', {
    method: 'POST',
    body: payload,
  })
}

export async function showUser(id: number): Promise<AdminUser | null> {
  const res = (await api(`/users/${id}`)) as Record<string, unknown>
  return (res.user ?? res.data ?? null) as AdminUser | null
}

export function updateUser(id: number, payload: UserPayload) {
  return api<{ status?: string; message?: string; user?: AdminUser }>(`/users/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

/** PUT /users/:id/toggle_status — 409 if you target your own account. */
export function toggleUserStatus(id: number) {
  return api<{ status?: string; message?: string; user?: AdminUser }>(
    `/users/${id}/toggle_status`,
    { method: 'PUT' },
  )
}

/** DELETE /users/:id — 409 if you target your own account. */
export function deleteUser(id: number) {
  return api<{ status?: string; message?: string }>(`/users/${id}`, { method: 'DELETE' })
}
