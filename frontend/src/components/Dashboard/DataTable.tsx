import React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], item: T) => React.ReactNode
  width?: string
  align?: "left" | "center" | "right"
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  title?: string
  searchable?: boolean
  onRowClick?: (item: T) => void
  className?: string
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  title,
  searchable = false,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredData = searchable
    ? data.filter((item) =>
        columns.some((col) => {
          const value = item[col.key]
          return String(value)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        }),
      )
    : data

  return (
    <div
      className={cn(
        "rounded-2xl border border-border overflow-hidden",
        "bg-gradient-to-br from-white to-secondary/10",
        "dark:from-slate-800 dark:to-slate-700/50",
        className,
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {title && (
            <h3 className="font-semibold text-foreground">
              {title}
            </h3>
          )}
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full pl-9 pr-4 py-2 rounded-lg text-sm",
                  "bg-secondary/50 dark:bg-slate-700/50",
                  "border border-border/50",
                  "text-foreground placeholder-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  "transition-all",
                )}
              />
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {filteredData.length} записей
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30 dark:bg-slate-700/30">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-6 py-4 text-sm font-semibold text-muted-foreground",
                    "text-left whitespace-nowrap",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                  )}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-2 select-none cursor-pointer hover:text-foreground transition-colors">
                    {col.label}
                    <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "border-b border-border/30 transition-colors",
                    "hover:bg-secondary/30 dark:hover:bg-slate-700/30",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-6 py-4 text-sm text-foreground",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right",
                      )}
                    >
                      {col.render
                        ? col.render(item[col.key], item)
                        : String(item[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <p className="text-sm">Нет данных для отображения</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {filteredData.length > 0 && (
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Показано {filteredData.length} из {data.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Предыдущая
            </Button>
            <Button variant="outline" size="sm">
              Следующая
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
