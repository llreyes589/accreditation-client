import { PageHeader } from "@/components/shared"
import { KanbanBoard } from "@/components/kanban"
import { useAuth } from "@/context/auth"
import { useKanbanBoard } from "@/api/hooks"
import { Loading } from "@/components/states"
import { MOCK_APPLICATIONS, STAGES, groupByStage, type KanbanColumn } from "@/components/kanban"
import type { KanbanColumnDTO } from "@/api/types"

/**
 * Accreditation application-stage board (Kanban).
 *
 * Live data from GET /kanban (own institution) or /staff/kanban (all institutions,
 * Admin/Accreditor). Column visuals come from the frontend STAGES constant; the
 * API supplies the applications per stage. While loading or if the request fails,
 * the bundled mock dataset is shown so the board is always presentational.
 */
export default function KanbanBoardPage() {
  const { hasRole } = useAuth()
  const isStaff = hasRole("Admin", "Accreditor")
  const q = useKanbanBoard(isStaff)

  // Map API applications into the six frontend-defined stage columns.
  const fromApi = (cols: KanbanColumnDTO[] | undefined) =>
    STAGES.map((stage) => ({
      stage,
      applications:
        cols?.find((c) => c.stage.id === stage.id)?.applications ?? [],
    }))

  const columns: KanbanColumn[] = q.data
    ? fromApi(q.data.columns)
    : groupByStage(MOCK_APPLICATIONS)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Application Stages"
        description="Where each accreditation application sits in the process — Application → For Inspection → Inspection → Compliance → Deliberation → Decision."
      />
      {q.isLoading ? (
        <Loading label="Loading application board…" />
      ) : (
        <KanbanBoard columns={columns} />
      )}
    </div>
  )
}
