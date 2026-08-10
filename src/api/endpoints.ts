import { api } from "./client";
import type {
  AdminPending,
  Accreditation,
  AppNotification,
  CaseLog,
  ChecklistItem,
  Consultant,
  ConsultantDocument,
  DashboardResponse,
  Institution,
  InstitutionDocument,
  LoginResponse,
  Paginated,
  PendingApproval,
  PsgcOption,
  Quiz,
  QuizResult,
  ResearchPaper,
  Resident,
  ResidentTransfer,
  RotationAssignment,
  RotationBlock,
  Setting,
  Track,
  User,
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
}) => api<Institution>("/institution-profile", { method: "PUT", body: payload });

export const getPsgcRegions = () => api<PsgcOption[]>("/psgc/regions")
export const getPsgcProvinces = (regionCode: string) =>
  api<PsgcOption[]>(`/psgc/regions/${regionCode}/provinces`)
export const getPsgcCities = (provinceCode: string) =>
  api<PsgcOption[]>(`/psgc/provinces/${provinceCode}/cities`)

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

/* =========================================================
   TRAINING OFFICER  (role:TrainingOfficer)
   ========================================================= */

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
  age_at_enrollment?: number;
}) => api<User>("/residents", { body: payload });

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

export const approveAccreditation = (id: number) =>
  api<Accreditation>(`/admin/accreditations/${id}/approve`, { method: "POST" });

export const rejectAccreditation = (id: number) =>
  api<Accreditation>(`/admin/accreditations/${id}/reject`, { method: "POST" });

export const updateSettings = (settings: {
  track_durations?: Record<string, number>;
  promotion_thresholds?: Record<string, unknown>;
  accreditation_years?: 1 | 3;
}) => api<Setting[]>("/admin/settings", { method: "PUT", body: { settings } });
