import { useEffect, useState } from 'react'
import { Search, Eye, Pencil, FolderOpen, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react'
import { lakh } from '../utils'
import { StatusPill } from '../components/ui'
import EditCaseModal from '../components/EditCaseModal'
import ViewCaseModal from '../components/ViewCaseModal'
import Spinner from '../components/Spinner'
import { getErrorMessage } from '../api/client'
import { listDeports } from '../api/depots'
import { listCaseStatuses } from '../api/caseStatuses'
import { useToast } from '../toast'
import type { CaseStatus, depots, listCasesTypes } from '../api/types'
import { ListCases, ListCasesPage } from '../api/cases'
import * as XLSX from 'xlsx'

const PER_PAGE = 10

export default function Cases() {

    const notify = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [depotId, setDepotId] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<listCasesTypes | null>(null)
  const [viewing, setViewing] = useState<listCasesTypes | null>(null)


    // depots state
    const [depots, setDepots] = useState<depots[]>([])
    const [depotsLoading, setDepotsLoading] = useState(true)

    // case statuses state
    const [statuses, setStatuses] = useState<CaseStatus[]>([])
    const [statusesLoading, setStatusesLoading] = useState(true)

    // fetch cases list

    const [cases, setCases] = useState<listCasesTypes[]>([])
    const [casesLoading, setCasesLoading] = useState(true)
    const [total, setTotal] = useState<number | undefined>()
    const [lastPage, setLastPage] = useState<number | undefined>()

    useEffect(() => {
      listDeports()
        .then(setDepots)
        .catch((err) => notify(getErrorMessage(err)))
        .finally(() => setDepotsLoading(false))
    }, [])

    useEffect(() => {
      listCaseStatuses()
        .then(setStatuses)
        .catch((err) => notify(getErrorMessage(err)))
        .finally(() => setStatusesLoading(false))
    }, [])

    const fetchCases = () => {
      setCasesLoading(true)
      ListCasesPage({
        search: search || undefined,
        status_id: status || undefined,
        depot_id: depotId || undefined,
        per_page: PER_PAGE,
        page,
      })
        .then((res) => {
          setCases(res.cases)
          setTotal(res.total)
          setLastPage(res.lastPage ?? (res.total !== undefined ? Math.max(1, Math.ceil(res.total / PER_PAGE)) : undefined))
        })
        .catch((err) => notify(getErrorMessage(err)))
        .finally(() => setCasesLoading(false))
    }

    const [exporting, setExporting] = useState(false)

    const handleExport = async () => {
      setExporting(true)
      try {
        // Fetch every case matching the current filters, not just the visible page.
        const all = await ListCases({
          search: search || undefined,
          status_id: status || undefined,
          depot_id: depotId || undefined,
          per_page: 100000,
        })
        const rows = all.map((c) => [
          c.case_number,
          c.customer_code,
          c.cheque_amount,
          c.present_dues,
          c.total_recovered_amount,
          c.status_name,
          c.depot_name,
          c.next_hearing_date || '',
          c.judgement_details || '',
        ])
        const ws = XLSX.utils.aoa_to_sheet([
          ['Case Number', 'Customer', 'Cheque', 'Present Dues', 'Recovered', 'Status', 'Depot', 'Next Hearing Date', 'Judgement Details'],
          ...rows,
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Cases')
        XLSX.writeFile(wb, `cases_${new Date().toISOString().split('T')[0]}.xlsx`)
      } catch (err) {
        notify(getErrorMessage(err), 'error')
      } finally {
        setExporting(false)
      }
    }

    useEffect(() => {
      const handle = setTimeout(fetchCases, 300)
      return () => clearTimeout(handle)
    }, [search, status, depotId, page])

  return (
    <>
      <div className="card p-5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-end gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Search</label>
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-2.5 text-faint" />
              <input
                className="input pl-8"
                placeholder="Case number, accused, or customer code…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Status</label>
            <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              {statusesLoading ? (
                <option value="">Loading statuses...</option>
              ) : (
                <>
                  <option value="">All Statuses</option>
                  {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </>
              )}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Depot</label>
            <select
              className="input"
              name="depot_id"
              value={depotId}
              onChange={(e) => { setDepotId(e.target.value); setPage(1) }}
            >
              {depotsLoading ? (
                <option value="">Loading depots...</option>
              ) : (
                <>
                  <option value="">Select depot</option>
                  {depots.map((dp) => <option key={dp.id} value={dp.id}>{dp.name}</option>)}
                </>
              )}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              className="btn-excel"
              title="Download this list as an Excel (.xlsx) file"
              disabled={exporting}
              onClick={handleExport}
            >
              {exporting ? (
                <Spinner size={13} />
              ) : (
                <FileSpreadsheet size={15} className="btn-excel-icon" />
              )}
              {exporting ? 'Exporting…' : 'Export Excel'}
            </button>
          </div>
          {/* <button className="btn-ghost" onClick={reset}>Reset</button> */}
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Customer</th>
                <th className="text-right">Cheque</th>
                <th className="text-right">Present Dues</th>
                <th className="text-right">Recovered</th>
                <th>Status</th>
                <th>Depot</th>
                <th>Next Hearing Date</th>
                <th>Judgement Details</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {casesLoading ? (
                <tr>
                  <td colSpan={10}>
                    <div className="flex items-center justify-center gap-2 py-11 text-muted">
                      <Spinner size={18} /> Loading cases…
                    </div>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="py-11 text-center text-muted">
                      <FolderOpen size={36} className="mx-auto mb-3 text-faint" />
                      <div>No cases match your filters.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id}>
                    <td>{c.case_number}</td>
                    <td className="font-medium">{c.customer_code}</td>
                    <td className="text-right tabular-nums">{lakh(c.cheque_amount)}</td>
                    <td className="text-right tabular-nums">{lakh(c.present_dues)}</td>
                    <td className="text-right tabular-nums">{lakh(c.total_recovered_amount)}</td>
                    <td><StatusPill status={c.status_name} /></td>
                    <td>{c.depot_name}</td>
                    <td>{c.next_hearing_date || '-'}</td>
                    <td>{c.judgement_details || '-'}</td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <button className="btn-ghost btn-sm" onClick={() => setViewing(c)}>
                          <Eye size={13} /> View
                        </button>
                        <button className="btn-primary btn-sm" onClick={() => setEditing(c)}>
                          <Pencil size={13} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {(page > 1 || cases.length > 0) && (
          <Pagination
            page={page}
            lastPage={lastPage}
            total={total}
            // Without metadata from the API, a full page means there may be more.
            hasNext={lastPage !== undefined ? page < lastPage : cases.length === PER_PAGE}
            disabled={casesLoading}
            onChange={setPage}
          />
        )}
      </div>

      {viewing && <ViewCaseModal caseData={viewing} onClose={() => setViewing(null)} />}

      {editing && (
        <EditCaseModal
          caseData={editing}
          onClose={() => setEditing(null)}
          onUpdated={fetchCases}
        />
      )}
    </>
  )
}

/** Page numbers to show around the current page, with `null` marking a gap. */
function pageWindow(page: number, lastPage: number): (number | null)[] {
  const pages: (number | null)[] = []
  for (let p = 1; p <= lastPage; p++) {
    if (p === 1 || p === lastPage || Math.abs(p - page) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== null) pages.push(null)
  }
  return pages
}

function Pagination({
  page,
  lastPage,
  total,
  hasNext,
  disabled,
  onChange,
}: {
  page: number
  lastPage?: number
  total?: number
  hasNext: boolean
  disabled: boolean
  onChange: (page: number) => void
}) {
  const from = (page - 1) * PER_PAGE + 1
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[13px] text-muted">
      <div>
        {total !== undefined
          ? total === 0
            ? 'No cases'
            : `Showing ${from}–${Math.min(page * PER_PAGE, total)} of ${total.toLocaleString()}`
          : `Page ${page}`}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          className="btn-ghost btn-sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={13} /> Prev
        </button>
        {lastPage !== undefined &&
          pageWindow(page, lastPage).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 text-faint">…</span>
            ) : (
              <button
                key={p}
                className={p === page ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
                disabled={disabled}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            ),
          )}
        <button
          className="btn-ghost btn-sm"
          disabled={disabled || !hasNext}
          onClick={() => onChange(page + 1)}
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
