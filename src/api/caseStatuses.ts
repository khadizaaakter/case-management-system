import { api, downloadFile, unwrapList } from './client'
import type { CaseStatus } from './types'

export interface CaseStatusPayload {
  name: string
  is_active?: boolean
}

export async function listCaseStatuses(): Promise<CaseStatus[]> {
  const res = await api('/case_statuses')
  return unwrapList<CaseStatus>(res, 'case_statuses', 'case_status')
}

export async function showCaseStatus(id: number): Promise<CaseStatus | null> {
  const res = (await api(`/case_statuses/${id}`)) as Record<string, unknown>
  return (res.result ?? res.case_status ?? res.data ?? null) as CaseStatus | null
}

export function createCaseStatus(payload: CaseStatusPayload) {
  return api<{ status?: string; message?: string; case_status?: CaseStatus }>('/case_statuses', {
    method: 'POST',
    body: payload,
  })
}

export function updateCaseStatus(id: number, payload: CaseStatusPayload) {
  return api<{ status?: string; message?: string; case_status?: CaseStatus }>(`/case_statuses/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export function deleteCaseStatus(id: number) {
  return api<{ status?: string; message?: string }>(`/case_statuses/${id}`, { method: 'DELETE' })
}

/** GET /case_statuses/export — downloads the case status list as .xlsx. */
export function exportCaseStatuses() {
  return downloadFile('/case_statuses/export', `case-statuses-${new Date().toISOString().split('T')[0]}.xlsx`)
}
