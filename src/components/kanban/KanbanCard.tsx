import { cn } from "@/lib/utils"
import { Building2, GraduationCap } from "lucide-react"
import type { KanbanApplication } from "./types"
import {
  AccreditationActions,
  type AccreditationLike,
} from "@/components/accreditation/AccreditationActions"

/** Granular-status -> chip color (rejected is red, approved green, …). */
const STATUS_CHIP: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  requirements_completed: "bg-teal-100 text-teal-700",
  inspection_scheduled: "bg-sky-100 text-sky-700",
  inspected: "bg-indigo-100 text-indigo-700",
  deliberation: "bg-violet-100 text-violet-700",
  approved: "bg-emerald-100 text-emerald-700",
  probationary: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
}

/** Granular-status -> left border accent for quick scanning. */
const STATUS_ACCENT: Record<string, string> = {
  pending: "border-l-slate-300",
  requirements_completed: "border-l-teal-400",
  inspection_scheduled: "border-l-sky-500",
  inspected: "border-l-indigo-500",
  deliberation: "border-l-violet-500",
  approved: "border-l-emerald-500",
  probationary: "border-l-amber-500",
  rejected: "border-l-red-500",
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  requirements_completed: "Requirements complete",
  inspection_scheduled: "Inspection scheduled",
  inspected: "Inspected",
  deliberation: "Deliberation",
  approved: "Approved",
  probationary: "Probationary",
  rejected: "Rejected",
}

interface KanbanCardProps {
  application: KanbanApplication
  className?: string
  /** Opens the item's detail modal (stage-aware) when the card is activated. */
  onOpenDetail?: (application: KanbanApplication) => void
}

/**
 * A single application card inside a Kanban column. Always shows the application
 * ID and applicant name (the acceptance-criteria minimum); institution, program
 * and a status note are secondary context.
 *
 * When the card carries a live `status` (real backend data), the same
 * decision/checklist action buttons used in the Approvals table are rendered on
 * the card, gated by role + status. The whole card is also activatable to open
 * the stage-aware detail modal.
 */
export function KanbanCard({ application, className, onOpenDetail }: KanbanCardProps) {
  const isLive = application.status != null

  // Minimal accreditation shape the action cluster needs (id + status + a few
  // optional fields). A full Accreditation from the API also satisfies it.
  const accreditation: AccreditationLike = {
    id: Number(application.id.replace(/\D/g, "")) || 0,
    status: (application.status ?? "pending") as AccreditationLike["status"],
    submission_type: application.submissionType,
    inspection_scheduled_at: application.inspectionScheduledAt,
    decisions: [],
  }

  const status = application.status ?? "pending"
  const statusChip = STATUS_CHIP[status] ?? "bg-slate-100 text-slate-600"
  const statusAccent = STATUS_ACCENT[status] ?? "border-l-slate-300"

  return (
    <article
      className={cn(
        "rounded-md border border-l-4 border-slate-200 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-sky-400",
        statusAccent,
        className,
      )}
    >
      {/* Application ID — the primary identifier. Clickable to open the detail modal. */}
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => onOpenDetail?.(application)}
        title="View details"
      >
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-sky-700">
          {application.id}
        </p>

        {/* Applicant name — always present (acceptance criterion). */}
        <p className="mt-0.5 truncate text-sm font-medium text-slate-800">
          {application.applicantName}
        </p>
      </button>

      {/* Status — emphasized, color-coded chip (rejected = red, approved = green, …). */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            statusChip,
          )}
        >
          {STATUS_LABEL[status] ?? status}
        </span>
        {application.submissionType && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
            {application.submissionType}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Building2 className="h-3 w-3" aria-hidden />
          <span className="truncate">{application.institution}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <GraduationCap className="h-3 w-3" aria-hidden />
          {application.program}
        </span>
        {application.submissionType && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
            {application.submissionType}
          </span>
        )}
      </div>

      {application.note && (
        <p className="mt-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {application.note}
        </p>
      )}

      {/* Action buttons (View Checklist / Decide / …) — only on live data. */}
      {isLive && (
        <div className="mt-2.5 border-t border-slate-100 pt-2.5">
          <AccreditationActions accreditation={accreditation} compact />
        </div>
      )}
    </article>
  )
}
