import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Spinner from './Spinner'

/**
 * Delete button + confirmation dialog (React take on the Vue PopConfirm).
 * `onConfirm` runs after the user confirms; `busy` shows a spinner on the trigger.
 */
export default function ConfirmDelete({
  title,
  onConfirm,
  busy = false,
}: {
  title: string
  onConfirm: () => void | Promise<void>
  busy?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="btn-danger btn-sm"
        title="Delete"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        {busy ? <Spinner size={13} /> : <Trash2 size={13} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-100 grid place-items-center bg-[rgba(16,24,40,0.45)] p-5"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-100 rounded-[10px] bg-surface p-5.5 shadow-[0_20px_50px_rgba(16,24,40,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bad-soft text-bad">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h4 className="text-[15px] font-semibold">Delete “{title}”?</h4>
                <p className="mt-1 text-[13px] text-muted">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-4.5 flex justify-end gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-bad px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-bad/90"
                onClick={() => {
                  setOpen(false)
                  void onConfirm()
                }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
