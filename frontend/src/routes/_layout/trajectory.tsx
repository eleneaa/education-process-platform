import { createFileRoute } from "@tanstack/react-router"
import { Lightbulb } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_layout/trajectory")({
  component: TrajectoryPage,
  head: () => ({
    meta: [{ title: "Траектория обучения" }],
  }),
})

function TrajectoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Траектория обучения</h1>
        <p className="text-muted-foreground">Персональные рекомендации и планирование обучения</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Скоро здесь появятся рекомендации</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 rounded-lg bg-muted p-4">
            <Lightbulb className="h-5 w-5 text-[#FF9935] shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium">На этой странице будут:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Следующий шаг</strong> — какой модуль начать дальше</li>
                <li><strong>Следующая программа</strong> — какую программу пройти после текущей</li>
                <li><strong>Рекомендация от преподавателя</strong> — персональные советы</li>
                <li><strong>Общие рекомендации</strong> — для всех студентов программы</li>
                <li><strong>Умные рекомендации</strong> — на основе твоего прогресса</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
