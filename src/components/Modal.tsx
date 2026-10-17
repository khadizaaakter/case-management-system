import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  title,
  onClose,
  children,
  maxWidth = 560,
}: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  maxWidth?: number
}) {
  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-[rgba(16,24,40,0.45)] p-5"
      onClick={onClose}
    >
      <div
        className="max-h-[86vh] w-full overflow-y-auto rounded-[10px] bg-surface shadow-[0_20px_50px_rgba(16,24,40,0.25)]"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-5.5 py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            className="grid place-items-center rounded-md p-1 text-faint hover:bg-bg hover:text-ink"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>
        <div className="p-5.5">{children}</div>
      </div>
    </div>
  )
}
