import type { AppData, Case, MasterData } from './types'

export const DEFAULT_MASTER: MasterData = {
  depots: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal'],
  businesses: ['Animal Health', 'Finance', 'Trade', 'Manufacturing', 'Services'],
  lawyers: [
    'Md. Mahbubul Haque Bhuiyan',
    'Advocate Md. Golam Sorrower',
    'Advocate Md. Shahidullah',
    'Advocate Md. Karim',
  ],
  courts: [
    'CMM Court, Dhaka',
    '1st Joint Metro Session Judge Court',
    'District Court, Chittagong',
    'High Court Division',
  ],
  statuses: [
    'Notice Period Active',
    'Pending Hearing',
    'Settled',
    'Withdrawn',
    'Under Litigation',
  ],
  users: ['Md. Islam', 'Fatima Begum', 'Ahmed Hassan', 'Sana Khan'],
}

export const SAMPLE_CASES: Case[] = [
  {
    id: 1,
    serialNo: 1,
    customerCode: 'AH091Y',
    depot: 'Dhaka',
    business: 'Animal Health',
    chequeReceivedBy: 'Md. Islam',
    chequeAmount: 100000,
    chequeReceivedDate: '2024-01-15',
    legalNoticeDate: '2024-02-15',
    recoveryDuringNotice: 0,
    deadlineCaseFiling: '2024-04-15',
    caseFiled: 'No',
    presentStatus: 'Withdrawn',
    presentDues: 100000,
    totalRecovered: 0,
    nextHearingDate: '',
    remarks: 'Case withdrawn',
    createdDate: '2024-01-15',
    createdBy: 'Md. Islam',
  },
  {
    id: 2,
    serialNo: 2,
    customerCode: 'C001',
    depot: 'Chittagong',
    business: 'Finance',
    chequeReceivedBy: 'Fatima Begum',
    chequeAmount: 250000,
    chequeReceivedDate: '2024-06-01',
    legalNoticeDate: '2024-06-15',
    recoveryDuringNotice: 50000,
    deadlineCaseFiling: '2024-08-14',
    caseFiled: 'Yes',
    accusedName: 'Khandoker Rakibul Islam',
    lawyer: 'Md. Mahbubul Haque Bhuiyan',
    caseNumber: 'C.R. Case No. 1002/2024',
    caseFilingDate: '2024-08-10',
    court: 'CMM Court, Dhaka',
    presentStatus: 'Under Litigation',
    duesAtFiling: 200000,
    presentDues: 150000,
    totalRecovered: 100000,
    nextHearingDate: '2024-10-15',
    remarks: 'Case filed and under litigation',
    createdDate: '2024-06-01',
    createdBy: 'Fatima Begum',
  },
  {
    id: 3,
    serialNo: 3,
    customerCode: 'F002',
    depot: 'Sylhet',
    business: 'Trade',
    chequeReceivedBy: 'Ahmed Hassan',
    chequeAmount: 500000,
    chequeReceivedDate: '2024-03-10',
    legalNoticeDate: '2024-03-25',
    recoveryDuringNotice: 500000,
    deadlineCaseFiling: '2024-05-24',
    caseFiled: 'No',
    presentStatus: 'Settled',
    presentDues: 0,
    totalRecovered: 500000,
    remarks: 'Full amount recovered',
    createdDate: '2024-03-10',
    createdBy: 'Ahmed Hassan',
  },
]

/** Aggregate figures shown on the dashboard when no live cases exist. */
export const STATIC_STATS = {
  totalCases: 4095,
  uniqueCustomers: 3639,
  uniqueCourts: 464,
  casesFiled: 4007,
  totalChequeAmount: 4477089672,
  totalDuesAtFiling: 2791066365,
  totalRecoveredAmount: 1084301866,
  totalPresentDues: 1707854223,
}

export const STORAGE_KEY = 'cmsData'

export function initialData(): AppData {
  return {
    cases: SAMPLE_CASES,
    masterData: DEFAULT_MASTER,
    auditLog: SAMPLE_CASES.map((c) => ({
      timestamp: new Date().toISOString(),
      action: 'CREATE',
      field: 'Case Created',
      details: `New case ${c.serialNo} added to system`,
      user: c.createdBy,
    })),
  }
}
