import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface Toast {
  id: number
  message: string
  type: ToastType
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(
  () => {},
)

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const ACCENT: Record<ToastType, string> = {
  success: 'border-l-ok',
  error: 'border-l-bad',
  warning: 'border-l-warn',
  info: 'border-l-info',
}

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="fixed right-4.5 top-4.5 z-200 flex flex-col gap-2.5">
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              className={`flex min-w-60 items-center gap-2.5 rounded-md border border-border border-l-[3px] bg-surface px-4 py-3 text-[13px] font-medium shadow-[0_8px_24px_rgba(16,24,40,0.14)] ${ACCENT[t.type]}`}
            >
              <Icon size={17} />
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
