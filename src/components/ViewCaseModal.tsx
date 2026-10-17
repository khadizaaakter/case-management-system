import { X } from 'lucide-react'
import { StatusPill } from './ui'
import { lakh, formatDate } from '../utils'
import type { listCasesTypes } from '../api/types'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-[13px]">
      <span className="font-semibold">{label}:</span> {value}
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2.5 text-[15px] font-semibold text-accent">{title}</h4>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

export default function ViewCaseModal({
  caseData,
  onClose,
}: {
  caseData: listCasesTypes
  onClose: () => void
}) {
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
            Case #{caseData.id} — {caseData.customer_code}
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
              <Row label="Serial No" value={caseData.id} />
              <Row label="Customer Code" value={caseData.customer_code} />
              <Row label="Depot" value={caseData.depot_name} />
              <Row label="Business" value={caseData.business_name} />
              <Row label="Cheque Amount" value={lakh(caseData.cheque_amount)} />
            </Group>
            <Group title="Legal Notice">
              <Row label="Notice Date" value={formatDate(caseData.legal_notice_served_date)} />
              <Row label="Filing Date" value={formatDate(caseData.case_filing_date)} />
              <Row label="Recovered (Notice to Date)" value={lakh(caseData.recovered_notice_to_date)} />
              <Row label="Present Status" value={<StatusPill status={caseData.status_name} />} />
            </Group>

            {(caseData.contact_phone || caseData.guarantor_name) && (
              <Group title="Contact & Guarantor">
                <Row label="Contact" value={caseData.contact_phone || '—'} />
                <Row label="Guarantor" value={caseData.guarantor_name || '—'} />
              </Group>
            )}

            {caseData.is_case_filed && (
              <>
                <Group title="Court Details">
                  <Row label="Accused" value={caseData.accused_name || '—'} />
                  <Row label="Lawyer" value={caseData.lawyer_name || '—'} />
                  <Row
                    label="Case Number"
                    value={[caseData.case_number, caseData.section].filter(Boolean).join(' · ') || '—'}
                  />
                  <Row label="Court" value={caseData.court_name || '—'} />
                </Group>
                <Group title="Financial Summary">
                  <Row label="Dues at Filing" value={lakh(caseData.dues_at_filing)} />
                  <Row label="Dues (Previous Month)" value={lakh(caseData.dues_at_25th_previous_month)} />
                  <Row label="Dues (Current Month)" value={lakh(caseData.dues_at_25th_current_month)} />
                  <Row label="Present Dues" value={lakh(caseData.present_dues)} />
                  <Row label="Total Recovered" value={lakh(caseData.total_recovered_amount)} />
                  <Row label="Next Hearing" value={formatDate(caseData.next_hearing_date)} />
                </Group>
              </>
            )}
          </div>

          {caseData.judgement_details && (
            <div className="mt-4.5 rounded-md bg-bg p-3 text-[13px]">
              <strong>Judgement Details:</strong> {caseData.judgement_details}
              {caseData.judgement_date && (
                <span className="text-muted"> ({formatDate(caseData.judgement_date)})</span>
              )}
            </div>
          )}

          {caseData.remarks && (
            <div className="mt-3 rounded-md bg-bg p-3 text-[13px]">
              <strong>Remarks:</strong> {caseData.remarks}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-border px-5.5 py-4">
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
