import { api } from './client'
import type { listCasesTypes } from './types'

/** POST /cases payload — matches the backend's raw field names directly. */
export interface CreateCasePayload {
  /** SDMS business code (e.g. "3", "H") — backend also accepts the legacy numeric business id. */
  business_id: string
  customer_code: string
  /** SDMS depot code (e.g. "GA") — backend also accepts the legacy numeric depot id. */
  depot_id: string
  accused_name: string
  accused_address: string
  petitioner_name: string
  lawyer_name: string
  case_number: string
  section: string
  court_id: number
  is_case_filed: boolean
  case_filing_date: string
  cheque_amount: number
  remarks: string
  dues_at_filing: number
  dues_at_25th_previous_month: number
  dues_at_25th_current_month: number
  status_id: number
  previous_hearing_date: string | null
  next_hearing_date: string | null
  legal_notice_served_date: string | null
  contact_phone: string
  contact_email: string
  guarantor_name: string
}

export function createCase(payload: CreateCasePayload) {
  return api<{ status?: string; message?: string }>('/cases', {
    method: 'POST',
    body: payload,
  })
}


export interface ListCasesParams {
  search?: string
  status_id?: number | string
  depot_id?: number | string
  per_page?: number
  page?: number
  [key: string]: string | number | boolean | null | undefined
}

interface PageMeta {
  total?: number
  last_page?: number
  current_page?: number
}

/** A Laravel paginator nests rows under `data` with the meta alongside. */
type CasesField = listCasesTypes[] | ({ data: listCasesTypes[] } & PageMeta)

interface ListCasesResponse extends PageMeta {
  cases: CasesField
  pagination?: PageMeta
  meta?: PageMeta
}

export interface CasesPage {
  cases: listCasesTypes[]
  /** Only known when the backend reports pagination metadata. */
  total?: number
  lastPage?: number
}

export async function ListCasesPage(params: ListCasesParams = {}): Promise<CasesPage> {
  const res = await api<ListCasesResponse>('/cases', {
    method: 'GET',
    params,
  })
  const nested = Array.isArray(res.cases) ? undefined : res.cases
  const meta: PageMeta = nested ?? res.pagination ?? res.meta ?? res
  return {
    cases: nested ? nested.data : (res.cases as listCasesTypes[]),
    total: meta.total,
    lastPage: meta.last_page,
  }
}

export async function ListCases(params: ListCasesParams = {}) {
  return (await ListCasesPage(params)).cases
}

export interface UpdateCasesPayload {
  status_id: string;
  next_hearing_date: string | null;
  judgement_date: string | null;
  judgement_details: string;
}

export async function UpdateCase(id: number, payload: UpdateCasesPayload) {
  const res = await api<{ status?: string; message?: string }>(`/cases/${id}`, {
    method: 'PUT',
    body: payload,
  })
  return res
}