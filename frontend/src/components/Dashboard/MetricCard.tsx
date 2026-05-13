import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  change?: {
    value: number
    trend: "up" | "down"
  }
  variant?: "default" | "success" | "warning" | "danger"
  onClick?: () => void
  className?: string
}

const variantStyles = {
  default: {
    bg: "bg-gradient-to-br from-white to-secondary/30 dark:from-slate-800 dark:to-slate-700",
    iconBg: "bg-primary/10 text-primary dark:bg-primary/20",
    border: "border-border",
  },
  success: {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20",
    iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    border: "border-emerald-200/50 dark:border-emerald-700/30",
  },
  warning: {
    bg: "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20",
    iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    border: "border-amber-200/50 dark:border-amber-700/30",
  },
  danger: {
    bg: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/20",
    iconBg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    border: "border-red-200/50 dark:border-red-700/30",
  },
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  variant = "default",
  onClick,
  className,
}: MetricCardProps) {
  const styles = variantStyles[variant]

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative group overflow-hidden rounded-3xl p-6 lg:p-8",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-2 hover:shadow-2xl",
        "backdrop-blur-xl border border-white/20",
        "bg-gradient-to-br",
        onClick && "cursor-pointer",
        className,
      )}
      style={{
        backgroundImage: variant === "success"
          ? "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)"
          : variant === "warning"
          ? "linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(234,88,12,0.05) 100%)"
          : variant === "danger"
          ? "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.05) 100%)"
          : "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.05) 100%)"
      }}
    >
      {/* Animated gradient blob on hover */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Subtle border gradient */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10">
        {/* Icon with animated gradient background */}
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-5",
            "transition-all duration-500 group-hover:scale-120 group-hover:shadow-xl",
            "bg-gradient-to-br",
            styles.iconBg,
          )}
          style={{
            backgroundImage: variant === "success"
              ? "linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.2) 100%)"
              : variant === "warning"
              ? "linear-gradient(135deg, rgba(251,146,60,0.3) 0%, rgba(234,88,12,0.2) 100%)"
              : variant === "danger"
              ? "linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.2) 100%)"
              : "linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.2) 100%)"
          }}
        >
          <Icon className="w-7 h-7" />
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-muted-foreground/80 mb-2 uppercase tracking-wider">
          {label}
        </p>

        {/* Value */}
        <div className="flex items-baseline gap-3 mb-3">
          <h3 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {value}
          </h3>
          {change && (
            <span
              className={cn(
                "text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border",
                change.trend === "up"
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30",
              )}
            >
              {change.trend === "up" ? "↑" : "↓"} {Math.abs(change.value)}%
            </span>
          )}
        </div>

        {/* Optional subtitle */}
        {change && (
          <p className="text-xs text-muted-foreground/60">
            vs previous period
          </p>
        )}
      </div>
    </div>
  )
}
