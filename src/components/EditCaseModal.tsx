import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import { UpdateCase, type UpdateCasesPayload } from '../api/cases'
import { getErrorMessage } from '../api/client'
import { useToast } from '../toast'
import type { listCasesTypes } from '../api/types'

const PRESENT_STATUS_OPTIONS = [
  { id: 1, label: 'Notice Period Active' },
  { id: 2, label: 'Pending Hearing' },
  { id: 3, label: 'Settled' },
  { id: 4, label: 'Withdrawn' },
  { id: 5, label: 'Under Litigation' },
]

export default function EditCaseModal({
  caseData,
  onClose,
  onUpdated,
}: {
  caseData: listCasesTypes
  onClose: () => void
  onUpdated: () => void
}) {
  const notify = useToast()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string) || ''

    const payload: UpdateCasesPayload = {
      status_id: get('status_id'),
      judgement_date: get('judgement_date') || null,
      judgement_details: get('judgement_details'),
      next_hearing_date: get('next_hearing_date') || null,
    }

    setSubmitting(true)
    try {
      await UpdateCase(caseData.id, payload)
      notify('Case updated successfully!')
      onUpdated()
      onClose()
    } catch (err) {
      notify(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={
        <div>
          <div>Edit case</div>
          <div className="text-xs font-normal text-muted">Customer code — {caseData.customer_code}</div>
        </div>
      }
      onClose={onClose}
      maxWidth={480}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Present status</label>
          <select className="input" name="status_id" defaultValue={caseData.status_id}>
            <option value="" disabled>Select status</option>
            {PRESENT_STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-dashed border-border-strong p-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Judgement date</label>
            <input className="input" type="date" name="judgement_date" defaultValue={caseData.judgement_date ?? ''} />
          </div>
          <div className="mt-3.5 flex flex-col gap-1.5">
            <label className="field-label">Judgement details</label>
            <textarea
              className="input min-h-20 resize-y"
              name="judgement_details"
              placeholder="Enter verdict, order details, or court remarks…"
              defaultValue={caseData.judgement_details ?? ''}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="field-label">Next hearing date</label>
          <input className="input" type="date" name="next_hearing_date" defaultValue={caseData.next_hearing_date ?? ''} />
          <span className="text-[11px] italic text-faint">Leave blank if no further hearing is scheduled</span>
        </div>

        <div className="mt-1.5 flex justify-end gap-2.5">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
