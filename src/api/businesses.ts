import { api } from './client'
import type { Business } from './types'

/** Businesses endpoint. */

export async function listBusinesses(): Promise<Business[]> {
  const res = await api<{ businesses: Business[] }>('/businesses')
  return res.businesses
}
