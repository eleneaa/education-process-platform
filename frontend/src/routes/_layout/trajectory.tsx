import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BookOpen, MessageSquare, Trophy, Award, ArrowRight } from "lucide-react"
import { useState } from "react"

import { getEnrollments, getStudentRecommendations, getPrograms } from "@/client/custom-api"
import type { TeacherRecommendation, Program } from "@/client/custom-types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RightPanel } from "@/components/RightPanel"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/trajectory")({
  component: TrajectoryPage,
  head: () => ({
    meta: [{ title: "Траектория обучения" }],
  }),
})

function TrajectoryPage() {
  const { user } = useAuth()
  const [selectedProgram, setSelectedProgram] = useState<Program | undefined>()
  const [isProgramDetailsOpen, setIsProgramDetailsOpen] = useState(false)

  const { data: enrollments } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () => getEnrollments(user!.id),
    enabled: !!user?.id,
    placeholderData: { data: [], count: 0 },
    staleTime: 0,
    gcTime: 0,
  })

  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: () => getStudentRecommendations(user!.id),
    enabled: !!user?.id,
    placeholderData: [],
  })

  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms(),
    placeholderData: { data: [], count: 0 },
  })

  const enrollmentList = enrollments?.data ?? []
  const recommendationList = recommendations ?? []
  const programList = programs?.data ?? []

  // Программы которых нет в записях
  const enrolledProgramIds = new Set(enrollmentList.map((e) => e.program_id))
  const otherPrograms = programList.filter((p) => !enrolledProgramIds.has(p.id))

  const enrolledPrograms = programList.filter((p) => enrolledProgramIds.has(p.id))

  const handleProgramClick = (program: Program) => {
    setSelectedProgram(program)
    setIsProgramDetailsOpen(true)
  }

  const handleClosePanel = () => {
    setIsProgramDetailsOpen(false)
    setSelectedProgram(undefined)
  }

  return (
    <div className="flex flex-col h-full gap-6 p-6 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Траектория обучения</h1>
        <p className="text-muted-foreground mt-2">
          Персональные рекомендации и планирование вашего обучения
        </p>
      </div>

      <div className="space-y-6 flex-1 overflow-auto">
        {/* Current Enrollments */}
        {enrolledPrograms.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Текущее обучение</h2>
              <Badge variant="secondary">{enrolledPrograms.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledPrograms.map((program) => (
                <Card key={program.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                          {program.title}
                        </h3>
                        {program.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {program.description}
                          </p>
                        )}
                      </div>
                      <Award className="h-6 w-6 text-primary/40 shrink-0" />
                    </div>
                    <Button
                      onClick={() => handleProgramClick(program)}
                      className="w-full mt-4 gap-2"
                      variant="outline"
                    >
                      Подробнее
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Teacher Recommendations */}
        {recommendationList.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-[#FF9935]" />
              <h2 className="text-xl font-bold text-foreground">Рекомендации от преподавателя</h2>
              <Badge variant="outline" className="bg-[#FF9935]/10 text-[#FF9935] border-[#FF9935]/20">
                {recommendationList.length} новых
              </Badge>
            </div>
            <div className="space-y-3">
              {recommendationList.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onViewProgram={() => {
                    const prog = programList.find((p) => p.id === rec.program_id)
                    if (prog) handleProgramClick(prog)
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Programs */}
        {otherPrograms.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Доступные программы</h2>
              <Badge variant="secondary">{otherPrograms.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherPrograms.map((program) => (
                <Card key={program.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                          {program.title}
                        </h3>
                        {program.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {program.description}
                          </p>
                        )}
                      </div>
                      <BookOpen className="h-6 w-6 text-primary/40 shrink-0" />
                    </div>
                    <Button
                      onClick={() => handleProgramClick(program)}
                      className="w-full mt-4 gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Подробнее
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {recommendationList.length === 0 && enrolledPrograms.length === 0 && otherPrograms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold text-foreground text-lg">Нет активных рекомендаций</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Проверьте позже или свяжитесь с преподавателем для получения рекомендаций
            </p>
          </div>
        )}
      </div>

      {/* Program Details Panel */}
      <RightPanel
        isOpen={isProgramDetailsOpen && !!selectedProgram}
        onClose={handleClosePanel}
        title={selectedProgram?.title || ""}
        description="Подробная информация"
        width="md"
      >
        {selectedProgram && (
          <div className="space-y-6">
            {selectedProgram.description && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Описание программы</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedProgram.description}
                </p>
              </div>
            )}

            {selectedProgram.status && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Статус:</span>
                <Badge variant="outline">{selectedProgram.status}</Badge>
              </div>
            )}

            <div className="border-t border-border pt-4 flex gap-3">
              <Button
                onClick={handleClosePanel}
                variant="outline"
                className="flex-1"
              >
                Закрыть
              </Button>
              <Button
                className="flex-1"
              >
                Подробнее
              </Button>
            </div>
          </div>
        )}
      </RightPanel>
    </div>
  )
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

interface RecommendationCardProps {
  recommendation: TeacherRecommendation
  onViewProgram: () => void
}

function RecommendationCard({ recommendation, onViewProgram }: RecommendationCardProps) {
  return (
    <Card className="border-[#FF9935]/20 bg-gradient-to-r from-[#FF9935]/5 to-transparent hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-[#FF9935]/90 hover:bg-[#FF9935]">Рекомендация</Badge>
            </div>
            <h3 className="font-bold text-base text-foreground">{recommendation.program_title}</h3>
            {recommendation.program_description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {recommendation.program_description}
              </p>
            )}
            {recommendation.comment && (
              <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-muted-foreground italic">
                  "{recommendation.comment}"
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              От: {recommendation.teacher_name}
            </p>
          </div>
          <MessageSquare className="h-6 w-6 text-[#FF9935]/40 shrink-0" />
        </div>

        <Button
          onClick={onViewProgram}
          size="sm"
          variant="outline"
          className="w-full gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          Посмотреть программу
        </Button>
      </CardContent>
    </Card>
  )
}
