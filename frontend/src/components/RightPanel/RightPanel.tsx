import { ReactNode } from "react"
import { X } from "lucide-react"
import "./RightPanel.css"

interface RightPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  width?: "sm" | "md" | "lg" | "xl"
}

export function RightPanel({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = "md",
}: RightPanelProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 z-50 bg-background border-l border-border
          shadow-2xl overflow-y-auto transition-transform duration-300
          ${widthClasses[width]}
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="
              shrink-0 p-2 rounded-lg
              hover:bg-secondary transition-colors
              text-foreground hover:text-foreground/80
            "
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </>
  )
}

const widthClasses = {
  sm: "w-80",
  md: "w-96",
  lg: "w-[28rem]",
  xl: "w-[32rem]",
}
