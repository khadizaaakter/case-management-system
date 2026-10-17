import type { ReactNode } from 'react'
import { statusPillClass } from '../styles'

export function StatCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string
  value: ReactNode
  meta?: string
  icon?: ReactNode
}) {
  return (
    <div className="card p-[16px_18px]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
        {icon && (
          <span className="grid h-[22px] w-[22px] place-items-center rounded-md bg-accent-soft text-accent">
            {icon}
          </span>
        )}
        {label}
      </div>
      <div className="mt-2 mb-0.5 text-[25px] font-bold tracking-tight tabular-nums">{value}</div>
      {meta && <div className="text-xs text-muted">{meta}</div>}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill ${statusPillClass(status)}`}>{status}</span>
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="card mt-6 p-5">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}
