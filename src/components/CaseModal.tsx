import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { Case } from '../types'
import { useStore } from '../store'
import { lakh, formatDate } from '../utils'
import { StatusPill } from './ui'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-accent">{title}</h4>
      {children}
    </div>
  )
}

export default function CaseModal({
  caseData,
  onClose,
}: {
  caseData: Case
  onClose: () => void
}) {
  const { auditLog } = useStore()
  const navigate = useNavigate()
  const recent = auditLog.slice(-15).reverse()

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-[rgba(16,24,40,0.45)] p-5"
      onClick={onClose}
    >
      <div
        className="max-h-[86vh] w-full max-w-[620px] overflow-y-auto rounded-[10px] bg-surface shadow-[0_20px_50px_rgba(16,24,40,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5.5 py-4.5">
          <h3 className="text-base font-semibold">
            Case #{caseData.serialNo} — {caseData.customerCode}
          </h3>
          <button
            className="grid place-items-center rounded-md p-1 text-faint hover:bg-bg hover:text-ink"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5.5">
          <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
            <Group title="Basic Information">
              <Row label="Serial No" value={caseData.serialNo} />
              <Row label="Customer Code" value={caseData.customerCode} />
              <Row label="Depot" value={caseData.depot} />
              <Row label="Business" value={caseData.business} />
              <Row label="Cheque Amount" value={lakh(caseData.chequeAmount)} />
            </Group>
            <Group title="Legal Notice">
              <Row label="Notice Date" value={formatDate(caseData.legalNoticeDate)} />
              <Row label="Filing Deadline" value={formatDate(caseData.deadlineCaseFiling)} />
              <Row label="Recovery During Notice" value={lakh(caseData.recoveryDuringNotice)} />
              <Row label="Status" value={<StatusPill status={caseData.presentStatus} />} />
            </Group>
            {(caseData.contact || caseData.guarantor) && (
              <Group title="Contact & Guarantor">
                <Row label="Contact" value={caseData.contact || '—'} />
                <Row label="Guarantor" value={caseData.guarantor || '—'} />
              </Group>
            )}

            {caseData.caseFiled === 'Yes' && (
              <>
                <Group title="Court Details">
                  <Row label="Accused" value={caseData.accusedName || '—'} />
                  <Row label="Lawyer" value={caseData.lawyer || '—'} />
                  <Row
                    label="Case Number"
                    value={[caseData.caseNumber, caseData.section].filter(Boolean).join(' · ') || '—'}
                  />
                  <Row label="Court" value={caseData.court || '—'} />
                  <Row label="Filing Date" value={formatDate(caseData.caseFilingDate)} />
                </Group>
                <Group title="Financial Summary">
                  <Row label="Dues at Filing" value={lakh(caseData.duesAtFiling)} />
                  <Row label="Dues at May 25" value={lakh(caseData.duesAtMay)} />
                  <Row label="Dues at June 25" value={lakh(caseData.duesAtJune)} />
                  <Row label="Present Dues" value={lakh(caseData.presentDues)} />
                  <Row label="Total Recovered" value={lakh(caseData.totalRecovered)} />
                  <Row label="Next Hearing" value={formatDate(caseData.nextHearingDate)} />
                </Group>
              </>
            )}
          </div>

          {caseData.remarks && (
            <div className="mt-4.5 rounded-md bg-bg p-3 text-[13px]">
              <strong>Remarks:</strong> {caseData.remarks}
            </div>
          )}

          <h4 className="mt-5.5 mb-3 text-[13px] font-semibold">Case Log</h4>
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {recent.length === 0 && <div className="text-xs text-muted">No activity recorded.</div>}
            {recent.map((e, i) => (
              <div className="audit-item" key={i}>
                <div>
                  <span className="font-semibold">{e.user}</span> — {e.action}: {e.field}
                </div>
                <div>{e.details}</div>
                <div className="mt-0.5 text-[11.5px] text-faint">
                  {new Date(e.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-border px-5.5 py-4">
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={() => navigate(`/create?edit=${caseData.id}`)}>
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}
