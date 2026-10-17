/** Format a raw taka value into Lakhs, e.g. 250000 -> "৳2.50L" */
export function lakh(value: number | undefined): string {
  return `৳${((value ?? 0) / 100000).toFixed(2)}L`
}

/** Format a raw taka value into Crores, e.g. 10000000 -> "1.0Cr" */
export function crore(value: number | undefined): string {
  return `৳${((value ?? 0) / 10000000).toFixed(1)}Cr`
}

/** Whole thousands with grouping, e.g. 4477089672 -> "44,77,089K" */
export function thousands(value: number): string {
  return `৳${Math.floor(value / 1000).toLocaleString('en-IN')}K`
}

export function statusSlug(status: string): string {
  return status.toLowerCase().replace(/\s+/g, '-')
}

export function formatDate(date: string | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function todayLong(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export type Priority = 'urgent' | 'high' | 'medium' | 'low'

export function taskPriority(nextHearingDate: string): Priority {
  const days = Math.ceil(
    (new Date(nextHearingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'high'
  if (days <= 14) return 'medium'
  return 'low'
}

export function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
