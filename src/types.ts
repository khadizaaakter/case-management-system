export type CaseStatus =
  | 'Notice Period Active'
  | 'Pending Hearing'
  | 'Settled'
  | 'Withdrawn'
  | 'Under Litigation'
  | string

export interface Case {
  id: number
  serialNo: number
  customerCode: string
  depot: string
  business: string
  chequeReceivedBy: string
  chequeAmount: number
  chequeReceivedDate: string
  legalNoticeDate: string
  recoveryDuringNotice: number
  deadlineCaseFiling: string
  caseFiled: 'Yes' | 'No'
  presentStatus: CaseStatus
  presentDues: number
  totalRecovered: number
  nextHearingDate?: string
  remarks?: string
  createdDate: string
  createdBy: string
  // Filing details (optional)
  accusedName?: string
  petitioner?: string
  lawyer?: string
  caseNumber?: string
  section?: string
  caseFilingDate?: string
  court?: string
  duesAtFiling?: number
  previousHearingDate?: string
  // Financial tracking (SDMS-fetched / calculated)
  duesAtMay?: number
  duesAtJune?: number
  recoveredInPeriod?: number
  // Hearing & contact (optional)
  legalNoticeServedDate?: string
  contact?: string
  guarantor?: string
}

export interface MasterData {
  depots: string[]
  businesses: string[]
  lawyers: string[]
  courts: string[]
  statuses: string[]
  users: string[]
}

export interface AuditEntry {
  timestamp: string
  action: string
  field: string
  details: string
  user: string
}

export type MasterKey = keyof MasterData

export interface AppData {
  cases: Case[]
  masterData: MasterData
  auditLog: AuditEntry[]
}
