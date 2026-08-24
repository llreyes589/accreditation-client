import { cn } from "@/lib/utils"
import { Building2, GraduationCap } from "lucide-react"
import type { KanbanApplication } from "./types"

interface KanbanCardProps {
  application: KanbanApplication
  className?: string
}

/**
 * A single application card inside a Kanban column. Always shows the application
 * ID and applicant name (the acceptance-criteria minimum); institution, program
 * and a status note are secondary context.
 */
export function KanbanCard({ application, className }: KanbanCardProps) {
  return (
    <article
      className={cn(
        "rounded-md border border-slate-200 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-sky-400",
        className,
      )}
    >
      {/* Application ID — the primary identifier. */}
      <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-sky-700">
        {application.id}
      </p>

      {/* Applicant name — always present (acceptance criterion). */}
      <p className="mt-0.5 truncate text-sm font-medium text-slate-800">
        {application.applicantName}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Building2 className="h-3 w-3" aria-hidden />
          <span className="truncate">{application.institution}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <GraduationCap className="h-3 w-3" aria-hidden />
          {application.program}
        </span>
      </div>

      {application.note && (
        <p className="mt-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {application.note}
        </p>
      )}
    </article>
  )
}
