import * as React from "react"
import { Plus, Loader2, ClipboardCheck, Star } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input, Label, Select } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useQuizzes, useCreateQuiz, useRecordResult, useResidents, useConsultants, useCreateConsultantEvaluation } from "@/api/hooks"
import type { Quiz, Consultant } from "@/api/types"
import { ApiError } from "@/api/client"

export default function EvaluationPage() {
  const q = useQuizzes()

  if (q.isLoading) return <Loading label="Loading assessments…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []
  const results = all.flatMap((x) => x.results ?? [])
  const exams = all.filter((x) => x.type === "exam").length

  return (
    <>
      <PageHeader
        title="Quizzes & Exams"
        description="Scores drive promotion eligibility against the configured thresholds"
        actions={<><RecordEvaluationDialog /><CreateQuizDialog /></>}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Assessments" value={String(all.length)} />
        <StatCard label="Exams" value={String(exams)} />
        <StatCard label="Quizzes" value={String(all.length - exams)} />
        <StatCard label="Results Recorded" value={String(results.length)} />
      </div>

      {all.length === 0 ? (
        <Card className="mt-4"><CardContent><Empty>No quizzes or exams created yet.</Empty></CardContent></Card>
      ) : (
        <div className="mt-4 space-y-4">
          {all.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} />)}
        </div>
      )}
    </>
  )
}

function QuizCard({ quiz }: { quiz: Quiz }) {
  const residents = useResidents()
  const names = new Map((residents.data ?? []).map((r) => [r.id, r.user?.name ?? `Resident #${r.id}`]))
  const results = quiz.results ?? []
  const avg = results.length
    ? Math.round((results.reduce((s, r) => s + Number(r.score), 0) / results.length) * 10) / 10
    : 0

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            {quiz.title}
            <Badge variant={quiz.type === "exam" ? "navy" : "info"}>{quiz.type}</Badge>
          </CardTitle>
          <CardDescription>
            Max score {quiz.max_score} · {results.length} result{results.length === 1 ? "" : "s"}
            {results.length ? ` · average ${avg}` : ""}
          </CardDescription>
        </div>
        <RecordResultDialog quiz={quiz} />
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <Empty>No results recorded for this assessment.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Taken</TableHead>
                <TableHead className="w-48">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => {
                const pct = Math.round((Number(r.score) / Number(quiz.max_score)) * 100)
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold">
                      {names.get(r.resident_id) ?? `Resident #${r.resident_id}`}
                    </TableCell>
                    <TableCell className="data-mono">
                      {r.taken_at ? new Date(r.taken_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={pct}
                          className="w-24"
                          indicatorClassName={pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-brand" : "bg-amber-500"}
                        />
                        <span className="data-mono">{r.score}/{quiz.max_score}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function CreateQuizDialog() {
  const mut = useCreateQuiz()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus /> New Assessment</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create quiz or exam</DialogTitle>
          <DialogDescription>Belongs to your institution.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const f = new FormData(e.currentTarget)
            try {
              await mut.mutateAsync({
                title: String(f.get("title")),
                type: String(f.get("type")) as "quiz" | "exam" | "rise",
                max_score: Number(f.get("max_score")),
              })
              setOpen(false)
            } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Title</Label><Input name="title" required /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select name="type" defaultValue="quiz">
                <option value="quiz">Quiz</option><option value="exam">Exam</option><option value="rise">RISE</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Max Score</Label>
              <Input name="max_score" type="number" min={1} defaultValue={100} required />
            </div>
          </div>
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

function RecordResultDialog({ quiz }: { quiz: Quiz }) {
  const mut = useRecordResult()
  const residents = useResidents()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><ClipboardCheck /> Record score</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record result</DialogTitle>
          <DialogDescription>
            {quiz.title} — recording a score re-evaluates the resident's promotion status.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const f = new FormData(e.currentTarget)
            try {
              await mut.mutateAsync({
                quizId: quiz.id,
                resident_id: Number(f.get("resident_id")),
                score: Number(f.get("score")),
                taken_at: String(f.get("taken_at") || "") || undefined,
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
              {(residents.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>{r.user?.name ?? `Resident #${r.id}`}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Score (max {quiz.max_score})</Label>
              <Input name="score" type="number" min={0} step="0.01" required />
            </div>
            <div className="space-y-1.5"><Label>Taken At</Label><Input name="taken_at" type="date" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Record
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Flowchart node M: record a consultant evaluation for a resident. */
function RecordEvaluationDialog() {
  const mut = useCreateConsultantEvaluation()
  const residents = useResidents()
  const consultants = useConsultants()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Star /> Consultant Evaluation</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record consultant evaluation</DialogTitle>
          <DialogDescription>Periodic evaluation with a continue / remediate recommendation.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const f = new FormData(e.currentTarget)
            try {
              await mut.mutateAsync({
                resident_id: Number(f.get("resident_id")),
                consultant_id: f.get("consultant_id") ? Number(f.get("consultant_id")) : undefined,
                period: String(f.get("period")),
                recommendation: (f.get("recommendation") || undefined) as "continue" | "remediate" | undefined,
                comments: String(f.get("comments") || "") || undefined,
                evaluated_at: String(f.get("evaluated_at") || "") || undefined,
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
              {(residents.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>{r.user?.name ?? `Resident #${r.id}`}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Consultant</Label>
              <Select name="consultant_id" defaultValue="">
                <option value="">—</option>
                {(consultants.data ?? []).map((c: Consultant) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Period</Label><Input name="period" placeholder="e.g. 2026-Q1" required /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Recommendation</Label>
              <Select name="recommendation" defaultValue="">
                <option value="">—</option>
                <option value="continue">Continue</option>
                <option value="remediate">Remediate</option>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Evaluated At</Label><Input name="evaluated_at" type="date" /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Comments</Label>
            <Input name="comments" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
