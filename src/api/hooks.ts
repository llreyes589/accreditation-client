import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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

export const useIncomingTransfers = (enabled = true) =>
  useQuery({ queryKey: qk.transfers, queryFn: ep.incomingTransfers, enabled })

export const useRotations = (enabled = true) =>
  useQuery({ queryKey: qk.rotations, queryFn: ep.listRotations, enabled })

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
    (v: { type: "license" | "permit" | "accreditation" | "other"; file: File }) =>
      ep.uploadDocument(v.type, v.file),
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

export const useCreateTrainingOfficer = () =>
  useInvalidating(ep.createTrainingOfficer, [qk.trainingOfficers])

export const useCreateResident = () =>
  useInvalidating(ep.createResident, [qk.residents, qk.dashboard])

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

export const useReadNotification = () =>
  useInvalidating(ep.readNotification, [qk.notifications, qk.dashboard])

/* admin */
export const useApproveUser = () => useInvalidating(ep.approveUser, [qk.adminPending])
export const useRejectUser = () =>
  useInvalidating((v: { userId: number; reason: string }) => ep.rejectUser(v.userId, v.reason), [
    qk.adminPending,
  ])
export const useApproveAccreditation = () =>
  useInvalidating(ep.approveAccreditation, [qk.adminPending])
export const useRejectAccreditation = () =>
  useInvalidating(ep.rejectAccreditation, [qk.adminPending])
export const useCreateStaff = () => useInvalidating(ep.createStaff, [qk.adminPending])
export const useUpdateSettings = () => useInvalidating(ep.updateSettings, [])

/* registration (public) */
export const useRegisterInstitution = () =>
  useMutation({ mutationFn: ep.registerInstitution })
export const useRegisterResident = () => useMutation({ mutationFn: ep.registerResident })

export type { Track }
