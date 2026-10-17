import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, AuditEntry, Case, MasterData, MasterKey } from './types'
import { initialData, STORAGE_KEY } from './data'

interface StoreValue {
  cases: Case[]
  masterData: MasterData
  auditLog: AuditEntry[]
  addCase: (c: Omit<Case, 'id' | 'serialNo' | 'createdDate' | 'createdBy'>) => Case
  updateCase: (id: number, patch: Partial<Case>) => void
  addMaster: (key: MasterKey, value: string) => boolean
  removeMaster: (key: MasterKey, value: string) => void
  log: (action: string, field: string, details: string, user?: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>
      const base = initialData()
      return {
        cases: parsed.cases ?? base.cases,
        masterData: parsed.masterData ?? base.masterData,
        auditLog: parsed.auditLog ?? base.auditLog,
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return initialData()
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const log = useCallback(
    (action: string, field: string, details: string, user = 'Current User') => {
      setData((d) => ({
        ...d,
        auditLog: [
          ...d.auditLog,
          { timestamp: new Date().toISOString(), action, field, details, user },
        ],
      }))
    },
    [],
  )

  const addCase = useCallback<StoreValue['addCase']>((input) => {
    let created!: Case
    setData((d) => {
      const id = Math.max(0, ...d.cases.map((c) => c.id)) + 1
      created = {
        ...input,
        id,
        serialNo: d.cases.length + 1,
        createdDate: new Date().toISOString().split('T')[0],
        createdBy: 'Current User',
      }
      return {
        ...d,
        cases: [...d.cases, created],
        auditLog: [
          ...d.auditLog,
          {
            timestamp: new Date().toISOString(),
            action: 'CREATE',
            field: 'New Case',
            details: `Case ${created.serialNo} created for customer ${created.customerCode}`,
            user: 'Current User',
          },
        ],
      }
    })
    return created
  }, [])

  const updateCase = useCallback<StoreValue['updateCase']>((id, patch) => {
    setData((d) => ({
      ...d,
      cases: d.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      auditLog: [
        ...d.auditLog,
        {
          timestamp: new Date().toISOString(),
          action: 'UPDATE',
          field: 'Case Updated',
          details: `Case #${id} updated`,
          user: 'Current User',
        },
      ],
    }))
  }, [])

  const addMaster = useCallback<StoreValue['addMaster']>((key, value) => {
    const v = value.trim()
    if (!v) return false
    let ok = false
    setData((d) => {
      if (d.masterData[key].includes(v)) return d
      ok = true
      return {
        ...d,
        masterData: { ...d.masterData, [key]: [...d.masterData[key], v] },
        auditLog: [
          ...d.auditLog,
          {
            timestamp: new Date().toISOString(),
            action: 'CREATE',
            field: key.toUpperCase(),
            details: `New ${key} added: ${v}`,
            user: 'Current User',
          },
        ],
      }
    })
    return ok
  }, [])

  const removeMaster = useCallback<StoreValue['removeMaster']>((key, value) => {
    setData((d) => ({
      ...d,
      masterData: {
        ...d.masterData,
        [key]: d.masterData[key].filter((item) => item !== value),
      },
      auditLog: [
        ...d.auditLog,
        {
          timestamp: new Date().toISOString(),
          action: 'DELETE',
          field: key.toUpperCase(),
          details: `${key} removed: ${value}`,
          user: 'Current User',
        },
      ],
    }))
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      cases: data.cases,
      masterData: data.masterData,
      auditLog: data.auditLog,
      addCase,
      updateCase,
      addMaster,
      removeMaster,
      log,
    }),
    [data, addCase, updateCase, addMaster, removeMaster, log],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
