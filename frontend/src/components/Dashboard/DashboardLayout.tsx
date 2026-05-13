import React from "react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({
  children,
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn("relative min-h-screen bg-gradient-to-br from-background via-background to-secondary/20", className)}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

interface DashboardContainerProps {
  children: React.ReactNode
  className?: string
}

export function DashboardContainer({
  children,
  className,
}: DashboardContainerProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12", className)}>
      {children}
    </div>
  )
}

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function DashboardHeader({
  title,
  subtitle,
  action,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 lg:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-base text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex gap-3">{action}</div>}
    </div>
  )
}

interface DashboardGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
}

export function DashboardGrid({
  children,
  cols = 3,
  className,
}: DashboardGridProps) {
  const colsMap = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={cn(`grid gap-6 lg:gap-8 ${colsMap[cols]}`, className)}>
      {children}
    </div>
  )
}
