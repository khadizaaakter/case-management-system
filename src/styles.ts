import { statusSlug } from './utils'
import type { Priority } from './utils'

/** Tailwind classes for a status pill, keyed by status slug. */
export function statusPillClass(status: string): string {
  const slug = statusSlug(status)
  const map: Record<string, string> = {
    'notice-period-active': 'bg-warn-soft text-warn',
    'pending-hearing': 'bg-warn-soft text-warn',
    'under-litigation': 'bg-info-soft text-info',
    settled: 'bg-ok-soft text-ok',
    withdrawn: 'bg-neutral-soft text-neutral',
  }
  return map[slug] ?? 'bg-neutral-soft text-neutral'
}

/** Tailwind classes for a priority chip. */
export function prioClass(prio: Priority): string {
  const map: Record<Priority, string> = {
    urgent: 'bg-bad-soft text-bad',
    high: 'bg-warn-soft text-warn',
    medium: 'bg-info-soft text-info',
    low: 'bg-ok-soft text-ok',
  }
  return map[prio]
}
