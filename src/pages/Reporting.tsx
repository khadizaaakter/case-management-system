import { useMemo, useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useStore } from '../store'
import { useToast } from '../toast'
import { lakh, formatDate } from '../utils'
import { StatusPill } from '../components/ui'

const HEADERS = [
  'S.No', 'Customer', 'Depot', 'Business', 'Cheque Amount', 'Recovery During Notice',
  'Case Filed', 'Present Dues', 'Total Recovered', 'Status', 'Next Hearing',
]

export default function Reporting() {
  const { cases, masterData } = useStore()
  const notify = useToast()
  const [status, setStatus] = useState('')
  const [depot, setDepot] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filtered = useMemo(() => {
    return cases.filter(
      (c) =>
        (!status || c.presentStatus === status) &&
        (!depot || c.depot === depot) &&
        (!from || new Date(c.createdDate) >= new Date(from)) &&
        (!to || new Date(c.createdDate) <= new Date(to)),
    )
  }, [cases, status, depot, from, to])

  const rowsFor = (fmt: (n: number | undefined) => string) =>
    filtered.map((c, i) => [
      i + 1, c.customerCode, c.depot, c.business, fmt(c.chequeAmount),
      fmt(c.recoveryDuringNotice), c.caseFiled, fmt(c.presentDues),
      fmt(c.totalRecovered), c.presentStatus, formatDate(c.nextHearingDate),
    ])

  const exportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rowsFor((n) => lakh(n))])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cases')
    XLSX.writeFile(wb, `case_report_${new Date().toISOString().split('T')[0]}.xlsx`)
    notify('Report exported to Excel successfully!')
  }

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text('Case Management Report', 14, 15)
    autoTable(doc, {
      head: [HEADERS],
      body: rowsFor((n) => lakh(n)),
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    })
    doc.save(`case_report_${new Date().toISOString().split('T')[0]}.pdf`)
    notify('Report exported to PDF successfully!')
  }

  return (
    <>
      <div className="card p-5">
        <h3 className="card-title">Report Filters &amp; Export</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {masterData.statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Depot</label>
            <select className="input" value={depot} onChange={(e) => setDepot(e.target.value)}>
              <option value="">All Depots</option>
              {masterData.depots.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Date From</label>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Date To</label>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex gap-2.5">
          <button className="btn-primary" onClick={exportExcel}>
            <FileSpreadsheet size={15} /> Export to Excel
          </button>
          <button className="btn-ghost" onClick={exportPDF}>
            <FileText size={15} /> Export to PDF
          </button>
          <button className="btn-ghost" onClick={() => { setStatus(''); setDepot(''); setFrom(''); setTo('') }}>
            Reset
          </button>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>{HEADERS.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={HEADERS.length}><div className="py-11 text-center text-muted">No records match your filters.</div></td></tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{c.customerCode}</td>
                    <td>{c.depot}</td>
                    <td>{c.business}</td>
                    <td className="tabular-nums">{lakh(c.chequeAmount)}</td>
                    <td className="tabular-nums">{lakh(c.recoveryDuringNotice)}</td>
                    <td>{c.caseFiled}</td>
                    <td className="tabular-nums">{lakh(c.presentDues)}</td>
                    <td className="tabular-nums">{lakh(c.totalRecovered)}</td>
                    <td><StatusPill status={c.presentStatus} /></td>
                    <td>{formatDate(c.nextHearingDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
