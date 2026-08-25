import type { LucideIcon } from "lucide-react"
import {
  FileText,
  ClipboardCheck,
  Search,
  ShieldCheck,
  Scale,
  Gavel,
} from "lucide-react"

/**
 * The six application-stage columns of the accreditation Kanban board.
 * Order matters: it is the left-to-right pipeline order.
 *
 * These stages are intentionally coarse-grained views over the richer
 * `ApplicationStatus` vocabulary used by the API (Draft, Submitted,
 * UnderCompletenessReview, InspectionScheduled, FindingsIssued, …). The board
 * groups those granular statuses into the six columns below so "where is this
 * app in the process?" is obvious at a glance.
 */
export type StageId =
  | "application"
  | "for_inspection"
  | "inspection"
  | "compliance"
  | "deliberation"
  | "decision"

export interface Stage {
  id: StageId
  /** Short column header shown to the user. */
  title: string
  /** One-line description of what this column means. */
  description: string
  icon: LucideIcon
  /** Tailwind classes used for the column accent + header. */
  accent: string
  /** Tailwind classes for the header chip text. */
  chip: string
}

export const STAGES: Stage[] = [
  {
    id: "application",
    title: "Application",
    description: "Submitted, completeness review, revisions",
    icon: FileText,
    accent: "border-t-slate-400",
    chip: "bg-slate-100 text-slate-700",
  },
  {
    id: "for_inspection",
    title: "For Inspection",
    description: "Cleared for inspection, schedule set",
    icon: ClipboardCheck,
    accent: "border-t-sky-500",
    chip: "bg-sky-100 text-sky-700",
  },
  {
    id: "inspection",
    title: "Inspection",
    description: "On-site inspection, findings issued",
    icon: Search,
    accent: "border-t-indigo-500",
    chip: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "compliance",
    title: "Compliance",
    description: "Corrective actions, final evaluation",
    icon: ShieldCheck,
    accent: "border-t-amber-500",
    chip: "bg-amber-100 text-amber-700",
  },
  {
    id: "deliberation",
    title: "Deliberation",
    description: "Decision pending, deferred",
    icon: Scale,
    accent: "border-t-violet-500",
    chip: "bg-violet-100 text-violet-700",
  },
  {
    id: "decision",
    title: "Decision",
    description: "Approved, probationary, not approved, renewal",
    icon: Gavel,
    accent: "border-t-emerald-500",
    chip: "bg-emerald-100 text-emerald-700",
  },
]

/** A single application card placed in a stage column. */
export interface KanbanApplication {
  id: string
  /** Human-readable application reference, e.g. "ACC-2026-0142". */
  applicantName: string
  institution: string
  program: string
  /** ISO date the application entered its current stage (optional). */
  enteredStageAt?: string | null
  /** Free-form status note shown as a small badge on the card. */
  note?: string | null
  /**
   * Backend accreditation status. Drives which action buttons appear on the
   * card (View Checklist / Decide / Schedule / Mark complete) and is passed
   * through to AccreditationActions. Optional so the mock dataset — which has
   * no live status — still renders as a presentational card.
   */
  status?:
    | "pending"
    | "requirements_completed"
    | "inspection_scheduled"
    | "inspected"
    | "approved"
    | "probationary"
    | "rejected"
    | null
  /** Submission kind, surfaced as a small tag on the card. */
  submissionType?: "new" | "renew" | null
  /** ISO date an inspection is scheduled for (optional). */
  inspectionScheduledAt?: string | null
}

export interface KanbanColumn {
  stage: Stage
  applications: KanbanApplication[]
}

/**
 * Mock data shaped by the stage schema above. Used to render the board with no
 * backend connection. Grouped by `stage.id` so a real API response can later be
 * adapted by mapping `ApplicationStatus` -> `StageId`.
 */
export const MOCK_APPLICATIONS: KanbanApplication[] = [
  // Application
  {
    id: "ACC-2026-0142",
    applicantName: "Dr. Maria Santos",
    institution: "Cebu Blood Center",
    program: "AP",
    enteredStageAt: "2026-08-21",
    note: "Completeness review",
  },
  {
    id: "ACC-2026-0143",
    applicantName: "Dr. Juan dela Cruz",
    institution: "Manila Tranfusion Unit",
    program: "CP",
    enteredStageAt: "2026-08-22",
    note: "Returned for revision",
  },
  // For Inspection
  {
    id: "ACC-2026-0138",
    applicantName: "Dr. Ana Reyes",
    institution: "Davao Regional Blood Bank",
    program: "AP_CP",
    enteredStageAt: "2026-08-19",
    note: "Scheduled 2026-09-02",
  },
  // Inspection
  {
    id: "ACC-2026-0131",
    applicantName: "Dr. Paulo Mendoza",
    institution: "Iloilo Donor Clinic",
    program: "AP",
    enteredStageAt: "2026-08-15",
    note: "Findings issued",
  },
  {
    id: "ACC-2026-0133",
    applicantName: "Dr. Liza Ong",
    institution: "Baguio Blood Service",
    program: "CP",
    enteredStageAt: "2026-08-16",
  },
  // Compliance
  {
    id: "ACC-2026-0125",
    applicantName: "Dr. Carlo Rivera",
    institution: "Quezon Blood Center",
    program: "AP_CP",
    enteredStageAt: "2026-08-10",
    note: "2 corrective actions",
  },
  // Deliberation
  {
    id: "ACC-2026-0119",
    applicantName: "Dr. Susan Tan",
    institution: "Cagayan Donor Facility",
    program: "AP",
    enteredStageAt: "2026-08-05",
    note: "Decision pending",
  },
  // Decision
  {
    id: "ACC-2026-0108",
    applicantName: "Dr. Robert Garcia",
    institution: "Leyte Blood Bank",
    program: "CP",
    enteredStageAt: "2026-07-28",
    note: "Approved",
  },
  {
    id: "ACC-2026-0110",
    applicantName: "Dr. Mia Cruz",
    institution: "Tagaytay Transfusion Unit",
    program: "AP_CP",
    enteredStageAt: "2026-07-30",
    note: "Probationary",
  },
]

/** Maps each mock application to one of the six stages (stands in for the
 *  eventual API: ApplicationStatus -> StageId grouping). */
const STAGE_OF: Record<string, StageId> = {
  "ACC-2026-0142": "application",
  "ACC-2026-0143": "application",
  "ACC-2026-0138": "for_inspection",
  "ACC-2026-0131": "inspection",
  "ACC-2026-0133": "inspection",
  "ACC-2026-0125": "compliance",
  "ACC-2026-0119": "deliberation",
  "ACC-2026-0108": "decision",
  "ACC-2026-0110": "decision",
}

export function groupByStage(
  applications: KanbanApplication[] = MOCK_APPLICATIONS,
): KanbanColumn[] {
  return STAGES.map((stage) => ({
    stage,
    applications: applications.filter((a) => STAGE_OF[a.id] === stage.id),
  }))
}
