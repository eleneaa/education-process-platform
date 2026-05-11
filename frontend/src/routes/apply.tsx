import { useMutation } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Check, AlertCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/apply")({
  component: ApplyPage,
  head: () => ({
    meta: [{ title: "Подать заявку" }],
  }),
})

function ApplyPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [programInterest, setProgramInterest] = useState("")
  const [comment, setComment] = useState("")
  const [isForChild, setIsForChild] = useState(false)
  const [childName, setChildName] = useState("")
  const [guardianName, setGuardianName] = useState("")
  const [guardianPhone, setGuardianPhone] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: isForChild ? guardianName.trim() : fullName.trim(),
        email: email.trim() || null,
        phone_number: isForChild ? guardianPhone.trim() : phone.trim(),
        program_interest: programInterest.trim() || null,
        comment: comment.trim() || null,
        source: "website",
        is_for_child: isForChild,
        child_name: isForChild ? childName.trim() || null : null,
        guardian_name: isForChild ? guardianName.trim() || null : null,
        guardian_phone: isForChild ? guardianPhone.trim() || null : null,
      }

      const res = await fetch("/api/v1/admission-requests/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) {
          throw new Error("Вы отправили слишком много заявок. Попробуйте позже.")
        }
        throw new Error(data.detail || "Ошибка при отправке заявки")
      }

      return res.json()
    },
    onSuccess: () => {
      setSubmitted(true)
      showSuccessToast("Заявка отправлена успешно!")
      resetForm()
    },
    onError: (error) => {
      showErrorToast(
        error instanceof Error ? error.message : "Не удалось отправить заявку"
      )
    },
  })

  function resetForm() {
    setFullName("")
    setEmail("")
    setPhone("")
    setProgramInterest("")
    setComment("")
    setIsForChild(false)
    setChildName("")
    setGuardianName("")
    setGuardianPhone("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isForChild) {
      if (!guardianName.trim() || !guardianPhone.trim()) {
        showErrorToast("Заполните имя опекуна и телефон")
        return
      }
    } else {
      if (!fullName.trim() || !phone.trim()) {
        showErrorToast("Заполните имя и телефон")
        return
      }
    }
    mutation.mutate()
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-950 p-4">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Спасибо!</h2>
                <p className="text-muted-foreground mt-2">
                  Ваша заявка принята. Мы свяжемся с вами в ближайшее время.
                </p>
              </div>
              <Button
                onClick={() => setSubmitted(false)}
                className="w-full mt-6 bg-primary hover:bg-primary/90"
              >
                Подать ещё одну заявку
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
            Подать заявку
          </h1>
          <p className="text-muted-foreground text-lg">
            Заполните форму, чтобы подать заявку на обучение
          </p>
        </div>

        <Card className="rounded-3xl border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-white/20">
            <CardTitle>Форма заявки</CardTitle>
            <CardDescription>Все поля помечены * обязательны к заполнению</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            {mutation.error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Ошибка при отправке заявки"}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* For child toggle */}
              <div className="rounded-lg border border-white/20 bg-white/30 dark:bg-slate-800/30 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="forChild"
                    checked={isForChild}
                    onChange={(e) => {
                      setIsForChild(e.target.checked)
                      setFullName("")
                      setChildName("")
                      setGuardianName("")
                    }}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                  <label htmlFor="forChild" className="text-sm font-medium cursor-pointer select-none">
                    Заявка для ребёнка
                  </label>
                </div>
              </div>

              {/* Name field */}
              <div className="space-y-2">
                <Label>
                  {isForChild ? "Имя опекуна" : "Полное имя"} *
                </Label>
                <Input
                  type="text"
                  value={isForChild ? guardianName : fullName}
                  onChange={(e) =>
                    isForChild
                      ? setGuardianName(e.target.value)
                      : setFullName(e.target.value)
                  }
                  placeholder={isForChild ? "Иванов Иван Иванович" : "Ваше полное имя"}
                  required
                  disabled={mutation.isPending}
                  className="rounded-lg border-white/20 bg-white/50 dark:bg-slate-800/50"
                />
              </div>

              {/* Child name field */}
              {isForChild && (
                <div className="space-y-2">
                  <Label>Имя ребёнка *</Label>
                  <Input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Имя ребёнка"
                    required
                    disabled={mutation.isPending}
                    className="rounded-lg border-white/20 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  disabled={mutation.isPending}
                  className="rounded-lg border-white/20 bg-white/50 dark:bg-slate-800/50"
                />
              </div>

              {/* Phone field */}
              <div className="space-y-2">
                <Label>
                  {isForChild ? "Телефон опекуна" : "Телефон"} *
                </Label>
                <Input
                  type="tel"
                  value={isForChild ? guardianPhone : phone}
                  onChange={(e) =>
                    isForChild ? setGuardianPhone(e.target.value) : setPhone(e.target.value)
                  }
                  placeholder="+7 (999) 000-00-00"
                  required
                  disabled={mutation.isPending}
                  className="rounded-lg border-white/20 bg-white/50 dark:bg-slate-800/50"
                />
              </div>

              {/* Program interest field */}
              <div className="space-y-2">
                <Label>Интересующая программа</Label>
                <Input
                  type="text"
                  value={programInterest}
                  onChange={(e) => setProgramInterest(e.target.value)}
                  placeholder="Название программы или направления"
                  disabled={mutation.isPending}
                  className="rounded-lg border-white/20 bg-white/50 dark:bg-slate-800/50"
                />
              </div>

              {/* Comment field */}
              <div className="space-y-2">
                <Label>Комментарий</Label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Дополнительная информация (опционально)"
                  rows={4}
                  disabled={mutation.isPending}
                  className="w-full rounded-lg border border-white/20 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 rounded-lg"
              >
                {mutation.isPending ? "Отправка..." : "Отправить заявку"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Ваши данные защищены. Мы не будем передавать их третьим лицам.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
