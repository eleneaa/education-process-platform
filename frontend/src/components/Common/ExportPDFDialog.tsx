import { useState } from "react"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useCustomToast from "@/hooks/useCustomToast"

export interface ExportColumn {
  key: string
  label: string
  defaultEnabled: boolean
  format?: (value: unknown) => string
}

export interface ExportPDFDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
  exportType?: "users" | "admission-requests" | "programs"
}

export function ExportPDFDialog({
  open,
  onOpenChange,
  title,
  columns,
  data,
}: ExportPDFDialogProps) {
  const { showSuccessToast } = useCustomToast()
  const [docTitle, setDocTitle] = useState(title)
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleDownload() {
    const activeCols = columns

    setIsGenerating(true)
    try {
      const dateStr = new Date().toLocaleDateString("ru-RU")

      // Build rows HTML
      const tableRows = data.map((row) =>
        activeCols
          .map((c) => {
            const raw = row[c.key]
            let val = "—"
            if (c.format) {
              val = c.format(raw)
            } else if (raw != null) {
              if (typeof raw === "boolean") {
                val = raw ? "Да" : "Нет"
              } else {
                val = String(raw)
              }
            }
            return val.replace(/</g, "&lt;").replace(/>/g, "&gt;")
          })
          .map((cell) => `<td style="padding:10px; border:1px solid #ddd;">${cell}</td>`)
          .join("")
      )

      const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<style>
@page { size: A4 landscape; margin: 20mm; }
* { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  padding: 20px;
  color: #333;
}
h1 { font-size: 18pt; margin-bottom: 10px; }
.subtitle { font-size: 10pt; color: #666; margin-bottom: 15px; }
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}
th {
  background-color: #1e293b;
  color: white;
  padding: 10px;
  text-align: left;
  font-weight: bold;
  font-size: 10pt;
}
td {
  padding: 10px;
  border: 1px solid #ddd;
  font-size: 9pt;
}
tr:nth-child(even) { background-color: #f8fafc; }
@media print {
  body { padding: 0; }
  h1, .subtitle { page-break-after: avoid; }
  table { page-break-inside: avoid; }
}
</style>
</head>
<body>
<h1>${docTitle}</h1>
<div class="subtitle">${dateStr} | Записей: ${data.length}</div>
<table>
<thead>
<tr>${activeCols.map((c) => `<th>${c.label}</th>`).join("")}</tr>
</thead>
<tbody>
${tableRows.map((row) => `<tr>${row}</tr>`).join("")}
</tbody>
</table>
</body>
</html>`

      // Open in new window/tab for printing
      const win = window.open("", "", "width=1200,height=800")
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => {
          win.print()
        }, 500)
        showSuccessToast("Откройте печать (Ctrl+P) и выберите 'Сохранить как PDF'")
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error:", error)
      alert("Ошибка при создании документа")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Экспорт в PDF</DialogTitle>
          <DialogDescription>Настройте параметры выгрузки</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Название документа</Label>
            <Input
              id="doc-title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Введите название"
              disabled={isGenerating}
            />
          </div>


          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              Будет экспортировано <strong>{data.length}</strong> записей
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Отмена
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            {isGenerating ? "Подготовка..." : "Печать и сохранение"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
