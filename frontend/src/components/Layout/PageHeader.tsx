import { cn } from "@/lib/utils"

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  number?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  number = "001",
}: PageHeaderProps) {
  return (
    <>
      {eyebrow && (
        <div className="px-10 py-4">
          <div className="flex items-center justify-between">
            <div className="eyebrow">
              {number && `№ ${number} — `}
              {eyebrow}
            </div>
            <div className="eyebrow text-right">
              {new Date().toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      )}

      <div className="px-10 py-8 flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="display-hero mb-2">{title}</h1>
          {description && <p className="body-md text-mute max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
      </div>
    </>
  )
}
