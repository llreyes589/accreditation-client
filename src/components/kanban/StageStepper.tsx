import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { STAGES, type StageId } from "./types";

/**
 * Maps a granular backend accreditation status to one of the six board stages.
 * Mirrors the backend KanbanController::STAGE_OF mapping (kept client-side so
 * the stepper can render without an extra round-trip).
 */
export function stageOfStatus(
  status?: string | null,
): StageId {
  switch (status) {
    case "pending":
    case "requirements_completed":
      return status === "requirements_completed" ? "for_inspection" : "application";
    case "inspection_scheduled":
      return "for_inspection";
    case "inspected":
      return "inspection";
    case "deliberation":
      return "deliberation";
    case "approved":
    case "probationary":
    case "rejected":
      return "decision";
    default:
      return "application";
  }
}

/** A horizontal pipeline showing the six stages with the current one highlighted. */
export function StageStepper({ current }: { current: StageId }) {
  const idx = STAGES.findIndex((s) => s.id === current);
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {STAGES.map((stage, i) => {
        const done = i < idx;
        const active = i === idx;
        const Icon = stage.icon;
        return (
          <li key={stage.id} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                active
                  ? stage.chip + " ring-2 ring-offset-1"
                  : done
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-400",
              )}
            >
              {done ? (
                <Check className="h-3 w-3" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {stage.title}
            </span>
            {i < STAGES.length - 1 && (
              <span
                className={cn(
                  "h-px w-3 sm:w-5",
                  i < idx ? "bg-emerald-300" : "bg-slate-200",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
