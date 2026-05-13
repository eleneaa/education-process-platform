import { cn } from "@/lib/utils"
import { MapPin, Users, CheckCircle } from "lucide-react"

interface InstitutionCardProps {
  name: string
  location: string
  studentCount: number
  completionRate: number
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export function InstitutionCard({
  name,
  location,
  studentCount,
  completionRate,
  isActive = true,
  onClick,
  className,
}: InstitutionCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border",
        "bg-gradient-to-br from-white to-secondary/10",
        "dark:from-slate-800 dark:to-slate-700/50",
        "p-5 transition-all duration-300 ease-out",
        "hover:shadow-md hover:border-primary/20",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Header with status indicator */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground truncate">
            {name}
          </h4>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {location}
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30">
            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Активно
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary/60" />
            <span className="text-xs text-muted-foreground">Студентов</span>
          </div>
          <p className="font-bold text-sm text-foreground">
            {studentCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Прогресс
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-sm text-foreground">
              {completionRate}%
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-secondary/30 overflow-hidden max-w-[80px]">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
