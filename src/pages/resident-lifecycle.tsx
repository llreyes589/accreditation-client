import { useParams, useNavigate, Link } from "react-router-dom"
import {
  CheckCircle2, Circle, CircleDashed, AlertTriangle,
} from "lucide-react"
import { PageHeader, StatCard, EmptyHint } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading, ErrorState, Empty } from "@/components/states"
import {
  useResidents, useRotations, useCaseLogs, useQuizzes, usePapers, useIncomingTransfers,
} from "@/api/hooks"
import type { RotationBlock, CaseLog, Quiz, ResearchPaper } from "@/api/types"

/**
 * Resident lifecycle view — renders the forwarded flowchart for a single resident.
 *
 *   A admitted → B profile → C year level → D rotation plan → E/F cases
 *   → K exams & RISE → L research → (transfer) → [deferred: G/H/I validation,
 *   M consultant eval, O remediation, U archive]
 *
 * Each stage reads from the existing module endpoints (no new schema). Stages the
 * backend does not yet support are shown as "Planned" so the flowchart stays
 * complete and the gaps are visible.
 */
type StageState = "done" | "empty" | "planned"

function StageIcon({ state }: { state: StageState }) {
  if (state === "done") return <CheckCircle2 className="size-5 text-emerald-600" />
  if (state === "planned") return <CircleDashed className="size-5 text-slate-300" />
  return <Circle className="size-5 text-slate-300" />
}

function StageRow({
  code, title, caption, state, to, detail,
}: {
  code: string
  title: string
  caption: string
  state: StageState
  to?: string
  detail?: string
}) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
      <div className="mt-0.5"><StageIcon state={state} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{code}</span>
          <p className="text-[13px] font-semibold text-ink">{title}</p>
          {state === "planned" && <Badge variant="outline" className="text-[10px]">Planned</Badge>}
          {state === "done" && <Badge variant="info" className="text-[10px]">Done</Badge>}
          {state === "empty" && <Badge variant="outline" className="text-[10px] text-amber-600">Not recorded</Badge>}
        </div>
        <p className="mt-0.5 text-[12px] text-slate-500">{caption}</p>
        {detail && <p className="mt-1 text-[12px] text-slate-600">{detail}</p>}
        {to && (
          <Link to={to} className="mt-1 inline-block text-[12px] font-medium text-brand hover:underline">
            Go to {title.split(" ")[0]} →
          </Link>
        )}
      </div>
    </div>
  )
}

export default function ResidentLifecyclePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const residentId = Number(id)

  const residents = useResidents()
  const rotations = useRotations()
  const cases = useCaseLogs()
  const quizzes = useQuizzes()
  const papers = usePapers()
  const transfers = useIncomingTransfers()

  if (residents.isLoading) return <Loading label="Loading resident…" />
  if (residents.error) return <ErrorState error={residents.error} onRetry={residents.refetch} />

  const resident = (residents.data ?? []).find((r) => r.id === residentId)
  if (!resident) {
    return (
      <Card>
        <CardContent className="py-6">
          <Empty>Resident not found in your institution.</Empty>
          <div className="mt-3 text-center">
            <Button variant="outline" size="sm" onClick={() => navigate("/residents")}>Back to Residents</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const name = resident.user?.name ?? `Resident #${resident.id}`
  const myRotations = (rotations.data ?? []).filter((r: RotationBlock) =>
    (r.assignments ?? []).some((a) => a.resident_id === resident.id)
  )
  const myCases = (cases.data ?? []).filter((c: CaseLog) => c.resident_id === resident.id)
  const myQuizzes = (quizzes.data ?? []).filter((q: Quiz) => (q.results ?? []).some((r) => r.resident_id === resident.id))
  const myPapers = (papers.data ?? []).filter((p: ResearchPaper) => p.resident_id === resident.id)
  const myTransfers = (resident.transfers ?? []).concat(
    (transfers.data ?? []).filter((t) => t.resident_id === resident.id)
  )

  const caseCount = myCases.reduce((s, c) => s + (c.count ?? 1), 0)

  const stages: { code: string; title: string; caption: string; state: StageState; to?: string; detail?: string }[] = [
    {
      code: "B", title: "Resident Profile", caption: "Created by the Training Officer",
      state: "done", to: "/residents",
      detail: `${name} · ${resident.track} · accepted ${resident.date_accepted ?? "—"}`,
    },
    {
      code: "C", title: "Year Level & Completion", caption: "Year level is derived from Date Accepted",
      state: resident.year_level ? "done" : "empty", to: "/residents",
      detail: resident.year_level ? `Year ${resident.year_level}` : "Year level not yet computed",
    },
    {
      code: "D", title: "Rotation Plan", caption: "Assigned to monthly rotation blocks",
      state: myRotations.length ? "done" : "empty", to: "/rotations",
      detail: myRotations.length ? `${myRotations.length} rotation block(s) assigned` : "No rotation assigned yet",
    },
    {
      code: "E/F", title: "Cases & Procedures", caption: "Encoded case logs (conferences/duties planned)",
      state: myCases.length ? "done" : "empty", to: "/case-logs",
      detail: myCases.length ? `${myCases.length} log(s), ${caseCount} case(s) total` : "No case logs recorded",
    },
    {
      code: "G/H/I", title: "Consultant Review", caption: "Validation & return-for-correction loop",
      state: "planned",
    },
    {
      code: "K", title: "Examinations & RISE", caption: "Quiz/exam results drive promotion status",
      state: myQuizzes.length ? "done" : "empty", to: "/evaluation",
      detail: myQuizzes.length
        ? `${myQuizzes.length} exam(s) recorded · promotion ${resident.promotion_status ?? "not evaluated"}`
        : "No exam results recorded",
    },
    {
      code: "L", title: "Research Outputs", caption: "Case reports and research papers",
      state: myPapers.length ? "done" : "empty", to: "/research",
      detail: myPapers.length ? `${myPapers.length} paper(s)` : "No research recorded",
    },
    {
      code: "M", title: "Consultant Evaluation", caption: "Periodic evaluation form",
      state: "planned",
    },
    {
      code: "N/O", title: "Completion & Remediation", caption: "Promotion gate and remediation plan",
      state: "planned",
    },
    {
      code: "Transfer", title: "Residency Transfer", caption: "Move to another institution",
      state: myTransfers.length ? "done" : "empty", to: "/transfers",
      detail: myTransfers.length
        ? `${myTransfers.length} transfer record(s)`
        : "No transfer requested",
    },
    {
      code: "U", title: "Portfolio Archive", caption: "Final-year review & archive",
      state: "planned",
    },
  ]

  const doneCount = stages.filter((s) => s.state === "done").length
  const plannedCount = stages.filter((s) => s.state === "planned").length

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Resident Lifecycle — ${name}`}
        description="End-to-end progression per the residency training flowchart"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/residents")}>
            Back to Residents
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Track" value={resident.track} />
        <StatCard label="Year Level" value={resident.year_level ? String(resident.year_level) : "—"} />
        <StatCard label="Stages Done" value={`${doneCount}/${stages.length}`} tone="ok" />
        <StatCard label="Planned (deferred)" value={String(plannedCount)} tone="warn" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Flow</CardTitle>
          <CardDescription>
            Greyed “Planned” stages are part of the flowchart but not yet built in the backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stages.map((s) => (
            <StageRow key={s.code} {...s} />
          ))}
        </CardContent>
      </Card>

      {plannedCount > 0 && (
        <EmptyHint>
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-500" />
            {plannedCount} flowchart stage(s) are planned but not yet implemented (consultant review,
            consultant evaluation, remediation, archive).
          </span>
        </EmptyHint>
      )}
    </div>
  )
}
