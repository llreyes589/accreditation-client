/**
 * Types mirrored from the Laravel 8 backend
 * (app/Models + Api/v1 controllers).
 */

export type Track = "AP" | "CP" | "AP_CP"
export type UserStatus = "pending" | "approved" | "rejected"
export type RegistrationStatus = "pending" | "approved" | "rejected"
export type RoleName = "Admin" | "Accreditor" | "TrainingInstitution" | "TrainingOfficer" | "Resident"

export interface Role {
  id: number
  name: RoleName
}

export interface Institution {
  id: number
  name: string
  address: string | null
  hospital_level: string | null
  laboratory_level?: string | null
  bsf_category?: string | null
  director?: string | null
  chairman?: string | null
  contact_number?: string | null
  email?: string | null
  year_program_opened?: number | null
  user_id?: number | null
  registration_status?: RegistrationStatus
  approved_at?: string | null
  approved_by?: number | null
  rejection_reason?: string | null
  documents?: InstitutionDocument[]
}

export interface InstitutionDocument {
  id: number
  institution_id: number
  type: "license" | "permit" | "accreditation" | "other"
  file_path: string
  expires_at: string | null
  created_at?: string
}

export interface TrainingOfficer {
  id: number
  user_id: number
  institution_id: number
  phone: string | null
  telegram_handle: string | null
  user?: User
  institution?: Institution
}

export interface Resident {
  id: number
  user_id: number
  institution_id: number
  track: Track
  date_accepted: string | null
  age_at_enrollment: number | null
  year_level: number | null
  promotion_status: "eligible" | "ineligible" | null
  promotion_evaluated_at: string | null
  user?: User
  institution?: Institution
  transfers?: ResidentTransfer[]
}

export interface User {
  id: number
  name: string
  username: string | null
  email: string
  status: UserStatus
  email_verified_at: string | null
  rejection_reason?: string | null
  roles?: Role[]
  training_officer?: TrainingOfficer | null
  resident?: Resident | null
  trainingOfficer?: TrainingOfficer | null
}

export interface Consultant {
  id: number
  institution_id: number
  name: string
  specialty: Track
  credentials: string | null
  linked_documents: string[] | null
  documents?: ConsultantDocument[]
}

export interface ConsultantDocument {
  id: number
  consultant_id: number
  type: "license" | "contract"
  file_path: string
  expires_at: string | null
}

export interface Quiz {
  id: number
  institution_id: number
  title: string
  type: "quiz" | "exam"
  max_score: number
  created_by: number
  results?: QuizResult[]
}

export interface QuizResult {
  id: number
  quiz_id: number
  resident_id: number
  score: number
  taken_at: string | null
}

export interface ResearchPaper {
  id: number
  resident_id: number
  title: string
  stage: string
  notes: string | null
}

export interface CaseLog {
  id: number
  resident_id: number
  case_type: string
  procedure: string | null
  count: number
  logged_at: string | null
}

/** One checklist row as the backend stores it. */
export interface ChecklistItem {
  label: string
  done: boolean
}

export interface Accreditation {
  id: number
  institution_id: number
  checklist_snapshot: ChecklistItem[]
  approved_by: number | null
  valid_from: string | null
  valid_until: string | null
  status: "pending" | "approved" | "rejected"
  institution?: Institution
}

export interface RotationAssignment {
  id: number
  rotation_block_id: number
  resident_id: number
  status: "assigned" | "completed"
  grade: number | null
  resident?: Resident
}

export interface RotationBlock {
  id: number
  institution_id: number
  consultant_id: number | null
  title: string
  category: string
  starts_at: string
  ends_at: string
  notes: string | null
  consultant?: Consultant | null
  assignments?: RotationAssignment[]
}

export interface ResidentTransfer {
  id: number
  resident_id: number
  from_institution_id: number
  to_institution_id: number
  reason: string | null
  status: "pending" | "accepted" | "rejected"
  requested_by: number
  decided_by: number | null
  decided_at: string | null
  resident?: Resident
  destination?: Institution
}

export interface Setting {
  id: number
  key: string
  value: unknown
}

export interface AppNotification {
  id: string
  type: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/* ---- Response envelopes ---- */

export interface LoginResponse {
  user: User
  token: string
}

export interface PendingApproval {
  status: UserStatus
  email_verified: boolean
}

export interface AdminPending {
  users: User[]
  institutions: Institution[]
  accreditations: Accreditation[]
}

export interface DashboardMetrics {
  residents_by_track: Record<string, number>
  residents_by_year_level: Record<string, number>
  promotion_statuses: Record<string, number>
  case_total: number
  cases_by_type: Record<string, number>
  assessment_averages: Record<string, number>
  rotation_assignments: Record<string, number>
  expired_consultant_documents: number
  expiring_consultant_documents: number
}

export interface DashboardResponse {
  institution: Institution
  documents: InstitutionDocument[]
  expired_documents: number
  accreditations: Accreditation[]
  unread_notifications: number
  metrics: DashboardMetrics
}

/* ---- Display helpers ---- */

export const trackLabel = (t?: Track | string | null) =>
  t === "AP_CP" ? "AP/CP" : (t ?? "—")

export const statusLabel = (s?: string | null) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "—"

export const roleLabel = (r?: RoleName | string | null) =>
  r === "TrainingOfficer" ? "Training Officer" : (r ?? "—")
