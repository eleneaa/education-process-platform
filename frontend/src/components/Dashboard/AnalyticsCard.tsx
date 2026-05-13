import React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp } from "lucide-react"

interface AnalyticsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}

export function AnalyticsCard({
  title,
  description,
  children,
  footer,
  className,
  headerAction,
}: AnalyticsCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border",
        "bg-gradient-to-br from-white via-white to-secondary/20",
        "dark:from-slate-800 dark:via-slate-800 dark:to-slate-700",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:border-primary/20",
        className,
      )}
    >
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {headerAction}
        </div>

        {/* Content */}
        <div className="mb-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="pt-4 border-t border-border/50 text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

interface ChartPlaceholderProps {
  height?: number
}

export function ChartPlaceholder({ height = 300 }: ChartPlaceholderProps) {
  return (
    <div
      style={{ height }}
      className={cn(
        "w-full rounded-lg bg-gradient-to-br from-secondary/30 to-secondary/10",
        "dark:from-slate-700/30 dark:to-slate-600/10",
        "flex items-center justify-center",
        "border border-border/50",
      )}
    >
      <div className="text-center">
        <TrendingUp className="w-8 h-8 text-primary/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Chart rendering here
        </p>
      </div>
    </div>
  )
}
