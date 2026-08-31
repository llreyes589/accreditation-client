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

export interface PlacesResult {
  label: string
  lat: number | null
  lon: number | null
  raw: Record<string, unknown>
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
  region?: string | null
  province?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
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
  type:
    | "license" | "permit" | "accreditation" | "other"
    | "lto_clinical_lab" | "lto_bsf" | "chairman_designation" | "psp_certificate"
    | "floor_plan" | "org_chart" | "rotation_schedule" | "conference_schedule" | "activity_schedule"
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
  expected_completion_date: string | null
  age_at_enrollment: number | null
  year_level: number | null
  promotion_status: "eligible" | "ineligible" | null
  promotion_evaluated_at: string | null
  completion_reviewed_at: string | null
  period_completed_at: string | null
  user?: User
  institution?: Institution
  transfers?: ResidentTransfer[]
}

/** Aggregated resident training portfolio (flowchart J/K/L/S hub). */
export interface ResidentPortfolio {
  resident: Resident & { user: User }
  case_logs: CaseLog[]
  quiz_results: (QuizResult & { quiz?: Quiz })[]
  consultant_evaluations: ConsultantEvaluation[]
  research_papers: ResearchPaper[]
  remediation_plans: RemediationPlan[]
  portfolio_archives: PortfolioArchive[]
  consultant_reviews: ConsultantReview[]
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
  type: "quiz" | "exam" | "rise"
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
  created_at?: string
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

export interface InspectionChecklistItem {
  id: number
  section: string
  code: string | null
  criterion: string
  is_major: boolean
  notes_hint: string | null
  sort_order: number
}

export interface AccreditationInspection {
  id: number
  accreditation_id: number
  accreditor_id: number | null
  inspection_scheduled_at: string | null
  conducted_at: string | null
  status: "pending" | "submitted"
  answers: Record<string, { compliant: boolean; notes?: string }> | null
  accreditors?: InspectionAccreditor[]
  accreditor?: { id: number; name: string } | null
}

export interface InspectionAccreditor {
  id: number
  name: string
  email: string
  pivot: {
    role: "lead" | "member"
    status: "invited" | "accepted" | "declined" | "removed"
  }
}

export interface Accreditation {
  id: number
  institution_id: number
  checklist_snapshot: ChecklistItem[]
  approved_by: number | null
  valid_from: string | null
  valid_until: string | null
  track?: "AP" | "CP" | "APCP" | null
  status: "pending" | "requirements_completed" | "inspection_scheduled" | "inspected" | "deliberation" | "approved" | "probationary" | "rejected"
  submission_type?: "new" | "renew" | null
  inspection_scheduled_at?: string | null
  submitted_at?: string | null
  institution?: Institution
  decisions?: AccreditationDecision[]
  inspections?: AccreditationInspection[]
}

export interface AccreditationDecision {
  id: number
  accreditation_id: number
  outcome: "draft" | "approved" | "probationary" | "rejected"
  recommendation?: "3_years" | "3_years_conditional" | "1_year" | null
  vote_count?: number | null
  notes: string | null
  valid_from: string | null
  valid_until: string | null
  decided_by: number | null
  decided_at: string
  decider?: User | null
}

/** The 9 supporting documents required to apply for/renew accreditation. */
export const ACCREDITATION_DOC_TYPES: { value: string; label: string }[] = [
  { value: "lto_clinical_lab", label: "LTO Clinical Lab" },
  { value: "lto_bsf", label: "LTO BSF" },
  { value: "chairman_designation", label: "Designation of Chairman" },
  { value: "psp_certificate", label: "PSP certificate as Fellow consistent with specialty" },
  { value: "floor_plan", label: "Floor plan" },
  { value: "org_chart", label: "Org chart" },
  { value: "rotation_schedule", label: "Rotation per month, annual" },
  { value: "conference_schedule", label: "Conference schedule" },
  { value: "activity_schedule", label: "Activity schedule" },
]

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
  status: "pending" | "accepted" | "denied"
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

export interface NotificationPreference {
  id: number
  user_id: number
  category: "deadline_reminder" | "status_change" | "system"
  channel: "database" | "email" | "in_app"
  enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
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

/* ---- Resident flowchart: remaining stages (G/H/I, M, N/O, U) ---- */

export interface ConsultantReview {
  id: number
  rotation_assignment_id: number
  consultant_id: number | null
  status: "validated" | "returned"
  comments: string | null
  consultant?: Consultant | null
  assignment?: RotationAssignment & { rotationBlock?: { title: string | null } | null }
}

export interface ConsultantEvaluation {
  id: number
  resident_id: number
  consultant_id: number | null
  period: string
  ratings: Record<string, number> | null
  comments: string | null
  recommendation: "continue" | "remediate" | null
  evaluated_at: string | null
  resident?: Resident
  consultant?: Consultant | null
}

export interface RemediationPlan {
  id: number
  resident_id: number
  reason: string
  plan: string
  status: "open" | "in_progress" | "completed" | "closed"
  target_date: string | null
  resident?: Resident
}

export interface PortfolioArchive {
  id: number
  resident_id: number
  summary: string | null
  status: "submitted" | "archived" | "sealed"
  archived_at: string | null
  resident?: Resident
}

/* ---- Findings & Corrective Actions module ---- */

export interface Finding {
  id: number
  accreditation_inspection_id: number
  checklist_item_id: number | null
  title: string
  description: string
  severity: "major" | "minor"
  status: "open" | "in_progress" | "resolved" | "verified" | "rejected"
  raised_by: number | null
  created_at: string
  checklist_item?: InspectionChecklistItem | null
  raised_by_user?: User | null
  actions?: CorrectiveAction[]
}

export interface CorrectiveAction {
  id: number
  finding_id: number
  action_plan: string
  due_date: string | null
  status: "open" | "in_progress" | "resolved" | "verified" | "reopened"
  assigned_to: number | null
  created_by: number | null
  created_at: string
  evidence?: CorrectiveActionEvidence[]
  status_logs?: CorrectiveActionStatusLog[]
  finding?: Finding
}

export interface CorrectiveActionEvidence {
  id: number
  corrective_action_id: number
  file_path: string
  original_name: string | null
  uploaded_by: number | null
}

export interface CorrectiveActionStatusLog {
  id: number
  corrective_action_id: number
  status: string
  comment: string | null
  actor_id: number | null
  logged_at: string
}

export const roleLabel = (r?: RoleName | string | null) =>
  r === "TrainingOfficer" ? "Training Officer" : (r ?? "—")

/* ---- Kanban board (GET /kanban, /staff/kanban) ---- */

export interface KanbanApplication {
  id: string
  applicantName: string
  institution: string
  program: string
  enteredStageAt?: string | null
  note?: string | null
  /** Backend accreditation status — drives the card action buttons. */
  status?:
    | "pending"
    | "requirements_completed"
    | "inspection_scheduled"
    | "inspected"
    | "approved"
    | "probationary"
    | "rejected"
    | null
  submissionType?: "new" | "renew" | null
  inspectionScheduledAt?: string | null
}

export interface KanbanColumnDTO {
  stage: { id: string; title: string; description: string }
  applications: KanbanApplication[]
}

export interface KanbanBoardDTO {
  stages: { id: string; title: string; description: string }[]
  columns: KanbanColumnDTO[]
  total: number
}
