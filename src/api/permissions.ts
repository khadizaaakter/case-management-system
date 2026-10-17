import { api, unwrapList } from './client'
import type { Permission, PermissionGroups } from './types'

/** Administrator › Permission endpoints (Postman collection). */

export interface PermissionListResult {
  permissions: Permission[]
  permission_groups?: PermissionGroups
}

/**
 * Permission names use `module.action` — lowercase, the part before the first
 * dot becomes the group, spaces inside the action become underscores.
 * e.g. "case.approve final" → "case.approve_final"
 */
export function normalizePermissionName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_')
}

export async function listPermissions(): Promise<PermissionListResult> {
  const res = (await api('/permissions')) as Record<string, unknown>
  return {
    permissions: unwrapList<Permission>(res, 'permissions', 'permission'),
    permission_groups: (res.permission_groups ?? undefined) as PermissionGroups | undefined,
  }
}

export function createPermission(name: string) {
  return api<{ status?: string; message?: string; permission?: Permission }>('/permissions', {
    method: 'POST',
    body: { name: normalizePermissionName(name) },
  })
}

export async function showPermission(id: number): Promise<Permission | null> {
  const res = (await api(`/permissions/${id}`)) as Record<string, unknown>
  return (res.permission ?? res.data ?? null) as Permission | null
}

export function getPermissionEdit(id: number) {
  return api<Record<string, unknown>>(`/permissions/${id}/edit`)
}

export function updatePermission(id: number, name: string) {
  return api<{ status?: string; message?: string; permission?: Permission }>(
    `/permissions/${id}`,
    { method: 'PUT', body: { name: normalizePermissionName(name) } },
  )
}

/** DELETE /permissions/:id — 409 if the permission is attached to a role. */
export function deletePermission(id: number) {
  return api<{ status?: string; message?: string }>(`/permissions/${id}`, { method: 'DELETE' })
}
