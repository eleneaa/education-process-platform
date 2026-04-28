import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BookOpen, MessageSquare, Trophy, Award, ArrowRight, Send } from "lucide-react"
import { useState } from "react"

import { getEnrollments, getStudentRecommendations, getPrograms, createAdmissionRequest, getAdmissionRequests } from "@/client/custom-api"
import type { TeacherRecommendation, Program } from "@/client/custom-types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Badge } from "@/components/ui/badge"
import { RightPanel } from "@/components/RightPanel"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/trajectory")({
  component: TrajectoryPage,
  head: () => ({
    meta: [{ title: "Траектория обучения" }],
  }),
})

function TrajectoryPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [selectedProgram, setSelectedProgram] = useState<Program | undefined>()
  const [isProgramDetailsOpen, setIsProgramDetailsOpen] = useState(false)
  const [showAllPrograms, setShowAllPrograms] = useState(false)

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

  const { data: admissionRequests } = useQuery({
    queryKey: ["admissionRequests"],
    queryFn: () => getAdmissionRequests(),
    placeholderData: { data: [], count: 0 },
  })

  const requestMutation = useMutation({
    mutationFn: async (programTitle: string) => {
      if (!user?.email) throw new Error("User email not found")
      return createAdmissionRequest({
        full_name: user.full_name || "Студент",
        email: user.email,
        phone_number: "+7 (999) 999-99-99",
        program_interest: programTitle,
        comment: "Запрос на зачисление через траекторию обучения",
        source: "website",
      })
    },
    onSuccess: () => {
      showSuccessToast("Заявка отправлена! Администратор свяжется с вами")
      queryClient.invalidateQueries({ queryKey: ["admissionRequests"] })
      setIsProgramDetailsOpen(false)
      setSelectedProgram(undefined)
    },
    onError: () => {
      showErrorToast("Не удалось отправить заявку")
    },
  })

  const enrollmentList = enrollments?.data ?? []
  const recommendationList = recommendations ?? []
  const programList = programs?.data ?? []

  // Программы которых нет в записях
  const enrolledProgramIds = new Set(enrollmentList.map((e) => e.program_id))
  const otherPrograms = programList.filter((p) => !enrolledProgramIds.has(p.id))

  const enrolledPrograms = programList.filter((p) => enrolledProgramIds.has(p.id))

  // Показываем первые 4 программы по умолчанию
  const visiblePrograms = showAllPrograms ? otherPrograms : otherPrograms.slice(0, 4)

  const handleProgramClick = (program: Program) => {
    setSelectedProgram(program)
    setIsProgramDetailsOpen(true)
  }

  const handleClosePanel = () => {
    setIsProgramDetailsOpen(false)
    setSelectedProgram(undefined)
  }

  const handleRequestEnroll = () => {
    if (!selectedProgram?.title) return
    requestMutation.mutate(selectedProgram.title)
  }

  const hasExistingRequest = (programTitle: string) => {
    const requests = admissionRequests?.data ?? []
    return requests.some(
      (req) => req.program_interest?.toLowerCase() === programTitle.toLowerCase() &&
               req.email === user?.email &&
               req.status !== "rejected"
    )
  }

  return (
    <div className="flex flex-col h-full gap-8">
      {/* Header */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 p-8">
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Траектория обучения
        </h1>
        <p className="text-muted-foreground mt-3">
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
                <Card key={program.id} className="group overflow-hidden rounded-2xl backdrop-blur-xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
                    <Link to={"/my-programs" as any} className="block">
                      <Button className="w-full mt-4 gap-2" variant="outline">
                        Перейти в программу
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
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
              {visiblePrograms.map((program) => (
                <Card key={program.id} className="group overflow-hidden rounded-2xl backdrop-blur-xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
                      variant="outline"
                    >
                      <Send className="h-4 w-4" />
                      Запросить зачисление
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {!showAllPrograms && otherPrograms.length > 4 && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setShowAllPrograms(true)}
                  variant="outline"
                  className="gap-2"
                >
                  Показать ещё ({otherPrograms.length - 4})
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
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
        description="Запросить зачисление на программу"
        width="md"
      >
        {selectedProgram && (
          <div className="space-y-6">
            {selectedProgram.description && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">О программе</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedProgram.description}
                </p>
              </div>
            )}

            {selectedProgram.status && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Статус:</span>
                <Badge variant={selectedProgram.status === "approved" ? "default" : "outline"}>
                  {selectedProgram.status === "approved" ? "Активна" : selectedProgram.status}
                </Badge>
              </div>
            )}

            {selectedProgram && hasExistingRequest(selectedProgram.title) ? (
              <div className="border-t border-border pt-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
                  <p className="text-sm font-medium text-primary">
                    ✓ Заявка уже отправлена
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Администратор рассмотрит вашу заявку в ближайшее время
                  </p>
                </div>
                <Button
                  onClick={handleClosePanel}
                  variant="outline"
                  className="w-full mt-3"
                >
                  Закрыть
                </Button>
              </div>
            ) : (
              <div className="border-t border-border pt-4 flex gap-3">
                <Button
                  onClick={handleClosePanel}
                  variant="outline"
                  className="flex-1"
                >
                  Отмена
                </Button>
                <LoadingButton
                  onClick={handleRequestEnroll}
                  loading={requestMutation.isPending}
                  className="flex-1 gap-2"
                >
                  <Send className="h-4 w-4" />
                  Отправить заявку
                </LoadingButton>
              </div>
            )}
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
