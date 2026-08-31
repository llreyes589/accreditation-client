import { api, apiBlob } from "./client";
import type {
  AdminPending,
  Accreditation,
  AccreditationInspection,
  AppNotification,
  CaseLog,
  ChecklistItem,
  Consultant,
  ConsultantDocument,
  ConsultantReview,
  ConsultantEvaluation,
  RemediationPlan,
  PortfolioArchive,
  Finding,
  CorrectiveAction,
  CorrectiveActionEvidence,
  AccreditationDecision,
  DashboardResponse,
  Institution,
  InstitutionDocument,
  InspectionChecklistItem,
  LoginResponse,
  NotificationPreference,
  Paginated,
  PendingApproval,
  PlacesResult,
  Quiz,
  QuizResult,
  ResearchPaper,
  Resident,
  ResidentPortfolio,
  ResidentTransfer,
  RotationAssignment,
  RotationBlock,
  Setting,
  Track,
  User,
  KanbanBoardDTO,
} from "./types";

/* =========================================================
   PUBLIC  (routes/api.php — unauthenticated)
   ========================================================= */

export const listPublicInstitutions = () => api<Institution[]>("/institutions");

export const registerInstitution = (payload: {
  institution: {
    name: string;
    address?: string;
    hospital_level?: string;
    laboratory_level?: string;
    bsf_category?: string;
    director?: string;
    chairman?: string;
    contact_number?: string;
    email?: string;
    year_program_opened?: number;
    region?: string;
    province?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  telegram_handle?: string;
}) =>
  api<{ message: string; user: User }>("/register/institution", {
    body: payload,
  });

export const getInstitutionProfile = () =>
  api<Institution>("/institution-profile");

export const updateInstitutionProfile = (payload: {
  name: string;
  address?: string;
  hospital_level?: string;
  laboratory_level?: string;
  bsf_category?: string;
  director?: string;
  chairman?: string;
  contact_number?: string;
  email?: string;
  year_program_opened?: number;
  region?: string;
  province?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}) =>
  api<Institution>("/institution-profile", { method: "PUT", body: payload });

export const searchPlaces = (q: string) =>
  api<PlacesResult[]>("/places/search?q=" + encodeURIComponent(q));

export const registerResident = (payload: {
  institution_id: number;
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  track: Track;
  date_accepted?: string;
  age_at_enrollment?: number;
}) =>
  api<{ message: string; user: User }>("/register/resident", { body: payload });

export const login = (username: string, password: string) =>
  api<LoginResponse>("/login", { body: { username, password } });

/* =========================================================
   AUTHENTICATED (auth:sanctum)
   ========================================================= */

export const logout = () =>
  api<{ message: string }>("/logout", { method: "POST" });

export const pendingApproval = () => api<PendingApproval>("/pending-approval");

export const verificationNotice = () =>
  api<unknown>("/email/verification-notification");

export const resendVerification = () =>
  api<unknown>("/email/verification-notification", { method: "POST" });

/* ---- verified + approved ---- */

export const me = () => api<User>("/me");

/** role:TrainingOfficer|Resident */
export const dashboard = () => api<DashboardResponse>("/dashboard");

export const notifications = () =>
  api<Paginated<AppNotification>>("/notifications");

export const readNotification = (id: string) =>
  api<AppNotification>(`/notifications/${id}/read`, { method: "POST" });

export const notificationPreferences = () =>
  api<NotificationPreference[]>("/notification-preferences");

export const updateNotificationPreferences = (
  preferences: Array<{
    category: NotificationPreference["category"];
    channel: NotificationPreference["channel"];
    enabled?: boolean;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
  }>,
) =>
  api<NotificationPreference[]>("/notification-preferences", {
    method: "PUT",
    body: { preferences },
  });

/* Reports (CSV streamed download) */
type ReportFilters = {
  institution_id?: number;
  date_from?: string;
  date_to?: string;
  status?: string;
  outcome?: string;
  severity?: string;
};

export const downloadReport = (
  kind: "accreditations" | "renewals" | "findings" | "inspections",
  filters: ReportFilters = {},
) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const qs = params.toString();
  return apiBlob(`/reports/${kind}${qs ? `?${qs}` : ""}`);
};

/* =========================================================
   KANBAN BOARD  (role: TrainingOfficer|TrainingInstitution|Admin|Accreditor)
   ========================================================= */

export const getKanbanBoard = (staff = false) =>
  api<KanbanBoardDTO>(staff ? "/staff/kanban" : "/kanban");

/* Institution documents */
export const listDocuments = () => api<InstitutionDocument[]>("/documents");

export const uploadDocument = (
  type: InstitutionDocument["type"],
  file: File,
) => {
  const form = new FormData();
  form.append("type", type);
  form.append("file", file);
  return api<InstitutionDocument>("/documents", { form });
};

/* Consultants */
export const listConsultants = () => api<Consultant[]>("/consultants");

export const createConsultant = (payload: {
  name: string;
  specialty: Track;
  credentials?: string;
  linked_documents?: string[];
}) => api<Consultant>("/consultants", { body: payload });

export const listConsultantDocuments = (consultantId: number) =>
  api<ConsultantDocument[]>(`/consultants/${consultantId}/documents`);

export const uploadConsultantDocument = (
  consultantId: number,
  type: "license" | "contract",
  file: File,
  expiresAt?: string,
) => {
  const form = new FormData();
  form.append("type", type);
  form.append("file", file);
  if (expiresAt) form.append("expires_at", expiresAt);
  return api<ConsultantDocument>(`/consultants/${consultantId}/documents`, {
    form,
  });
};

/* Quizzes & exams */
export const listQuizzes = () => api<Quiz[]>("/quizzes");

export const createQuiz = (payload: {
  title: string;
  type: "quiz" | "exam";
  max_score: number;
}) => api<Quiz>("/quizzes", { body: payload });

export const recordQuizResult = (
  quizId: number,
  payload: { resident_id: number; score: number; taken_at?: string },
) => api<QuizResult>(`/quizzes/${quizId}/results`, { body: payload });

/* Research */
export const listPapers = () => api<ResearchPaper[]>("/research-papers");

export const createPaper = (payload: {
  resident_id: number;
  title: string;
  stage: string;
  notes?: string;
}) => api<ResearchPaper>("/research-papers", { body: payload });

/* Case logs */
export const listCaseLogs = () => api<CaseLog[]>("/case-logs");

export const createCaseLog = (payload: {
  resident_id: number;
  case_type: string;
  procedure?: string;
  count?: number;
  logged_at?: string;
}) => api<CaseLog>("/case-logs", { body: payload });

/* Accreditation */
export const listAccreditations = () => api<Accreditation[]>("/accreditations");

export const submitAccreditation = (checklist_snapshot: ChecklistItem[]) =>
  api<Accreditation>("/accreditations", { body: { checklist_snapshot } });

export const scheduleInspection = (
  id: number,
  inspection_scheduled_at: string,
) =>
  api<Accreditation>(`/admin/accreditations/${id}/schedule-inspection`, {
    method: "POST",
    body: { inspection_scheduled_at },
  });

export const markRequirementsCompleted = (id: number) =>
  api<Accreditation>(
    `/admin/accreditations/${id}/mark-requirements-completed`,
    {
      method: "POST",
    },
  );

export const startDeliberation = (id: number) =>
  api<Accreditation>(`/admin/accreditations/${id}/start-deliberation`, {
    method: "POST",
  });

export const editChecklist = (
  id: number,
  answers: Record<string, { compliant: boolean; notes?: string }>,
) =>
  api<AccreditationInspection>(
    `/admin/accreditations/${id}/checklist`,
    { method: "POST", body: { answers } },
  );

/* Inspection accreditor assignment (Admin) */
export const listAccreditors = () =>
  api<{ accreditors: { id: number; name: string; email: string }[] }>(
    `/admin/accreditors`,
    { method: "GET" },
  );

export const assignAccreditor = (
  accreditationId: number,
  inspectionId: number,
  userId: number,
  role: "lead" | "member",
) =>
  api<AccreditationInspection>(
    `/admin/accreditations/${accreditationId}/inspections/${inspectionId}/accreditors`,
    { method: "POST", body: { user_id: userId, role } },
  );

export const changeLeadAccreditor = (
  accreditationId: number,
  inspectionId: number,
  userId: number,
) =>
  api<AccreditationInspection>(
    `/admin/accreditations/${accreditationId}/inspections/${inspectionId}/lead`,
    { method: "POST", body: { user_id: userId } },
  );

export const removeAccreditor = (
  accreditationId: number,
  inspectionId: number,
  assignmentId: number,
) =>
  api<AccreditationInspection>(
    `/admin/accreditations/${accreditationId}/inspections/${inspectionId}/accreditors/${assignmentId}`,
    { method: "DELETE" },
  );

/* Inspection capture (Accreditor) */
export const getAccreditation = (id: number) =>
  api<{
    accreditation: Accreditation & { inspections: AccreditationInspection[] };
    documents: InstitutionDocument[];
    checklist_items: InspectionChecklistItem[];
  }>(`/accreditations/${id}`);

export const getAdminAccreditation = (id: number) =>
  api<{
    accreditation: Accreditation & {
      inspections: AccreditationInspection[];
      institution?: Institution;
    };
    documents: InstitutionDocument[];
    checklist_items: InspectionChecklistItem[];
  }>(`/admin/accreditations/${id}`);

export const getChecklistItems = () =>
  api<InspectionChecklistItem[]>(`/accreditor/checklist-items`);

export const pendingInspections = () =>
  api<Accreditation[]>(`/accreditor/inspections/pending`);

export const submitInspection = (
  id: number,
  answers: Record<string, { compliant: boolean; notes?: string }>,
) =>
  api<{ accreditation: Accreditation; inspection: AccreditationInspection }>(
    `/accreditor/accreditations/${id}/submit-inspection`,
    { method: "POST", body: { answers } },
  );

/* Training officers */
export const listTrainingOfficers = () =>
  api<import("./types").TrainingOfficer[]>("/training-officers");

export const createTrainingOfficer = (payload: {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  telegram_handle?: string;
}) => api<User>("/training-officers", { body: payload });

/* Residents */
export const listResidents = () => api<Resident[]>("/residents");

export const createResident = (payload: {
  name: string;
  username: string;
  email: string;
  password: string;
  track: Track;
  date_accepted?: string;
  expected_completion_date?: string;
  year_level?: number;
  age_at_enrollment?: number;
}) => api<User>("/residents", { body: payload });

export const getResidentPortfolio = (id: number) =>
  api<ResidentPortfolio>(`/residents/${id}`);

/* Transfers */
export const requestTransfer = (
  residentId: number,
  payload: { to_institution_id: number; reason?: string },
) =>
  api<ResidentTransfer>(`/residents/${residentId}/transfers`, {
    body: payload,
  });

export const incomingTransfers = () =>
  api<ResidentTransfer[]>("/transfers/incoming");

export const acceptTransfer = (id: number) =>
  api<ResidentTransfer>(`/transfers/${id}/accept`, { method: "POST" });

export const rejectTransfer = (id: number) =>
  api<ResidentTransfer>(`/transfers/${id}/reject`, { method: "POST" });

/* Rotations */
export const listRotations = () => api<RotationBlock[]>("/rotations");

export const createRotation = (payload: {
  title: string;
  category: string;
  /** must be the first day of a calendar month */
  starts_at: string;
  /** must be the last day of a calendar month */
  ends_at: string;
  consultant_id?: number;
  notes?: string;
}) => api<RotationBlock>("/rotations", { body: payload });

export const assignRotation = (rotationId: number, resident_id: number) =>
  api<RotationAssignment>(`/rotations/${rotationId}/assignments`, {
    body: { resident_id },
  });

export const updateRotationAssignment = (
  assignmentId: number,
  payload: { status: "assigned" | "completed"; grade?: number },
) =>
  api<RotationAssignment>(`/rotation-assignments/${assignmentId}`, {
    method: "PUT",
    body: payload,
  });

/* Remaining flowchart stages: consultant review, evaluation, remediation, archive */

export const listConsultantReviews = () =>
  api<ConsultantReview[]>("/consultant-reviews");

export const createConsultantReview = (payload: {
  rotation_assignment_id: number;
  consultant_id?: number;
  status: "validated" | "returned";
  comments?: string;
}) => api<ConsultantReview>("/consultant-reviews", { body: payload });

export const listConsultantEvaluations = () =>
  api<ConsultantEvaluation[]>("/consultant-evaluations");

export const createConsultantEvaluation = (payload: {
  resident_id: number;
  consultant_id?: number;
  period: string;
  ratings?: Record<string, number>;
  comments?: string;
  recommendation?: "continue" | "remediate";
  evaluated_at?: string;
}) => api<ConsultantEvaluation>("/consultant-evaluations", { body: payload });

export const listRemediationPlans = () =>
  api<RemediationPlan[]>("/remediation-plans");

export const createRemediationPlan = (payload: {
  resident_id: number;
  reason: string;
  plan: string;
  target_date?: string;
}) => api<RemediationPlan>("/remediation-plans", { body: payload });

export const updateRemediationPlan = (
  id: number,
  payload: {
    status: "open" | "in_progress" | "completed" | "closed";
    plan?: string;
    target_date?: string;
  },
) =>
  api<RemediationPlan>(`/remediation-plans/${id}`, {
    method: "PUT",
    body: payload,
  });

export const listPortfolioArchives = () =>
  api<PortfolioArchive[]>("/portfolio-archives");

export const createPortfolioArchive = (payload: {
  resident_id: number;
  summary?: string;
  status?: "archived" | "sealed";
  archived_at?: string;
}) => api<PortfolioArchive>("/portfolio-archives", { body: payload });

/* Findings & Corrective Actions */
export const listInspections = () =>
  api<
    Array<
      AccreditationInspection & {
        accreditation: Accreditation & { institution?: Institution };
      }
    >
  >("/staff/inspections");

export const listFindings = () => api<Finding[]>("/staff/findings");

export const createFinding = (payload: {
  accreditation_inspection_id: number;
  checklist_item_id?: number;
  title: string;
  description: string;
  severity?: "major" | "minor";
}) => api<Finding>("/staff/findings", { body: payload });

export const approveFinding = (findingId: number) =>
  api<Finding>(`/staff/findings/${findingId}/approve`, { method: "POST" });

export const listCorrectiveActions = (findingId?: number) =>
  api<CorrectiveAction[]>(
    `/corrective-actions${findingId ? `?finding_id=${findingId}` : ""}`,
  );

export const createCorrectiveAction = (payload: {
  finding_id: number;
  action_plan: string;
  due_date?: string;
  assigned_to?: number;
}) => api<CorrectiveAction>("/corrective-actions", { body: payload });

export const uploadEvidence = (actionId: number, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api<CorrectiveActionEvidence>(
    `/corrective-actions/${actionId}/evidence`,
    {
      method: "POST",
      form: fd,
    },
  );
};

export const resolveCorrectiveAction = (actionId: number) =>
  api<CorrectiveAction>(`/corrective-actions/${actionId}/resolve`, {
    method: "POST",
  });

export const verifyCorrectiveAction = (
  actionId: number,
  decision: "verified" | "rejected",
  comment?: string,
) =>
  api<CorrectiveAction>(`/staff/corrective-actions/${actionId}/verify`, {
    method: "POST",
    body: { decision, comment },
  });

/* =========================================================
   ADMIN  (prefix /admin, role:Admin)
   ========================================================= */

export const adminPending = () => api<AdminPending>("/admin/pending");

export const createStaff = (payload: {
  name: string;
  username: string;
  email: string;
  password: string;
  role: "Admin" | "Accreditor";
}) => api<User>("/admin/staff", { body: payload });

export const approveUser = (userId: number) =>
  api<User>(`/admin/users/${userId}/approve`, { method: "POST" });

export const rejectUser = (userId: number, reason: string) =>
  api<User>(`/admin/users/${userId}/reject`, { body: { reason } });

export const recordDecision = (
  id: number,
  payload: {
    outcome: "approved" | "probationary" | "rejected";
    notes?: string;
    valid_until?: string;
    recommendation?: "3_years" | "3_years_conditional" | "1_year";
    vote_count?: number;
    track?: Array<"AP" | "CP">;
  },
) =>
  api<Accreditation>(`/staff/accreditations/${id}/decision`, {
    method: "POST",
    body: payload,
  });

export const draftDecision = (
  id: number,
  payload: {
    outcome: "draft";
    notes?: string;
    recommendation?: "3_years" | "3_years_conditional" | "1_year";
    vote_count?: number;
  },
) =>
  api<AccreditationDecision>(
    `/accreditor/accreditations/${id}/decision-draft`,
    { method: "POST", body: payload },
  );

export const listDecisions = (id: number) =>
  api<{ accreditation_id: number; decisions: AccreditationDecision[] }>(
    `/staff/accreditations/${id}/decisions`,
  );

export const updateSettings = (settings: {
  track_durations?: Record<string, number>;
  promotion_thresholds?: Record<string, unknown>;
  accreditation_years?: 1 | 3;
}) => api<Setting[]>("/admin/settings", { method: "PUT", body: { settings } });
