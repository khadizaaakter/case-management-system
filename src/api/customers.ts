import { api } from './client'
import type { SdmsBusiness, SdmsCustomer, SdmsDepot, SdmsFinancialTrackingResponse } from './types'

/** Live business list from SDMS (used to drive the Create Case business dropdown). */
export async function listSdmsBusinesses(): Promise<SdmsBusiness[]> {
  const res = await api<{ businesses: SdmsBusiness[] }>('/sdms/businesses')
  return res.businesses ?? []
}

/** Live depot list from SDMS (used to drive the Create Case depot + customer dropdowns). */
export async function listSdmsDepots(): Promise<SdmsDepot[]> {
  const res = await api<{ depots: SdmsDepot[] }>('/sdms/depots')
  return res.depots ?? []
}

/** Customers for a depot, pulled live from SDMS (used for the customer-code dropdown). */
export async function listCustomersByDepot(depotCode: string, search?: string): Promise<SdmsCustomer[]> {
  if (!depotCode) return []
  const res = await api<{ customers: SdmsCustomer[] }>('/sdms/customers', {
    params: { depot_code: depotCode, per_page: 10, search: search || undefined },
  })
  return res.customers ?? []
}

/** Financial tracking (previous month + two-months-ago dues) for a business/depot/customer. */
export async function getFinancialTracking(params: {
  business: string
  depot: string
  customer_code: string
}): Promise<SdmsFinancialTrackingResponse> {
  return api<SdmsFinancialTrackingResponse>('/financial_tracking', { params })
}
