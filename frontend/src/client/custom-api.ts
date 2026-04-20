import axios from "axios"

import type {
  Achievement,
  AchievementsResponse,
  Progress,
  Lesson,
  LessonsResponse,
  AdmissionRequest,
  AdmissionRequestsResponse,
  EnrollmentsResponse,
  GroupProgress,
  GroupsResponse,
  Leaderboard,
  ModulesResponse,
  ProgressesResponse,
  ProgramCreate,
  ProgramsResponse,
  StudentProgramProgress,
  Trajectory,
  UserAchievementsResponse,
  UserPoints,
} from "./custom-types"
import type { UsersPublic } from "./types.gen"

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<ProgramsResponse> {
  const { data } = await api.get<ProgramsResponse>("/programs/")
  return data
}

export async function createProgram(body: ProgramCreate) {
  const { data } = await api.post("/programs/", body)
  return data
}

export async function updateProgram(id: string, body: Partial<ProgramCreate>) {
  const { data } = await api.patch(`/programs/${id}`, body)
  return data
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export async function getModules(programId?: string): Promise<ModulesResponse> {
  const params = programId ? { program_id: programId } : {}
  const { data } = await api.get<ModulesResponse>("/modules/", { params })
  return data
}

export async function createModule(body: {
  title: string
  description?: string | null
  program_id: string
  position?: number | null
  module_type?: string | null
  content?: string | null
}) {
  const { data } = await api.post("/modules/", body)
  return data
}

export async function updateModule(id: string, body: {
  title?: string
  description?: string | null
  position?: number | null
  module_type?: string | null
  content?: string | null
}) {
  const { data } = await api.patch(`/modules/${id}`, body)
  return data
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(limit = 200): Promise<UsersPublic> {
  const { data } = await api.get<UsersPublic>("/users/", { params: { limit } })
  return data
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function getGroups(): Promise<GroupsResponse> {
  const { data } = await api.get<GroupsResponse>("/groups/")
  return data
}

export async function createGroup(body: {
  name: string
  program_id: string
  teacher_id?: string
  status?: string
  start_date?: string
  end_date?: string
}) {
  const { data } = await api.post("/groups/", body)
  return data
}

// ─── Enrollments ──────────────────────────────────────────────────────────────

export async function getEnrollments(studentId?: string, groupId?: string): Promise<EnrollmentsResponse> {
  const params: Record<string, string> = {}
  if (studentId) params.student_id = studentId
  if (groupId) params.group_id = groupId
  const { data } = await api.get<EnrollmentsResponse>("/enrollments/", { params })
  return data
}

export async function createEnrollment(body: {
  student_id: string
  group_id: string
  status?: string
}) {
  const { data } = await api.post("/enrollments/", body)
  return data
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function getProgresses(studentId?: string): Promise<ProgressesResponse> {
  const params = studentId ? { student_id: studentId } : {}
  const { data } = await api.get<ProgressesResponse>("/progresses/", { params })
  return data
}

export async function createProgress(body: {
  student_id: string
  module_id: string
  status: "not_started" | "in_progress" | "completed"
  score?: number | null
}): Promise<Progress> {
  const { data } = await api.post<Progress>("/progresses/", body)
  return data
}

export async function updateProgress(id: string, body: {
  status?: "not_started" | "in_progress" | "completed"
  score?: number | null
}): Promise<Progress> {
  const { data } = await api.patch<Progress>(`/progresses/${id}`, body)
  return data
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getStudentProgramProgress(
  programId: string,
  studentId: string,
): Promise<StudentProgramProgress> {
  const { data } = await api.get<StudentProgramProgress>(
    `/analytics/programs/${programId}/students/${studentId}/progress`,
  )
  return data
}

export async function getGroupProgress(groupId: string): Promise<GroupProgress> {
  const { data } = await api.get<GroupProgress>(`/analytics/groups/${groupId}/progress`)
  return data
}

// ─── Trajectory ───────────────────────────────────────────────────────────────

export async function getStudentTrajectory(
  programId: string,
  studentId: string,
): Promise<Trajectory> {
  const { data } = await api.get<Trajectory>(
    `/trajectory/programs/${programId}/students/${studentId}`,
  )
  return data
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export async function getAllAchievements(): Promise<AchievementsResponse> {
  const { data } = await api.get<AchievementsResponse>("/gamification/achievements")
  return data
}

export async function createAchievement(body: {
  title: string; description?: string | null; points_required: number; icon?: string | null
}): Promise<Achievement> {
  const { data } = await api.post<Achievement>("/gamification/achievements", body)
  return data
}

export async function updateAchievement(id: string, body: {
  title?: string; description?: string | null; points_required?: number; icon?: string | null
}): Promise<Achievement> {
  const { data } = await api.patch<Achievement>(`/gamification/achievements/${id}`, body)
  return data
}

export async function deleteAchievement(id: string): Promise<void> {
  await api.delete(`/gamification/achievements/${id}`)
}

export async function getUserPoints(userId: string): Promise<UserPoints> {
  const { data } = await api.get<UserPoints>(`/gamification/users/${userId}/points`)
  return data
}

export async function getUserAchievements(userId: string): Promise<UserAchievementsResponse> {
  const { data } = await api.get<UserAchievementsResponse>(
    `/gamification/users/${userId}/achievements`,
  )
  return data
}

export async function getGroupLeaderboard(groupId: string): Promise<Leaderboard> {
  const { data } = await api.get<Leaderboard>(`/gamification/groups/${groupId}/leaderboard`)
  return data
}

// ─── Admission Requests ───────────────────────────────────────────────────────

export async function getAdmissionRequests(
  status?: string,
): Promise<AdmissionRequestsResponse> {
  const params = status ? { status } : {}
  const { data } = await api.get<AdmissionRequestsResponse>("/admission-requests/", { params })
  return data
}

export async function createAdmissionRequest(body: {
  full_name: string
  email?: string | null
  phone_number: string
  program_interest?: string | null
  comment?: string | null
  source: string
}): Promise<AdmissionRequest> {
  const { data } = await api.post<AdmissionRequest>("/admission-requests/", body)
  return data
}

export async function updateAdmissionRequest(
  id: string,
  body: { status?: string; assigned_to_id?: string | null },
): Promise<AdmissionRequest> {
  const { data } = await api.patch<AdmissionRequest>(`/admission-requests/${id}`, body)
  return data
}

export async function updateAdmissionRequestStatus(
  id: string,
  status: string,
): Promise<AdmissionRequest> {
  const { data } = await api.patch<AdmissionRequest>(`/admission-requests/${id}`, { status })
  return data
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export async function getLessons(groupId?: string): Promise<LessonsResponse> {
  const params = groupId ? { group_id: groupId } : {}
  const { data } = await api.get<LessonsResponse>("/lessons/", { params })
  return data
}

export async function createLesson(body: {
  title: string
  description?: string | null
  scheduled_at: string
  duration_minutes?: number
  location?: string | null
  group_id: string
}): Promise<Lesson> {
  const { data } = await api.post<Lesson>("/lessons/", body)
  return data
}

export async function updateLesson(id: string, body: {
  title?: string
  description?: string | null
  scheduled_at?: string
  duration_minutes?: number
  location?: string | null
}): Promise<Lesson> {
  const { data } = await api.patch<Lesson>(`/lessons/${id}`, body)
  return data
}

export async function deleteLesson(id: string): Promise<void> {
  await api.delete(`/lessons/${id}`)
}

export async function createRecurringLessons(body: {
  title: string
  description?: string | null
  group_id: string
  first_date: string
  time: string
  duration_minutes?: number
  location?: string | null
  frequency: "weekly" | "biweekly"
  count: number
}): Promise<LessonsResponse> {
  const { data } = await api.post<LessonsResponse>("/lessons/recurring", body)
  return data
}

// ─── Delete functions ─────────────────────────────────────────────────────────

export async function deleteProgram(id: string): Promise<void> {
  await api.delete(`/programs/${id}`)
}

export async function deleteModule(id: string): Promise<void> {
  await api.delete(`/modules/${id}`)
}

export async function deleteGroup(id: string): Promise<void> {
  await api.delete(`/groups/${id}`)
}

export async function deleteEnrollment(id: string): Promise<void> {
  await api.delete(`/enrollments/${id}`)
}
