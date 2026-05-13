import { FileUp, Download } from "lucide-react"
import { useState, ReactNode } from "react"

import { ImportResult } from "@/client/custom-types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportDialogProps {
  trigger: ReactNode
  title: string
  description: string
  templateColumns: string[]
  templateColumnLabels?: Record<string, string>
  templateFilename: string
  onImport: (file: File) => Promise<ImportResult>
  onSuccess?: () => void
}

export function ImportDialog({
  trigger,
  title,
  description,
  templateColumns,
  templateColumnLabels,
  templateFilename,
  onImport,
  onSuccess,
}: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const downloadTemplate = () => {
    const headers = templateColumns.map(col => templateColumnLabels?.[col] || col)
    const csv = headers.join(",") + "\n"
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = templateFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!file) {
      setError("Пожалуйста, выберите файл")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const importResult = await onImport(file)
      setResult(importResult)
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
          setOpen(false)
          setFile(null)
          setResult(null)
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при загрузке файла")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        {trigger}
      </Button>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {result ? (
            <Alert className={result.errors.length > 0 ? "border-yellow-500" : "border-green-500"}>
              <AlertDescription className="space-y-2">
                <div className="font-medium">
                  ✓ Создано записей: <span className="text-green-600">{result.created}</span>
                </div>
                {result.skipped > 0 && (
                  <div className="text-sm text-muted-foreground">
                    ⊘ Пропущено: {result.skipped}
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="space-y-1 mt-2 text-sm">
                    <div className="font-medium text-yellow-700">Ошибки:</div>
                    {result.errors.slice(0, 3).map((err, i) => (
                      <div key={i} className="text-yellow-600">
                        • {err}
                      </div>
                    ))}
                    {result.errors.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        + еще {result.errors.length - 3} ошибок
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">CSV файл</label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  {file ? `Выбран: ${file.name}` : "Формат: CSV с разделителем запятая (,)"}
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="gap-2 flex-1"
                  disabled={loading}
                >
                  <Download className="h-4 w-4" />
                  Скачать шаблон
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="gap-2 flex-1"
                >
                  <FileUp className="h-4 w-4" />
                  {loading ? "Загрузка..." : "Импортировать"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
