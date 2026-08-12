import * as React from "react"
import { Plus, Loader2, UserPlus, Check } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select, Textarea } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import {
  useRotations, useCreateRotation, useConsultants, useResidents,
  useAssignRotation, useUpdateAssignment, useConsultantReviews, useCreateConsultantReview,
} from "@/api/hooks"
import { statusLabel, type RotationBlock, type ConsultantReview } from "@/api/types"
import { ApiError } from "@/api/client"

/** Backend requires starts_at = first day and ends_at = last day of a calendar month. */
function monthBounds(ym: string) {
  const [y, m] = ym.split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 0))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { starts_at: iso(start), ends_at: iso(end) }
}

export default function RotationsPage() {
  const q = useRotations()

  if (q.isLoading) return <Loading label="Loading rotations…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []
  const assignments = all.flatMap((r) => r.assignments ?? [])
  const completed = assignments.filter((a) => a.status === "completed").length
  const graded = assignments.filter((a) => a.grade != null)
  const avg = graded.length
    ? Math.round((graded.reduce((s, a) => s + Number(a.grade), 0) / graded.length) * 10) / 10
    : 0

  return (
    <>
      <PageHeader
        title="Rotations"
        description="Monthly rotation blocks, consultant assignment and grading"
        actions={<CreateRotationDialog />}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Rotation Blocks" value={String(all.length)} />
        <StatCard label="Assignments" value={String(assignments.length)} />
        <StatCard label="Completed" value={String(completed)} tone="ok" />
        <StatCard label="Average Grade" value={avg ? String(avg) : "—"} />
      </div>

      {all.length === 0 ? (
        <Card className="mt-4"><CardContent><Empty>No rotation blocks created yet.</Empty></CardContent></Card>
      ) : (
        <div className="mt-4 space-y-4">
          {all.map((r) => <RotationCard key={r.id} rotation={r} />)}
        </div>
      )}
    </>
  )
}

function RotationCard({ rotation }: { rotation: RotationBlock }) {
  const update = useUpdateAssignment()
  const reviews = useConsultantReviews()
  const assignments = rotation.assignments ?? []

  const reviewFor = (assignmentId: number) =>
    (reviews.data ?? []).find((rv: ConsultantReview) => rv.rotation_assignment_id === assignmentId)

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{rotation.title}</CardTitle>
          <CardDescription>
            {rotation.category} · {rotation.starts_at} → {rotation.ends_at}
            {rotation.consultant ? ` · ${rotation.consultant.name}` : ""}
          </CardDescription>
        </div>
        <AssignDialog rotation={rotation} />
      </CardHeader>
      <CardContent className="space-y-2">
        {assignments.length === 0 && <Empty>No residents assigned to this block.</Empty>}
        {assignments.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-2 rounded border border-slate-200 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">
                {a.resident?.user?.name ?? `Resident #${a.resident_id}`}
              </p>
              <p className="data-mono text-slate-400">
                grade {a.grade ?? "—"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={statusLabel(a.status)} />
              <ReviewDialog assignmentId={a.id} existing={reviewFor(a.id)} />
              {a.status !== "completed" && (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const grade = Number(new FormData(e.currentTarget).get("grade"))
                    update.mutate({
                      assignmentId: a.id,
                      status: "completed",
                      grade: Number.isFinite(grade) ? grade : undefined,
                    })
                  }}
                >
                  <Input name="grade" type="number" min={0} step="0.01" placeholder="Grade" className="h-8 w-24" />
                  <Button size="sm" type="submit" disabled={update.isPending}>
                    <Check /> Complete
                  </Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function CreateRotationDialog() {
  const mut = useCreateRotation()
  const consultants = useConsultants()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus /> Create Rotation</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create rotation block</DialogTitle>
          <DialogDescription>
            Rotations must cover a full calendar month — pick the month and the dates are derived.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const f = new FormData(e.currentTarget)
            const { starts_at, ends_at } = monthBounds(String(f.get("month")))
            try {
              await mut.mutateAsync({
                title: String(f.get("title")),
                category: String(f.get("category")),
                starts_at,
                ends_at,
                consultant_id: f.get("consultant_id") ? Number(f.get("consultant_id")) : undefined,
                notes: String(f.get("notes") || "") || undefined,
              })
              setOpen(false)
            } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Title</Label><Input name="title" required /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Category</Label><Input name="category" required placeholder="e.g. Surgical Pathology" /></div>
            <div className="space-y-1.5"><Label>Month</Label><Input name="month" type="month" required /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Consultant</Label>
            <Select name="consultant_id" defaultValue="">
              <option value="">Unassigned</option>
              {(consultants.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea name="notes" rows={2} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AssignDialog({ rotation }: { rotation: RotationBlock }) {
  const mut = useAssignRotation()
  const residents = useResidents()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)
  const assigned = new Set((rotation.assignments ?? []).map((a) => a.resident_id))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><UserPlus /> Assign resident</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign resident</DialogTitle>
          <DialogDescription>{rotation.title}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const f = new FormData(e.currentTarget)
            try {
              await mut.mutateAsync({
                rotationId: rotation.id,
                resident_id: Number(f.get("resident_id")),
              })
              setOpen(false)
            } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5">
            <Label>Resident</Label>
            <Select name="resident_id" required defaultValue="">
              <option value="" disabled>Select…</option>
              {(residents.data ?? [])
                .filter((r) => !assigned.has(r.id))
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.user?.name ?? `Resident #${r.id}`}
                  </option>
                ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Assign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* G/H/I: consultant review on a rotation assignment (validate or return for correction). */
function ReviewDialog({ assignmentId, existing }: { assignmentId: number; existing?: ConsultantReview }) {
  const mut = useCreateConsultantReview()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)
  const label = existing ? (existing.status === "returned" ? "Returned" : "Validated") : "Review"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consultant review</DialogTitle>
          <DialogDescription>
            Validate the resident's work for this rotation, or return it for correction.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault(); setErr(null)
            const f = new FormData(e.currentTarget)
            try {
              await mut.mutateAsync({
                rotation_assignment_id: assignmentId,
                status: String(f.get("status")) as "validated" | "returned",
                comments: String(f.get("comments") || "") || undefined,
              })
              setOpen(false)
            } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5">
            <Label>Verdict</Label>
            <Select name="status" defaultValue={existing?.status ?? "validated"}>
              <option value="validated">Validated</option>
              <option value="returned">Return for correction</option>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Comments</Label><Textarea name="comments" rows={3} defaultValue={existing?.comments ?? ""} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>Save review</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
