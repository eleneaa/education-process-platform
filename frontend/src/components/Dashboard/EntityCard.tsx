import { cn } from "@/lib/utils"
import { ChevronRight, MoreVertical } from "lucide-react"

interface EntityCardProps {
  title: string
  description?: string
  image?: string
  badge?: {
    label: string
    variant?: "success" | "warning" | "default"
  }
  stats?: Array<{
    label: string
    value: string | number
  }>
  onClick?: () => void
  onMoreClick?: () => void
  className?: string
}

const badgeVariants = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  default: "bg-secondary text-secondary-foreground dark:bg-slate-700 dark:text-slate-100",
}

export function EntityCard({
  title,
  description,
  image,
  badge,
  stats,
  onClick,
  onMoreClick,
  className,
}: EntityCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border",
        "bg-gradient-to-br from-white via-white to-secondary/20",
        "dark:from-slate-800 dark:via-slate-800 dark:to-slate-700",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:border-primary/20",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Background image or placeholder */}
      {image ? (
        <img
          src={image}
          alt={title}
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5" />
      )}

      {/* Overlay on image */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative p-6">
        {/* Badge and more button */}
        <div className="flex items-start justify-between mb-3">
          {badge && (
            <span
              className={cn(
                "inline-block px-3 py-1 rounded-lg text-xs font-semibold",
                badgeVariants[badge.variant || "default"],
              )}
            >
              {badge.label}
            </span>
          )}
          {onMoreClick && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMoreClick()
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-secondary dark:hover:bg-slate-700",
                "text-muted-foreground hover:text-foreground",
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-foreground mb-1 truncate">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
            {stats.map((stat, idx) => (
              <div key={idx}>
                <p className="text-xs text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Hover indicator */}
        {onClick && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5 text-primary/60" />
          </div>
        )}
      </div>
    </div>
  )
}
