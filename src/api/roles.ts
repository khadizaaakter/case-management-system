import { api, unwrapList } from './client'
import type { Permission, PermissionGroups, Role } from './types'

/** Administrator › Role endpoints (Postman collection). */

export interface RolePayload {
  name: string
  /** Permission NAMES (optional on the API, required by our UI). */
  permission: string[]
}

export interface RoleFormData {
  permissions: Permission[]
  permission_groups?: PermissionGroups
}

export async function listRoles(): Promise<Role[]> {
  const res = await api('/roles')
  return unwrapList<Role>(res, 'roles', 'role')
}

/** GET /roles/create — permissions for the role form checkboxes. */
export async function getRoleFormData(): Promise<RoleFormData> {
  const res = (await api('/roles/create')) as Record<string, unknown>
  return {
    permissions: unwrapList<Permission>(res, 'permissions', 'permission'),
    permission_groups: (res.permission_groups ?? undefined) as PermissionGroups | undefined,
  }
}

export function createRole(payload: RolePayload) {
  return api<{ status?: string; message?: string; role?: Role }>('/roles', {
    method: 'POST',
    body: payload,
  })
}

export async function showRole(id: number): Promise<Role | null> {
  const res = (await api(`/roles/${id}`)) as Record<string, unknown>
  return (res.role ?? res.data ?? null) as Role | null
}

/** GET /roles/:id/edit — role + its permissions for the edit form. */
export function getRoleEdit(id: number) {
  return api<Record<string, unknown>>(`/roles/${id}/edit`)
}

export function updateRole(id: number, payload: RolePayload) {
  return api<{ status?: string; message?: string; role?: Role }>(`/roles/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

/** DELETE /roles/:id — 409 if the role is still assigned to users. */
export function deleteRole(id: number) {
  return api<{ status?: string; message?: string }>(`/roles/${id}`, { method: 'DELETE' })
}
