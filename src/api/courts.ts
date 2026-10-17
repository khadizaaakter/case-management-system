import { api, downloadFile } from './client'
import type { courts } from './types'

export interface CourtPayload {
  name: string
  location?: string
  is_active?: boolean
}

export async function listCourts(): Promise<courts[]> {
    const res = await api<{ courts: courts[]}>('/courts')
    return res.courts
}

export async function showCourt(id: number): Promise<courts | null> {
  const res = (await api(`/courts/${id}`)) as Record<string, unknown>
  return (res.result ?? res.court ?? res.data ?? null) as courts | null
}

export function createCourt(payload: CourtPayload) {
  return api<{ status?: string; message?: string; court?: courts }>('/courts', {
    method: 'POST',
    body: payload,
  })
}

export function updateCourt(id: number, payload: CourtPayload) {
  return api<{ status?: string; message?: string; court?: courts }>(`/courts/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export function deleteCourt(id: number) {
  return api<{ status?: string; message?: string }>(`/courts/${id}`, { method: 'DELETE' })
}

/** GET /courts/export — downloads the court list as .xlsx. */
export function exportCourts() {
  return downloadFile('/courts/export', `courts-${new Date().toISOString().split('T')[0]}.xlsx`)
}