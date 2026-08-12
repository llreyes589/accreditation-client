import { useParams, useNavigate, Link } from "react-router-dom"
import { useState } from "react"
import type { ReactNode } from "react"
import {
  CheckCircle2, Circle, CircleDashed, AlertTriangle, RotateCcw,
} from "lucide-react"
import { PageHeader, StatCard, EmptyHint } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select, Textarea } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading, ErrorState, Empty } from "@/components/states"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"
import {
  useResidents, useRotations, useCaseLogs, useQuizzes, usePapers, useIncomingTransfers,
  useConsultantReviews, useConsultantEvaluations, useRemediationPlans, usePortfolioArchives,
  useCreateConsultantEvaluation, useCreateRemediationPlan, useUpdateRemediationPlan,
  useCreatePortfolioArchive,
} from "@/api/hooks"
import { ApiError } from "@/api/client"
import type {
  RotationBlock, CaseLog, Quiz, ResearchPaper, ConsultantReview,
  ConsultantEvaluation, RemediationPlan, PortfolioArchive,
} from "@/api/types"

/**
 * Resident lifecycle view — renders the forwarded flowchart for a single resident.
 *
 *   A admitted → B profile → C year level → D rotation plan → E/F cases
 *   → G/H/I consultant review → K exams & RISE → L research → M consultant eval
 *   → N/O remediation → Transfer → U portfolio archive
 *
 * Each stage reads from the module endpoints (now including the four remaining
 * flowchart stages). A stage is "done" when its record exists, "returned" when a
 * consultant review was sent back for correction, or "empty" when not yet recorded.
 */
type StageState = "done" | "empty" | "planned" | "returned"

function StageIcon({ state }: { state: StageState }) {
  if (state === "done") return <CheckCircle2 className="size-5 text-emerald-600" />
  if (state === "planned") return <CircleDashed className="size-5 text-slate-300" />
  if (state === "returned") return <RotateCcw className="size-5 text-amber-600" />
  return <Circle className="size-5 text-slate-300" />
}

function StageRow({
  code, title, caption, state, to, detail, action,
}: {
  code: string
  title: string
  caption: string
  state: StageState
  to?: string
  detail?: string
  action?: ReactNode
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
          {state === "returned" && <Badge variant="outline" className="text-[10px] text-amber-600">Returned</Badge>}
          {state === "empty" && <Badge variant="outline" className="text-[10px] text-amber-600">Not recorded</Badge>}
        </div>
        <p className="mt-0.5 text-[12px] text-slate-500">{caption}</p>
        {detail && <p className="mt-1 text-[12px] text-slate-600">{detail}</p>}
        {to && (
          <Link to={to} className="mt-1 inline-block text-[12px] font-medium text-brand hover:underline">
            Go to {title.split(" ")[0]} →
          </Link>
        )}
        {action}
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
  const reviews = useConsultantReviews()
  const evals = useConsultantEvaluations()
  const remediations = useRemediationPlans()
  const archives = usePortfolioArchives()

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
  const myAssignmentIds = myRotations.flatMap((r) => (r.assignments ?? [])
    .filter((a) => a.resident_id === resident.id)
    .map((a) => a.id))
  const myReviews = (reviews.data ?? []).filter((rv: ConsultantReview) =>
    myAssignmentIds.includes(rv.rotation_assignment_id))
  const myCases = (cases.data ?? []).filter((c: CaseLog) => c.resident_id === resident.id)
  const myQuizzes = (quizzes.data ?? []).filter((q: Quiz) => (q.results ?? []).some((r) => r.resident_id === resident.id))
  const myPapers = (papers.data ?? []).filter((p: ResearchPaper) => p.resident_id === resident.id)
  const myEvals = (evals.data ?? []).filter((e: ConsultantEvaluation) => e.resident_id === resident.id)
  const myRemediation = (remediations.data && (remediations.data ?? []).filter((p: RemediationPlan) => p.resident_id === resident.id)) ?? []
  const myArchives = (archives.data ?? []).filter((a: PortfolioArchive) => a.resident_id === resident.id)
  const myTransfers = (resident.transfers ?? []).concat(
    (transfers.data ?? []).filter((t) => t.resident_id === resident.id)
  )

  const caseCount = myCases.reduce((s, c) => s + (c.count ?? 1), 0)
  const review = myReviews[0]
  const remediation = myRemediation[0]
  const archive = myArchives[0]

  const stages: { code: string; title: string; caption: string; state: StageState; to?: string; detail?: string; action?: ReactNode }[] = [
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
      state: !review ? "empty" : (review.status === "returned" ? "returned" : "done"),
      to: "/rotations",
      detail: !review
        ? "No consultant review recorded yet"
        : review.status === "returned"
          ? `Returned for correction${review.comments ? `: ${review.comments}` : ""}`
          : `Validated${review.comments ? ` — ${review.comments}` : ""}`,
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
      code: "M", title: "Consultant Evaluation", caption: "Periodic evaluation by the consultant",
      state: myEvals.length ? "done" : "empty",
      action: <EvaluationDialog residentId={resident.id} />,
      detail: myEvals.length
        ? `${myEvals.length} evaluation(s) · latest: ${myEvals[0].period}${myEvals[0].recommendation ? ` (${myEvals[0].recommendation})` : ""}`
        : "No consultant evaluation recorded",
    },
    {
      code: "N/O", title: "Completion & Remediation", caption: "Promotion gate and remediation plan",
      state: !remediation ? "empty" : (remediation.status === "completed" || remediation.status === "closed" ? "done" : "returned"),
      action: remediation
        ? <RemediationUpdateDialog plan={remediation} />
        : <RemediationDialog residentId={resident.id} />,
      detail: !remediation
        ? "No remediation plan"
        : `Status: ${remediation.status}${remediation.target_date ? ` · target ${remediation.target_date}` : ""}`,
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
      state: archive ? "done" : "empty",
      action: <ArchiveDialog residentId={resident.id} />,
      detail: archive
        ? `Archived ${archive.archived_at ?? "—"} · ${archive.status}`
        : "Portfolio not yet archived",
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
        <StatCard label="Awaiting / Returned" value={String(stages.filter((s) => s.state === "empty" || s.state === "returned").length)} tone="warn" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Flow</CardTitle>
          <CardDescription>
            Each stage reflects the matching module record. Use the buttons to record the
            consultant review (Rotations), evaluation, remediation, and archive.
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
            {plannedCount} flowchart stage(s) are not yet implemented.
          </span>
        </EmptyHint>
      )}
    </div>
  )
}

/* ---------- M: Consultant evaluation ---------- */
function EvaluationDialog({ residentId }: { residentId: number }) {
  const mut = useCreateConsultantEvaluation()
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-1">{mut.isPending ? "Saving…" : "Add evaluation"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consultant evaluation</DialogTitle>
          <DialogDescription>Periodic evaluation of the resident by the consultant.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault(); setErr(null)
          const f = new FormData(e.currentTarget)
          try {
            await mut.mutateAsync({
              resident_id: residentId,
              period: String(f.get("period")),
              comments: String(f.get("comments") || "") || undefined,
              recommendation: (f.get("recommendation") || undefined) as "continue" | "remediate" | undefined,
              evaluated_at: String(f.get("evaluated_at") || "") || undefined,
            })
            setOpen(false)
          } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
        }}>
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Period</Label><Input name="period" required placeholder="e.g. 2026 Q1 / Rotation 3" /></div>
          <div className="space-y-1.5"><Label>Comments</Label><Textarea name="comments" rows={3} /></div>
          <div className="space-y-1.5">
            <Label>Recommendation</Label>
            <Select name="recommendation" defaultValue="">
              <option value="">—</option>
              <option value="continue">Continue</option>
              <option value="remediate">Remediate</option>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Evaluated At</Label><Input name="evaluated_at" type="date" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- N/O: Remediation ---------- */
function RemediationDialog({ residentId }: { residentId: number }) {
  const mut = useCreateRemediationPlan()
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-1">{mut.isPending ? "Saving…" : "Add remediation"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remediation plan</DialogTitle>
          <DialogDescription>Created when requirements are not yet met.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault(); setErr(null)
          const f = new FormData(e.currentTarget)
          try {
            await mut.mutateAsync({
              resident_id: residentId,
              reason: String(f.get("reason")),
              plan: String(f.get("plan")),
              target_date: String(f.get("target_date") || "") || undefined,
            })
            setOpen(false)
          } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
        }}>
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Reason</Label><Textarea name="reason" rows={2} required /></div>
          <div className="space-y-1.5"><Label>Plan</Label><Textarea name="plan" rows={3} required /></div>
          <div className="space-y-1.5"><Label>Target Date</Label><Input name="target_date" type="date" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RemediationUpdateDialog({ plan }: { plan: RemediationPlan }) {
  const mut = useUpdateRemediationPlan()
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-1">Update status</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remediation status</DialogTitle>
          <DialogDescription>{plan.reason}</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault()
          const f = new FormData(e.currentTarget)
          await mut.mutateAsync({
            id: plan.id,
            status: String(f.get("status")) as RemediationPlan["status"],
            plan: String(f.get("plan") || plan.plan) || undefined,
            target_date: String(f.get("target_date") || plan.target_date || "") || undefined,
          })
          setOpen(false)
        }}>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select name="status" defaultValue={plan.status}>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Plan</Label><Textarea name="plan" rows={3} defaultValue={plan.plan} /></div>
          <div className="space-y-1.5"><Label>Target Date</Label><Input name="target_date" type="date" defaultValue={plan.target_date ?? ""} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>Update</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- U: Portfolio archive ---------- */
function ArchiveDialog({ residentId }: { residentId: number }) {
  const mut = useCreatePortfolioArchive()
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-1">{mut.isPending ? "Saving…" : "Archive portfolio"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive portfolio</DialogTitle>
          <DialogDescription>Final-year portfolio review &amp; archive.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault(); setErr(null)
          const f = new FormData(e.currentTarget)
          try {
            await mut.mutateAsync({
              resident_id: residentId,
              summary: String(f.get("summary") || "") || undefined,
              status: (f.get("status") || "archived") as "archived" | "sealed",
              archived_at: String(f.get("archived_at") || "") || undefined,
            })
            setOpen(false)
          } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
        }}>
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Summary</Label><Textarea name="summary" rows={3} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select name="status" defaultValue="archived">
                <option value="archived">Archived</option>
                <option value="sealed">Sealed</option>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Archived At</Label><Input name="archived_at" type="date" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>Archive</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
