// Custom types for the education platform API

// ─── Programs ─────────────────────────────────────────────────────────────────

export type Program = {
  id: string
  title: string
  description?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ProgramsResponse = {
  data: Program[]
  count: number
}

export type ProgramCreate = {
  title: string
  description?: string | null
  status?: string | null
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export type ModuleType = "theoretical" | "practical" | "test"

export type Module = {
  id: string
  title: string
  description?: string | null
  program_id: string
  position?: number | null
  module_type?: ModuleType | null
  content?: string | null
  created_at?: string | null
}

export type ModulesResponse = {
  data: Module[]
  count: number
}

export type ModuleCreate = {
  title: string
  description?: string | null
  program_id: string
  position?: number | null
  module_type?: ModuleType | null
  content?: string | null
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

export type Lesson = {
  id: string
  title: string
  description?: string | null
  scheduled_at: string
  duration_minutes: number
  location?: string | null
  group_id: string
  series_id?: string | null
  created_at?: string | null
}

export type LessonsResponse = {
  data: Lesson[]
  count: number
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export type Group = {
  id: string
  name: string
  program_id: string
  program_title?: string | null
  teacher_id?: string | null
  status?: string | null
  start_date?: string | null
  end_date?: string | null
  created_at?: string | null
  program?: Program | null
  teacher_name?: string | null
  student_count?: number | null
}

export type GroupsResponse = {
  data: Group[]
  count: number
}

export type GroupCreate = {
  name: string
  program_id: string
  teacher_id?: string | null
  status?: string | null
  start_date?: string | null
  end_date?: string | null
}

// ─── Enrollments ──────────────────────────────────────────────────────────────

export type Enrollment = {
  id: string
  student_id: string
  group_id: string
  program_id?: string | null
  program_title?: string | null
  group_name?: string | null
  status?: string | null
  enrolled_at?: string | null
  group?: Group | null
  student_name?: string | null
  student_email?: string | null
}

export type EnrollmentsResponse = {
  data: Enrollment[]
  count: number
}

export type EnrollmentCreate = {
  student_id: string
  group_id: string
  status?: string | null
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export type Progress = {
  id: string
  student_id: string
  module_id: string
  status?: string | null
  completed_at?: string | null
  module?: Module | null
}

export type ProgressesResponse = {
  data: Progress[]
  count: number
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type StudentProgramProgress = {
  total_modules: number
  completed_modules: number
  percentage: number
  student_id: string
  program_id: string
}

export type GroupStudentProgress = {
  student_id: string
  total_modules: number
  completed_modules: number
  percentage: number
  full_name?: string | null
  email?: string | null
}

export type GroupProgress = {
  group_id: string
  program_id: string
  students: GroupStudentProgress[]
}

// ─── Trajectory ───────────────────────────────────────────────────────────────

export type TrajectoryRecommendation = {
  module_id: string
  title: string
  position: number
  action: "Начать" | "Продолжить" | "Повторить" | string
}

export type Trajectory = {
  status: "not_started" | "in_progress" | "completed" | string
  percentage: number
  recommendations: TrajectoryRecommendation[]
  program_id?: string
  student_id?: string
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export type Achievement = {
  id: string
  title: string
  description?: string | null
  points_required?: number | null
  icon?: string | null
  created_at?: string | null
}

export type AchievementsResponse = {
  data: Achievement[]
  count: number
}

export type UserPoints = {
  user_id: string
  points: number
}

export type UserAchievementsResponse = {
  data: Achievement[]
  count: number
}

export type LeaderboardEntry = {
  student_id: string
  full_name?: string | null
  email?: string | null
  points: number
  rank: number
}

export type Leaderboard = {
  group_id: string
  entries: LeaderboardEntry[]
}

// ─── Admission Requests ───────────────────────────────────────────────────────

export type AdmissionRequest = {
  id: string
  full_name: string
  email?: string | null
  phone_number: string
  program_interest?: string | null
  comment?: string | null
  source: string
  status: "new" | "in_review" | "approved" | "rejected" | string
  assigned_to_id?: string | null
  assigned_to_name?: string | null
  created_at?: string | null
  updated_at?: string | null
  notes?: string | null
}

export type AdmissionRequestsResponse = {
  data: AdmissionRequest[]
  count: number
}
