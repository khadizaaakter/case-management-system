/** Shared API entity types for the Administrator module (Spatie roles/permissions). */

export interface Permission {
  id: number
  name: string
  guard_name?: string
}

/** Permissions bucketed by module — `case.approve` lands in group `case`. */
export type PermissionGroups = Record<string, Permission[]>

export interface Role {
  id: number
  name: string
  guard_name?: string
  permissions?: Permission[]
  users_count?: number
}

export interface AdminUser {
  id: number
  name: string
  email: string
  status?: boolean | number | string
  roles?: Role[]
  /** Direct permissions assigned on top of roles. */
  permissions?: Permission[]
  /** Roles + direct permissions combined (when the API provides it). */
  all_permissions?: Permission[]
}

export interface AuthUser {
  id: number
  name: string
  email: string
  status?: boolean | number | string
  roles?: Role[]
  permissions?: Permission[]
  all_permissions?: Permission[]
}

/** True when a user status flag means "active" (API may send 1/0 or true/false). */
export function isActive(status: AdminUser['status']): boolean {
  return status === true || status === 1 || status === '1' || status === undefined
}

/** Normalise roles/permissions that may arrive as strings or objects into names. */
export function toNames(items: unknown): string[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) =>
      typeof item === 'string'
        ? item
        : ((item as { name?: string } | null)?.name ?? ''),
    )
    .filter(Boolean)
}

/** All permission names a user effectively has (all_permissions, else roles + direct). */
export function userPermissionNames(user: AdminUser): string[] {
  if (user.all_permissions?.length) return toNames(user.all_permissions)
  const fromRoles = (user.roles ?? []).flatMap((role) => toNames(role.permissions))
  const direct = toNames(user.permissions)
  return [...new Set([...fromRoles, ...direct])]
}


export interface Business {
  id: number
  name : string
  is_active : boolean
  created_at : string
  updated_at : string
}
export interface depots {
  id: number
  name : string
  code : string
  is_active : boolean
  created_at : string
  updated_at : string
}


export interface SdmsBusiness {
  business: string
  business_name: string
}


export interface SdmsDepot {
  depot_code: string
  depot_name: string
  short_name: string | null
  zone_code: string | null
  address1: string | null
  address2: string | null
  is_active: boolean
  serial_no: number
  sync_data: boolean
  stop_vat_after_discount: boolean
}


export interface SdmsCustomer {
  customer_code: string
  customer_name: string
  contact_person: string | null
  address1: string | null
  address2: string | null
  phone: string | null
  mobile: string | null
  email: string | null
  business: string | null
  depot_code: string
  customer_type: string
}


export interface SdmsCustomerDue {
  level1: string
  customer_code: string
  customer_name: string
  depot_code: string
  depot_name: string
  mobile: string | null
  is_active: boolean
  credit_limit: number
  credit_days: number
  total_due: number
  over_due: number
  actual_over_due: number
  out_120: number
  age_days: number
  last_invoice_amount: number | null
  last_payment_amount: number | null
}

export interface SdmsCustomerDuesSnapshot {
  date: string
  dues: SdmsCustomerDue[]
  totals: {
    total_due: number
    over_due: number
    actual_over_due: number
    out_120: number
  }
}

export interface SdmsFinancialTrackingResponse {
  previous_month: SdmsCustomerDuesSnapshot
  two_months_ago: SdmsCustomerDuesSnapshot
  message: string
  status: string
}


export interface CaseStatus {
  id: number
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}


export interface Lawyer {
  id: number
  name: string
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}


export interface courts {
  id: number
  name : string
  location  : string
  is_active : boolean
  created_at : string
  updated_at : string
}


export interface listCasesTypes {
  id: number;
  case_number: string;
  section: string;
  business_id: string;
  business_name: string;
  customer_code_id: string;
  customer_code: string;
  customer_name: string | null;
  depot_id: string;
  depot_name: string;
  court_id: string;
  court_name: string;
  lawyer_id: string;
  lawyer_name: string;
  accused_name: string;
  accused_address: string;
  petitioner_name: string;
  is_case_filed: boolean;
  case_filing_date: string;
  cheque_amount: number;
  remarks: string;
  judgement_details: string | null;
  judgement_date: string | null;
  dues_at_filing: number;
  dues_at_25th_previous_month: number;
  dues_at_25th_current_month: number;
  recovered_notice_to_date: number;
  total_recovered_amount: number;
  present_dues: number;
  sdms_last_synced_at: string;
  status_id: string;
  status_name: string;
  previous_hearing_date: string;
  next_hearing_date: string;
  legal_notice_served_date: string;
  contact_phone: string;
  contact_email: string;
  guarantor_name: string;
  created_at: string;
  updated_at: string;
}

