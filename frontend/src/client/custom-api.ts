import axios from "axios"

import type {
  Achievement,
  AchievementsResponse,
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

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const api = axios.create({
  baseURL: "/api/v1",
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

// ─── Modules ──────────────────────────────────────────────────────────────────

export async function getModules(programId?: string): Promise<ModulesResponse> {
  const params = programId ? { program_id: programId } : {}
  const { data } = await api.get<ModulesResponse>("/modules/", { params })
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

export async function getEnrollments(studentId?: string): Promise<EnrollmentsResponse> {
  const params = studentId ? { student_id: studentId } : {}
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

export async function updateAdmissionRequestStatus(
  id: string,
  status: string,
): Promise<AdmissionRequest> {
  const { data } = await api.patch<AdmissionRequest>(`/admission-requests/${id}`, { status })
  return data
}
