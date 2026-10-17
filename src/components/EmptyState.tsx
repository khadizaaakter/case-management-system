import { Inbox } from 'lucide-react'

export default function EmptyState({ message = 'No data found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-faint">
      <Inbox size={30} strokeWidth={1.5} />
      <span className="text-[13px]">{message}</span>
    </div>
  )
}
