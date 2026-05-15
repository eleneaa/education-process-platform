import { cn } from "@/lib/utils"

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  // Admission request statuses
  new: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  in_review: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  approved: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  user_created: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
  rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },

  // Group statuses
  planned: { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400" },
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  finished: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
  canceled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },

  // Program statuses
  draft: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
  on_review: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },

  // User status
  active_user: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  inactive: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
}

interface StatusBadgeProps {
  status: string
  label?: string
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  const colors = statusColors[status] || statusColors.new
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", colors.bg, colors.text, className)}>
      {showDot && <div className={cn("w-2 h-2 rounded-full", colors.dot)} />}
      {displayLabel}
    </div>
  )
}
