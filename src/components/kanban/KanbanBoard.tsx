import { cn } from "@/lib/utils"
import {
  STAGES,
  groupByStage,
  type KanbanApplication,
  type KanbanColumn,
} from "./types"
import { KanbanCard } from "./KanbanCard"

interface KanbanBoardProps {
  /** Pre-grouped columns. Defaults to the mock dataset (no backend needed). */
  columns?: KanbanColumn[]
  /** Raw applications; ignored if `columns` is provided. */
  applications?: KanbanApplication[]
  className?: string
}

/**
 * Presentational accreditation Kanban board.
 *
 * Renders one column per application stage (Application -> For Inspection ->
 * Inspection -> Compliance -> Deliberation -> Decision). Each card sits in the
 * column matching its current stage. The board is fully self-contained: pass no
 * props and it renders the bundled mock data with no backend connection.
 */
export function KanbanBoard({ columns, applications, className }: KanbanBoardProps) {
  const resolved = columns ?? groupByStage(applications)
  const total = resolved.reduce((n, c) => n + c.applications.length, 0)

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Pipeline legend: makes the stage order and "where am I" obvious. */}
      <ol className="hidden items-center gap-1 text-xs text-slate-500 md:flex">
        {STAGES.map((s, i) => (
          <li key={s.id} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                s.chip,
              )}
            >
              <s.icon className="h-3.5 w-3.5" aria-hidden />
              {s.title}
            </span>
            {i < STAGES.length - 1 && (
              <span className="px-0.5 text-slate-300" aria-hidden>
                ›
              </span>
            )}
          </li>
        ))}
      </ol>

      {/* Six responsive columns. Horizontal scroll on small screens; a
          wrapping grid on larger screens so the whole pipeline is visible. */}
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        role="list"
        aria-label="Application stages"
      >
        {resolved.map((col) => (
          <section
            key={col.stage.id}
            role="listitem"
            className={cn(
              "flex flex-col rounded-lg border border-slate-200 border-t-4 bg-slate-50/60",
              col.stage.accent,
            )}
            aria-label={col.stage.title}
          >
            <header className="flex items-start justify-between gap-2 border-b border-slate-200 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <col.stage.icon
                    className="h-4 w-4 shrink-0 text-slate-500"
                    aria-hidden
                  />
                  <h3 className="truncate text-sm font-semibold text-slate-800">
                    {col.stage.title}
                  </h3>
                </div>
                <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">
                  {col.stage.description}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  col.stage.chip,
                )}
                title={`${col.applications.length} application(s)`}
              >
                {col.applications.length}
              </span>
            </header>

            <div className="flex min-h-[80px] flex-1 flex-col gap-2 p-2">
              {col.applications.length === 0 ? (
                <p className="m-auto px-2 py-4 text-center text-xs italic text-slate-300">
                  No applications
                </p>
              ) : (
                col.applications.map((app) => (
                  <KanbanCard key={app.id} application={app} />
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Showing {total} application{total === 1 ? "" : "s"} across {STAGES.length}{" "}
        stages.
      </p>
    </div>
  )
}
