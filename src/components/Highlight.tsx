import type { ReactNode } from 'react'

/** Highlights case-insensitive matches of `query` inside `text` (Vue highlightedText). */
export default function Highlight({
  text,
  query,
}: {
  text?: string | null
  query?: string
}) {
  if (!text) return null
  const q = query?.trim()
  if (!q) return <>{text}</>

  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  const parts: ReactNode[] = []
  let i = 0
  for (;;) {
    const idx = lower.indexOf(needle, i)
    if (idx === -1) {
      parts.push(text.slice(i))
      break
    }
    if (idx > i) parts.push(text.slice(i, idx))
    parts.push(
      <mark key={idx} className="rounded-xs bg-warn-soft px-0.5 text-inherit">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    )
    i = idx + needle.length
  }
  return <>{parts}</>
}
