import React from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Building2,
  Settings,
  BarChart3,
  LogOut,
  LucideIcon,
} from "lucide-react"

interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  badge?: string | number
  isActive?: boolean
}

interface SidebarNavProps {
  items: NavItem[]
  onLogout?: () => void
  className?: string
}

export function SidebarNav({
  items,
  onLogout,
  className,
}: SidebarNavProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-screen w-64 border-r border-border",
        "bg-gradient-to-b from-white via-white to-secondary/10",
        "dark:from-slate-800 dark:via-slate-800 dark:to-slate-700/50",
        className,
      )}
    >
      {/* Header */}
      <div className="px-6 py-8 border-b border-border/50">
        <h1 className="text-2xl font-bold text-foreground">
          EduFlow
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Платформа обучения
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                "transition-all duration-200",
                item.isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 dark:hover:bg-slate-700/50",
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                    item.isActive
                      ? "bg-primary-foreground text-primary"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </a>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4 space-y-2">
        <a
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            "dark:hover:bg-slate-700/50 transition-all duration-200",
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Настройки</span>
        </a>
        {onLogout && (
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
              "text-muted-foreground hover:text-red-600 dark:hover:text-red-400",
              "hover:bg-red-50 dark:hover:bg-red-900/20",
              "transition-all duration-200",
            )}
          >
            <LogOut className="w-5 h-5" />
            <span>Выход</span>
          </button>
        )}
      </div>
    </div>
  )
}

/* Default navigation items */
export const defaultNavItems: NavItem[] = [
  {
    label: "Панель управления",
    icon: LayoutDashboard,
    href: "/",
    isActive: true,
  },
  {
    label: "Студенты",
    icon: Users,
    href: "/students-sharp",
    badge: 2543,
  },
  {
    label: "Курсы",
    icon: BookOpen,
    href: "/courses",
    badge: 47,
  },
  {
    label: "Учреждения",
    icon: Building2,
    href: "/institutions",
  },
  {
    label: "Аналитика",
    icon: BarChart3,
    href: "/analytics",
  },
]

/* Layout wrapper with sidebar */
interface SidebarLayoutProps {
  children: React.ReactNode
  navItems?: NavItem[]
  onLogout?: () => void
}

export function SidebarLayout({
  children,
  navItems = defaultNavItems,
  onLogout,
}: SidebarLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav items={navItems} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-secondary/20">
          {children}
        </main>
      </div>
    </div>
  )
}
