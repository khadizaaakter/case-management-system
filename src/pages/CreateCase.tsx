import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Upload } from 'lucide-react'
import { useStore } from '../store'
import { useToast } from '../toast'
import BulkImportModal from '../components/BulkImportModal'
import type {
  CaseStatus,
  courts,
  Lawyer,
  SdmsBusiness,
  SdmsCustomer,
  SdmsDepot,
  SdmsFinancialTrackingResponse,
} from '../api/types'
import { getErrorMessage } from '../api/client'
import { listCourts } from '../api/courts'
import { listSdmsBusinesses, listSdmsDepots, listCustomersByDepot, getFinancialTracking } from '../api/customers'
import { listLawyers } from '../api/lawyers'
import { listCaseStatuses } from '../api/caseStatuses'
import { createCase, type CreateCasePayload } from '../api/cases'

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5${className ? ` ${className}` : ''}`}>
      <label className="field-label">{label}</label>
      {children}
      {hint && <span className="text-[11px] italic text-faint">{hint}</span>}
    </div>
  )
}

function Column({ index, title, subtitle, children }: { index: number; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5 border-b border-border pb-3">
        <h3 className="text-[15px] font-semibold text-accent">
          {index}. {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  )
}

/** Searchable customer-code combobox — types to search SDMS customers within the selected depot. */
function CustomerCodeCombobox({
  depotCode,
  value,
  selectedLabel,
  onChange,
}: {
  depotCode: string
  value: string
  selectedLabel?: string
  onChange: (code: string, label: string) => void
}) {
  const [query, setQuery] = useState(selectedLabel ?? value ?? '')
  const [results, setResults] = useState<SdmsCustomer[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const notify = useToast()

  // Keep the visible text in sync when the parent resets/preselects the value — adjust
  // state during render (React's documented pattern for "state depends on props") instead
  // of an effect, by tracking the last external (depotCode, value, selectedLabel) synced.
  const [synced, setSynced] = useState({ depotCode, value, selectedLabel })
  if (synced.depotCode !== depotCode || synced.value !== value || synced.selectedLabel !== selectedLabel) {
    setSynced({ depotCode, value, selectedLabel })
    setQuery(selectedLabel ?? value ?? '')
  }

  useEffect(() => {
    if (!open || !depotCode) return
    const handle = setTimeout(() => {
      setLoading(true)
      listCustomersByDepot(depotCode, query.trim())
        .then(setResults)
        .catch((err) => notify(getErrorMessage(err)))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [depotCode, query, open, notify])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          className="input pl-8"
          placeholder={depotCode ? 'Search name or code…' : 'Select depot first'}
          value={query}
          disabled={!depotCode}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange('', '')
            setOpen(true)
          }}
        />
        <input type="hidden" name="customer_code" value={value} />
      </div>
      {open && depotCode && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-[0_8px_24px_rgba(16,24,40,0.14)]">
          {loading ? (
            <div className="px-3 py-2 text-[12px] text-muted">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-muted">No customers found</div>
          ) : (
            results.map((c) => (
              <button
                type="button"
                key={c.customer_code}
                className="block w-full px-3 py-2 text-left text-[13px] hover:bg-bg"
                onClick={() => {
                  onChange(c.customer_code, `${c.customer_name} (${c.customer_code})`)
                  setQuery(`${c.customer_name} (${c.customer_code})`)
                  setOpen(false)
                }}
              >
                {c.customer_name} ({c.customer_code})
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function CreateCase() {
  const { cases } = useStore()
  const notify = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit') ? Number(params.get('edit')) : null
  const editing = useMemo(() => cases.find((c) => c.id === editId) ?? null, [cases, editId])
  const d = editing

  // businesses state (SDMS)
  const [bussinesses, setBusinesses] = useState<SdmsBusiness[]>([])
  const [bussinessLoading, setBussinessLoading] = useState(true)
  // `null` = user hasn't touched the select yet; falls back to the edit-mode default below.
  const [businessCodeOverride, setBusinessCodeOverride] = useState<string | null>(null)

  // depots state (SDMS — drives both the depot dropdown and the customer lookup)
  const [depots, setDepots] = useState<SdmsDepot[]>([])
  const [depotsLoading, setDepotsLoading] = useState(true)
  // courts state
  const [courts, setCourts] = useState<courts[]>([])
  const [courtsLoading, setCourtsLoading] = useState(true)

  // lawyers state
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [lawyersLoading, setLawyersLoading] = useState(true)

  // case statuses state
  const [statuses, setStatuses] = useState<CaseStatus[]>([])
  const [statusesLoading, setStatusesLoading] = useState(true)

  // customer-code combobox state (depends on selected depot)
  const [depotCodeOverride, setDepotCodeOverride] = useState<string | null>(null)
  const [customerCode, setCustomerCode] = useState(d?.customerCode ?? '')
  const [customerLabel, setCustomerLabel] = useState(d?.customerCode ?? '')

  // Default depot/business code when editing an existing case — derived, not effect-driven.
  const defaultDepotCode = useMemo(() => {
    if (!d) return ''
    return depots.find((dp) => dp.depot_name === d.depot || dp.depot_code === d.depot)?.depot_code ?? ''
  }, [d, depots])
  const defaultBusinessCode = useMemo(() => {
    if (!d) return ''
    return bussinesses.find((b) => b.business_name === d.business || b.business === d.business)?.business ?? ''
  }, [d, bussinesses])
  const depotCode = depotCodeOverride ?? defaultDepotCode
  const businessCode = businessCodeOverride ?? defaultBusinessCode

  // financial tracking (fetched live once business + depot + customer are all picked)
  const [tracking, setTracking] = useState<SdmsFinancialTrackingResponse | null>(null)
  const [duesAtFiling, setDuesAtFiling] = useState(d?.duesAtFiling?.toString() ?? '')


useEffect(() => {
  listSdmsBusinesses()
    .then(setBusinesses)
    .catch((err) => notify(getErrorMessage(err)))
    .finally(() => setBussinessLoading(false))

  listSdmsDepots()
    .then(setDepots)
    .catch((err) => notify(getErrorMessage(err)))
    .finally(() => setDepotsLoading(false))

  listCourts()
    .then(setCourts)
    .catch((err) => notify(getErrorMessage(err)))
    .finally(() => setCourtsLoading(false))

  listLawyers()
    .then(setLawyers)
    .catch((err) => notify(getErrorMessage(err)))
    .finally(() => setLawyersLoading(false))

  listCaseStatuses()
    .then(setStatuses)
    .catch((err) => notify(getErrorMessage(err)))
    .finally(() => setStatusesLoading(false))
}, [])

// Fetch financial tracking whenever business + depot + customer are all selected.
useEffect(() => {
  if (!businessCode || !depotCode || !customerCode) return
  let cancelled = false
  getFinancialTracking({ business: businessCode, depot: depotCode, customer_code: customerCode })
    .then((res) => {
      if (!cancelled) setTracking(res)
    })
    .catch((err) => notify(getErrorMessage(err)))
  return () => {
    cancelled = true
  }
}, [businessCode, depotCode, customerCode, notify])

// The last-fetched `tracking` becomes stale once any of its inputs change again — derive
// the effective value during render instead of resetting it from inside an effect.
const trackingKey = tracking ? `${businessCode}|${depotCode}|${customerCode}` : null
const fetchKey = businessCode && depotCode && customerCode ? `${businessCode}|${depotCode}|${customerCode}` : null
const effectiveTracking = trackingKey === fetchKey ? tracking : null

// Month labels come straight from the response's own snapshot dates, e.g. "July 2026" / "Aug 2026".
function monthLabel(dateStr: string | undefined, style: 'long' | 'short') {
  if (!dateStr) return ''
  const [y, m] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, 1).toLocaleString('en-US', { month: style, year: 'numeric' })
}
const previousMonthLabel = monthLabel(effectiveTracking?.two_months_ago.date, 'long')
const currentMonthLabel = monthLabel(effectiveTracking?.previous_month.date, 'short')

// API field names are relative to today: "previous_month" = last completed month, closer to today
// (maps to UI "current month" — the API has no true current-month snapshot yet), "two_months_ago" =
// the month before that (maps to UI "previous month").
const duesCurrentMonth = effectiveTracking?.previous_month.dues?.[0]?.total_due ?? 0
const duesPreviousMonth = effectiveTracking?.two_months_ago.dues?.[0]?.total_due ?? 0
const recoveredInPeriod = duesPreviousMonth - duesCurrentMonth
const totalRecovered = (Number(duesAtFiling) || 0) - duesCurrentMonth
const presentDues = duesCurrentMonth

function handleDepotChange(e: ChangeEvent<HTMLSelectElement>) {
  setDepotCodeOverride(e.target.value)
  setCustomerCode('')
  setCustomerLabel('')
}

function handleBusinessChange(e: ChangeEvent<HTMLSelectElement>) {
  setBusinessCodeOverride(e.target.value)
}

  const [submitting, setSubmitting] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string) || ''
    const num = (k: string) => Number(fd.get(k) || 0)
    const orNull = (k: string) => get(k) || null

    const payload: CreateCasePayload = {
      business_id: get('business_id'),
      customer_code: get('customer_code'),
      depot_id: get('depot_id'),
      accused_name: get('accused_name'),
      accused_address: get('accused_address'),
      petitioner_name: get('petitioner_name'),
      lawyer_name: get('lawyer_name'),
      case_number: get('case_number'),
      section: get('section'),
      court_id: num('court_id'),
      is_case_filed: Boolean(get('case_number') || get('court_id') || get('case_filing_date')),
      case_filing_date: get('case_filing_date'),
      cheque_amount: num('cheque_amount'),
      remarks: get('remarks'),
      dues_at_filing: num('dues_at_filing'),
      dues_at_25th_previous_month: num('dues_at_25th_previous_month'),
      dues_at_25th_current_month: num('dues_at_25th_current_month'),
      status_id: num('status_id'),
      previous_hearing_date: orNull('previous_hearing_date'),
      next_hearing_date: orNull('next_hearing_date'),
      legal_notice_served_date: orNull('legal_notice_served_date'),
      contact_phone: get('contact_phone'),
      contact_email: get('contact_email'),
      guarantor_name: get('guarantor_name'),
    }

    setSubmitting(true)
    try {
      await createCase(payload)
      notify('Case created successfully!')
      navigate('/cases')
    } catch (err) {
      notify(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {editing ? `Edit Case #${editing.serialNo}` : 'New Case Registration'}
          </h2>
          <p className="text-xs text-muted">
            {editing ? 'Update the details below.' : 'Fill in the initial case information.'}
          </p>
        </div>
        <div className="hidden gap-2.5 sm:flex">
          <button type="button" className="btn-ghost" onClick={() => setBulkImportOpen(true)}>
            <Upload size={15} /> Bulk Import
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate('/cases')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : editing ? 'Update Case' : 'Save Case'}
          </button>
        </div>
      </div>

      {bulkImportOpen && <BulkImportModal onClose={() => setBulkImportOpen(false)} />}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-1">
        {/* Column 1 — Initial case information */}
        <Column  index={1} title="Initial case information" subtitle="All fields entered manually">
          <Field label="Business name" >
            <select
              className="input"
              name="business_id"
              value={businessCode}
              onChange={handleBusinessChange}
            >
              {bussinessLoading ? (
                <option value="">Loading businesses...</option>
              ) : (
                <>
                  <option value="">Select business</option>
                  {bussinesses.map((b) => (
                    <option key={b.business} value={b.business}>
                      {b.business_name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </Field>
          <Field label="Depot name" >
            <select
              className="input"
              name="depot_id"
              value={depotCode}
              onChange={handleDepotChange}
            >
              {depotsLoading ? (
                <option value="">Loading depots...</option>
              ) : (
                <>
                  <option value="">Select depot</option>
                  {depots.map((dp) => (
                    <option key={dp.depot_code} value={dp.depot_code}>
                      {dp.depot_name} - {dp.depot_code}
                    </option>
                  ))}
                </>
              )}
            </select>
          </Field>
          <Field label="Customer code" hint={!depotCode ? 'Select a depot first' : undefined}>
            <CustomerCodeCombobox
              depotCode={depotCode}
              value={customerCode}
              selectedLabel={customerLabel}
              onChange={(code, label) => {
                setCustomerCode(code)
                setCustomerLabel(label)
              }}
            />
          </Field>
          <Field label="Accused name" >
            <input className="input" name="accused_name" placeholder="Enter name" defaultValue={d?.accusedName} />
          </Field>
          <Field label="Accused address" className="sm:col-span-2 xl:col-span-3">
            <textarea className="input min-h-18 resize-y" name="accused_address" placeholder="Enter address" />
          </Field>
          <Field label="Petitioner / concerned name" >
            <input className="input" name="petitioner_name" placeholder="Enter person" />
          </Field>
          <Field label="Lawyer name" >
            <select className="input" name="lawyer_name" defaultValue={d?.lawyer ?? ''}>
              {lawyersLoading ? (
                <option value="">Loading lawyers...</option>
              ) : (
                <>
                  <option value="">Select lawyer</option>
                  {lawyers.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </Field>
          <Field label="Case / suit no" >
            <input className="input" name="case_number" placeholder="Enter no." defaultValue={d?.caseNumber} />
          </Field>
          <Field label="Section" >
            <input className="input" name="section" placeholder="Enter section" defaultValue={d?.section} />
          </Field>
          <Field label="Court name" >
            <select className="input" name="court_id">
              {courtsLoading ? (
                <option value="">Loading courts...</option>
              ) : (
                <>
                <option value="">Select court</option>
              {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </>
              )}

            </select>
          </Field>
          <Field label="Case filing date" >
            <input className="input" type="date" name="case_filing_date" defaultValue={d?.caseFilingDate} />
          </Field>
          <Field label="Cheque amount (TK)" >
            <input className="input" type="number" step="1000" name="cheque_amount" placeholder="0.00" defaultValue={d?.chequeAmount} />
          </Field>
          <Field label="Remarks" className="sm:col-span-2 xl:col-span-3">
            <textarea className="input min-h-18 resize-y" name="remarks" placeholder="Optional notes" defaultValue={d?.remarks} />
          </Field>
        </Column>

        {/* Column 2 — Financial tracking */}
        <Column index={2} title="Financial tracking" subtitle="">
          <Field label="Dues at time of filing" >
            <input
              className="input"
              type="number"
              name="dues_at_filing"
              placeholder="Enter amount"
              value={duesAtFiling}
              onChange={(e) => setDuesAtFiling(e.target.value)}
            />
          </Field>
          <Field label={`Dues of previous month (${previousMonthLabel})`} >
            <input className="input input-readonly" placeholder="Auto-fetched" value={effectiveTracking ? duesPreviousMonth : ''} readOnly />
            <input type="hidden" name="dues_at_25th_previous_month" value={duesPreviousMonth} />
          </Field>
          <Field label={`Dues of current month (${currentMonthLabel})`} >
            <input className="input input-readonly" placeholder="Auto-fetched" value={effectiveTracking ? duesCurrentMonth : ''} readOnly />
            <input type="hidden" name="dues_at_25th_current_month" value={duesCurrentMonth} />
          </Field>
          <Field label="Recovered between current month – previous month" hint="" className="sm:col-span-2">
            <input className="input input-readonly" placeholder="Auto-calculated" value={effectiveTracking ? recoveredInPeriod : ''} readOnly />
          </Field>
          <Field label="Total recovered amount"  hint="">
            <input className="input input-readonly" placeholder="Auto-calculated" value={effectiveTracking ? totalRecovered : ''} readOnly />
          </Field>
          <Field label="Present dues"  hint="">
            <input className="input input-readonly" placeholder="Auto-mirrored" value={effectiveTracking ? presentDues : ''} readOnly />
          </Field>
        </Column>

        {/* Column 3 — Hearing information */}
        <Column index={3} title="Hearing information" subtitle="All fields entered manually">
          <Field label="Previous hearing date" >
            <input className="input" type="date" name="previous_hearing_date" defaultValue={d?.previousHearingDate} />
          </Field>
          <Field label="Next hearing date" >
            <input className="input" type="date" name="next_hearing_date" defaultValue={d?.nextHearingDate} />
          </Field>
          <Field label="Present status" >
            <select
              className="input"
              name="status_id"
              defaultValue={statuses.find((s) => s.name === d?.presentStatus)?.id ?? ''}
            >
              {statusesLoading ? (
                <option value="">Loading statuses...</option>
              ) : (
                <>
                  <option value="" disabled>Select status</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </Field>
          <Field label="Legal notice served date" >
            <input className="input" type="date" name="legal_notice_served_date" defaultValue={d?.legalNoticeServedDate ?? d?.legalNoticeDate} />
          </Field>
          <Field label="Contact phone" >
            <input className="input" name="contact_phone" placeholder="Phone" defaultValue={d?.contact} />
          </Field>
          <Field label="Contact email" >
            <input className="input" type="email" name="contact_email" placeholder="Email" />
          </Field>
          <Field label="Guarantor" >
            <input className="input" name="guarantor_name" placeholder="Enter guarantor name" defaultValue={d?.guarantor} />
          </Field>
        </Column>
      </div>

      {/* Mobile action bar */}
      <div className="mt-4 flex justify-end gap-2.5 sm:hidden">
        <button type="button" className="btn-ghost" onClick={() => navigate('/cases')}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {editing ? 'Update Case' : 'Save Case'}
        </button>
      </div>
    </form>
  )
}
