import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as ep from "./endpoints"
import type { ChecklistItem, Track } from "./types"

/** Central query-key registry so invalidation stays consistent.
 *  Keys are mutable arrays — React Query's invalidateQueries wants unknown[]. */
export const qk = {
  me: ["me"],
  dashboard: ["dashboard"],
  pendingApproval: ["pending-approval"],
  notifications: ["notifications"],
  publicInstitutions: ["public-institutions"],
  documents: ["documents"],
  consultants: ["consultants"],
  consultantDocs: (id: number) => ["consultants", id, "documents"],
  quizzes: ["quizzes"],
  papers: ["research-papers"],
  caseLogs: ["case-logs"],
  accreditations: ["accreditations"],
  trainingOfficers: ["training-officers"],
  residents: ["residents"],
  transfers: ["transfers", "incoming"],
  rotations: ["rotations"],
  institutionProfile: ["institution-profile"],
  adminPending: ["admin", "pending"],
}

/* ---------------- queries ---------------- */

export const useMe = (enabled = true) =>
  useQuery({ queryKey: qk.me, queryFn: ep.me, enabled, retry: false })

export const useDashboard = (enabled = true) =>
  useQuery({ queryKey: qk.dashboard, queryFn: ep.dashboard, enabled, retry: false })

export const usePendingApproval = (enabled = true) =>
  useQuery({ queryKey: qk.pendingApproval, queryFn: ep.pendingApproval, enabled })

export const useNotifications = (enabled = true) =>
  useQuery({ queryKey: qk.notifications, queryFn: ep.notifications, enabled })

export const usePublicInstitutions = () =>
  useQuery({ queryKey: qk.publicInstitutions, queryFn: ep.listPublicInstitutions })

export const useDocuments = (enabled = true) =>
  useQuery({ queryKey: qk.documents, queryFn: ep.listDocuments, enabled })

export const useConsultants = (enabled = true) =>
  useQuery({ queryKey: qk.consultants, queryFn: ep.listConsultants, enabled })

export const useConsultantDocuments = (id: number | null) =>
  useQuery({
    queryKey: qk.consultantDocs(id ?? 0),
    queryFn: () => ep.listConsultantDocuments(id as number),
    enabled: id != null,
  })

export const useQuizzes = (enabled = true) =>
  useQuery({ queryKey: qk.quizzes, queryFn: ep.listQuizzes, enabled })

export const usePapers = (enabled = true) =>
  useQuery({ queryKey: qk.papers, queryFn: ep.listPapers, enabled })

export const useCaseLogs = (enabled = true) =>
  useQuery({ queryKey: qk.caseLogs, queryFn: ep.listCaseLogs, enabled })

export const useAccreditations = (enabled = true) =>
  useQuery({ queryKey: qk.accreditations, queryFn: ep.listAccreditations, enabled })

export const useTrainingOfficers = (enabled = true) =>
  useQuery({ queryKey: qk.trainingOfficers, queryFn: ep.listTrainingOfficers, enabled })

export const useResidents = (enabled = true) =>
  useQuery({ queryKey: qk.residents, queryFn: ep.listResidents, enabled })

export const usePlacesSearch = (q: string) =>
  useQuery({
    queryKey: ["places", "search", q],
    queryFn: () => ep.searchPlaces(q),
    enabled: q.trim().length >= 3,
    placeholderData: keepPreviousData,
  })

export const useIncomingTransfers = (enabled = true) =>
  useQuery({ queryKey: qk.transfers, queryFn: ep.incomingTransfers, enabled })

export const useRotations = (enabled = true) =>
  useQuery({ queryKey: qk.rotations, queryFn: ep.listRotations, enabled })

export const useInstitutionProfile = (enabled = true) =>
  useQuery({ queryKey: qk.institutionProfile, queryFn: ep.getInstitutionProfile, enabled, retry: false })

export const useAdminPending = (enabled = true) =>
  useQuery({ queryKey: qk.adminPending, queryFn: ep.adminPending, enabled })

/* ---------------- mutations ---------------- */

function useInvalidating<TArgs, TData>(
  fn: (a: TArgs) => Promise<TData>,
  keys: readonly unknown[][]
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
  })
}

export const useUploadDocument = () =>
  useInvalidating(
    (v: {
      type: "license" | "permit" | "accreditation" | "other"
        | "lto_clinical_lab" | "lto_bsf" | "chairman_designation" | "psp_certificate"
        | "floor_plan" | "org_chart" | "rotation_schedule" | "conference_schedule" | "activity_schedule"
      file: File
    }) => ep.uploadDocument(v.type, v.file),
    [qk.documents, qk.dashboard]
  )

export const useCreateConsultant = () =>
  useInvalidating(ep.createConsultant, [qk.consultants])

export const useUploadConsultantDocument = () =>
  useInvalidating(
    (v: { consultantId: number; type: "license" | "contract"; file: File; expires_at?: string }) =>
      ep.uploadConsultantDocument(v.consultantId, v.type, v.file, v.expires_at),
    [qk.consultants, qk.dashboard]
  )

export const useCreateQuiz = () => useInvalidating(ep.createQuiz, [qk.quizzes, qk.dashboard])

export const useRecordResult = () =>
  useInvalidating(
    (v: { quizId: number; resident_id: number; score: number; taken_at?: string }) =>
      ep.recordQuizResult(v.quizId, {
        resident_id: v.resident_id,
        score: v.score,
        taken_at: v.taken_at,
      }),
    [qk.quizzes, qk.residents, qk.dashboard]
  )

export const useCreatePaper = () => useInvalidating(ep.createPaper, [qk.papers])

export const useCreateCaseLog = () =>
  useInvalidating(ep.createCaseLog, [qk.caseLogs, qk.dashboard])

export const useSubmitAccreditation = () =>
  useInvalidating(
    (snapshot: ChecklistItem[]) => ep.submitAccreditation(snapshot),
    [qk.accreditations, qk.dashboard]
  )

export const useScheduleInspection = () =>
  useInvalidating(
    (v: { id: number; date: string }) => ep.scheduleInspection(v.id, v.date),
    [qk.adminPending, qk.dashboard, qk.accreditations]
  )

export const useMarkRequirementsCompleted = () =>
  useInvalidating(
    (id: number) => ep.markRequirementsCompleted(id),
    [qk.adminPending]
  )

export const useListAccreditors = () =>
  useQuery({ queryKey: ["accreditors"], queryFn: ep.listAccreditors, retry: false })

export const useAssignAccreditor = () =>
  useInvalidating(
    (v: { accreditationId: number; inspectionId: number; userId: number; role: "lead" | "member" }) =>
      ep.assignAccreditor(v.accreditationId, v.inspectionId, v.userId, v.role),
    [["admin", "accreditation", "detail"], qk.adminPending],
  )

export const useChangeLeadAccreditor = () =>
  useInvalidating(
    (v: { accreditationId: number; inspectionId: number; userId: number }) =>
      ep.changeLeadAccreditor(v.accreditationId, v.inspectionId, v.userId),
    [["admin", "accreditation", "detail"], qk.adminPending],
  )

export const useRemoveAccreditor = () =>
  useInvalidating(
    (v: { accreditationId: number; inspectionId: number; assignmentId: number }) =>
      ep.removeAccreditor(v.accreditationId, v.inspectionId, v.assignmentId),
    [["admin", "accreditation", "detail"], qk.adminPending],
  )

export const useGetChecklistItems = (enabled = true) =>
  useQuery({ queryKey: ["checklist-items"], queryFn: ep.getChecklistItems, enabled, retry: false })

export const useAdminAccreditationDetail = (id: number | undefined, enabled = true) =>
  useQuery({
    queryKey: ["admin", "accreditation", "detail", id],
    queryFn: () => ep.getAdminAccreditation(id as number),
    enabled: enabled && id !== undefined,
    retry: false,
  })

export const usePendingInspections = (enabled = true) =>
  useQuery({ queryKey: ["inspections", "pending"], queryFn: ep.pendingInspections, enabled, retry: false })

export const useSubmitInspection = () =>
  useInvalidating(
    (v: { id: number; answers: Record<string, { compliant: boolean; notes?: string }> }) =>
      ep.submitInspection(v.id, v.answers),
    [["inspections", "pending"], qk.accreditations, qk.dashboard]
  )

export const useAccreditationDetail = (id: number | undefined, enabled = true) =>
  useQuery({
    queryKey: ["accreditation", "detail", id],
    queryFn: () => ep.getAccreditation(id as number),
    enabled: enabled && id !== undefined,
    retry: false,
  })

export const useCreateTrainingOfficer = () =>
  useInvalidating(ep.createTrainingOfficer, [qk.trainingOfficers])

export const useCreateResident = () =>
  useInvalidating(ep.createResident, [qk.residents, qk.dashboard])

export const useUpdateInstitutionProfile = () =>
  useInvalidating(ep.updateInstitutionProfile, [qk.institutionProfile, qk.dashboard, qk.me])

export const useRequestTransfer = () =>
  useInvalidating(
    (v: { residentId: number; to_institution_id: number; reason?: string }) =>
      ep.requestTransfer(v.residentId, {
        to_institution_id: v.to_institution_id,
        reason: v.reason,
      }),
    [qk.residents, qk.transfers]
  )

export const useAcceptTransfer = () =>
  useInvalidating(ep.acceptTransfer, [qk.transfers, qk.residents])

export const useRejectTransfer = () =>
  useInvalidating(ep.rejectTransfer, [qk.transfers])

export const useCreateRotation = () => useInvalidating(ep.createRotation, [qk.rotations])

export const useAssignRotation = () =>
  useInvalidating(
    (v: { rotationId: number; resident_id: number }) =>
      ep.assignRotation(v.rotationId, v.resident_id),
    [qk.rotations, qk.dashboard]
  )

export const useUpdateAssignment = () =>
  useInvalidating(
    (v: { assignmentId: number; status: "assigned" | "completed"; grade?: number }) =>
      ep.updateRotationAssignment(v.assignmentId, { status: v.status, grade: v.grade }),
    [qk.rotations, qk.dashboard]
  )

/* remaining flowchart stages */
export const useConsultantReviews = (enabled = true) =>
  useQuery({ queryKey: ["consultantReviews"], queryFn: ep.listConsultantReviews, enabled })

export const useCreateConsultantReview = () =>
  useInvalidating(ep.createConsultantReview, [["consultantReviews"], qk.rotations, qk.dashboard])

export const useConsultantEvaluations = (enabled = true) =>
  useQuery({ queryKey: ["consultantEvaluations"], queryFn: ep.listConsultantEvaluations, enabled })

export const useCreateConsultantEvaluation = () =>
  useInvalidating(ep.createConsultantEvaluation, [["consultantEvaluations"], qk.residents, qk.dashboard])

export const useRemediationPlans = (enabled = true) =>
  useQuery({ queryKey: ["remediationPlans"], queryFn: ep.listRemediationPlans, enabled })

export const useCreateRemediationPlan = () =>
  useInvalidating(ep.createRemediationPlan, [["remediationPlans"], qk.residents])

export const useUpdateRemediationPlan = () =>
  useInvalidating(
    (v: { id: number; status: "open" | "in_progress" | "completed" | "closed"; plan?: string; target_date?: string }) =>
      ep.updateRemediationPlan(v.id, { status: v.status, plan: v.plan, target_date: v.target_date }),
    [["remediationPlans"], qk.residents]
  )

export const usePortfolioArchives = (enabled = true) =>
  useQuery({ queryKey: ["portfolioArchives"], queryFn: ep.listPortfolioArchives, enabled })

export const useCreatePortfolioArchive = () =>
  useInvalidating(ep.createPortfolioArchive, [["portfolioArchives"], qk.residents])

/* Findings & Corrective Actions */
export const useInspections = (enabled = true) =>
  useQuery({ queryKey: ["staff", "inspections"], queryFn: ep.listInspections, enabled })

export const useFindings = (enabled = true) =>
  useQuery({ queryKey: ["staff", "findings"], queryFn: ep.listFindings, enabled })

export const useCreateFinding = () =>
  useInvalidating(ep.createFinding, [["staff", "findings"]])

export const useApproveFinding = () =>
  useInvalidating(
    (findingId: number) => ep.approveFinding(findingId),
    [["staff", "findings"], ["accreditation", "detail"], ["admin", "accreditation", "detail"]],
  )

export const useCorrectiveActions = (findingId?: number, enabled = true) =>
  useQuery({
    queryKey: ["correctiveActions", findingId ?? "all"],
    queryFn: () => ep.listCorrectiveActions(findingId),
    enabled,
  })

export const useCreateCorrectiveAction = () =>
  useInvalidating(ep.createCorrectiveAction, [["staff", "findings"], ["correctiveActions", "all"]])

export const useUploadEvidence = () =>
  useInvalidating(
    (v: { actionId: number; file: File }) => ep.uploadEvidence(v.actionId, v.file),
    [["staff", "findings"], ["correctiveActions", "all"]]
  )

export const useResolveCorrectiveAction = () =>
  useInvalidating(
    (actionId: number) => ep.resolveCorrectiveAction(actionId),
    [["staff", "findings"], ["correctiveActions", "all"]]
  )

export const useVerifyCorrectiveAction = () =>
  useInvalidating(
    (v: { actionId: number; decision: "verified" | "rejected"; comment?: string }) =>
      ep.verifyCorrectiveAction(v.actionId, v.decision, v.comment),
    [["staff", "findings"], ["correctiveActions", "all"]]
  )

export const useReadNotification = () =>
  useInvalidating(ep.readNotification, [qk.notifications, qk.dashboard])

export const useNotificationPreferences = (enabled = true) =>
  useQuery({ queryKey: ["notification-preferences"], queryFn: ep.notificationPreferences, enabled, retry: false })

export const useUpdateNotificationPreferences = () =>
  useInvalidating(ep.updateNotificationPreferences, [["notification-preferences"]])

/* admin */
export const useApproveUser = () => useInvalidating(ep.approveUser, [qk.adminPending])
export const useRejectUser = () =>
  useInvalidating((v: { userId: number; reason: string }) => ep.rejectUser(v.userId, v.reason), [
    qk.adminPending,
  ])
export const useRecordDecision = () =>
  useInvalidating(
    (v: { id: number; payload: { outcome: "approved" | "probationary" | "rejected"; notes?: string; valid_until?: string } }) =>
      ep.recordDecision(v.id, v.payload),
    [qk.adminPending],
  )
export const useDraftDecision = () =>
  useInvalidating(
    (v: { id: number; payload: { outcome: "draft"; notes?: string } }) =>
      ep.draftDecision(v.id, v.payload),
    [qk.adminPending],
  )
export const useAccreditationDecisions = (id: number) =>
  useQuery({ queryKey: ["accDecisions", id], queryFn: () => ep.listDecisions(id) })
export const useCreateStaff = () => useInvalidating(ep.createStaff, [qk.adminPending])
export const useUpdateSettings = () => useInvalidating(ep.updateSettings, [])

/* registration (public) */
export const useRegisterInstitution = () =>
  useMutation({ mutationFn: ep.registerInstitution })
export const useRegisterResident = () => useMutation({ mutationFn: ep.registerResident })

export type { Track }
