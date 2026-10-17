import { api, downloadFile, unwrapList } from './client'
import type { Lawyer } from './types'

export interface LawyerPayload {
  name: string
  phone?: string
  email?: string
  is_active?: boolean
}

export async function listLawyers(): Promise<Lawyer[]> {
  const res = await api('/lawyers')
  return unwrapList<Lawyer>(res, 'lawyers', 'lawyer')
}

export async function showLawyer(id: number): Promise<Lawyer | null> {
  const res = (await api(`/lawyers/${id}`)) as Record<string, unknown>
  return (res.result ?? res.lawyer ?? res.data ?? null) as Lawyer | null
}

export function createLawyer(payload: LawyerPayload) {
  return api<{ status?: string; message?: string; lawyer?: Lawyer }>('/lawyers', {
    method: 'POST',
    body: payload,
  })
}

export function updateLawyer(id: number, payload: LawyerPayload) {
  return api<{ status?: string; message?: string; lawyer?: Lawyer }>(`/lawyers/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export function deleteLawyer(id: number) {
  return api<{ status?: string; message?: string }>(`/lawyers/${id}`, { method: 'DELETE' })
}

/** GET /lawyers/export — downloads the lawyer list as .xlsx. */
export function exportLawyers() {
  return downloadFile('/lawyers/export', `lawyers-${new Date().toISOString().split('T')[0]}.xlsx`)
}
