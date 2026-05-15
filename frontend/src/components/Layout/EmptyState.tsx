import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[300px]">
      <div className="w-12 h-12 rounded-full bg-mute/10 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-mute" />
      </div>
      <p className="label-sm text-mute">{title}</p>
      {description && <p className="text-xs text-mute/70 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
