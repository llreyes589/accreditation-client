import * as React from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading, ErrorState, Empty } from "@/components/states"
import {
  usePendingInspections,
  useGetChecklistItems,
  useSubmitInspection,
} from "@/api/hooks"
import type { InspectionChecklistItem } from "@/api/types"
import { ApiError } from "@/api/client"

const SECTION_TITLES: Record<string, string> = {
  A: "A. General Requirements",
  B: "B. Staffing Requirements",
  C: "C. Training Program",
  D: "D. Anatomic Pathology",
  E: "E. Clinical Pathology",
  F: "F. Other Requirements",
  G: "G. Resident's Portfolio",
  H: "H. Reference Materials",
  I: "I. External Evaluation",
}

type Answer = { compliant: boolean; notes: string }
type Answers = Record<string, Answer>

function InspectionList() {
  const q = usePendingInspections()
  const nav = useNavigate()
  if (q.isLoading) return <Loading label="Loading inspections…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />
  const list = q.data ?? []
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Inspections</CardTitle>
        <CardDescription>Accreditations awaiting a CART inspection</CardDescription>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <Empty>No inspections scheduled.</Empty>
        ) : (
          <div className="space-y-2">
            {list.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="font-semibold">{a.institution?.name ?? `Institution #${a.institution_id}`}</p>
                  <p className="data-mono text-slate-400">
                    ACC-{a.id}
                    {a.inspection_scheduled_at ? ` · ${a.inspection_scheduled_at.slice(0, 10)}` : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => nav(`/inspection/${a.id}`)}>
                  <ClipboardCheck /> Capture checklist
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InspectionForm({ id }: { id: string }) {
  const itemsQ = useGetChecklistItems()
  const submit = useSubmitInspection()
  const [answers, setAnswers] = React.useState<Answers>({})
  const [err, setErr] = React.useState<string | null>(null)

  if (itemsQ.isLoading) return <Loading label="Loading checklist…" />
  if (itemsQ.error) return <ErrorState error={itemsQ.error} onRetry={itemsQ.refetch} />

  const items = itemsQ.data as InspectionChecklistItem[]
  const bySection: Record<string, InspectionChecklistItem[]> = {}
  for (const it of items) {
    ;(bySection[it.section] ??= []).push(it)
  }

  const setAnswer = (itemId: number, patch: Partial<Answer>) =>
    setAnswers((prev) => ({ ...prev, [itemId]: { compliant: prev[itemId]?.compliant ?? true, notes: prev[itemId]?.notes ?? "", ...patch } }))

  const allAnswered = items.every((it) => answers[it.id] !== undefined)
  const answeredCount = items.filter((it) => answers[it.id] !== undefined).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Checklist — ACC-{id}</CardTitle>
        <CardDescription>
          Mark each criterion compliant (Yes/No) and add notes where needed. All {items.length} items must be answered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
        {Object.keys(SECTION_TITLES)
          .filter((s) => bySection[s]?.length)
          .map((s) => (
            <div key={s}>
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
                {SECTION_TITLES[s]}
              </h3>
              <div className="space-y-3">
                {bySection[s].map((it) => {
                  const ans = answers[it.id]
                  return (
                    <div key={it.id} className="rounded border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-800">
                            {it.code ? `${it.code} ` : ""}
                            {it.criterion}
                          </p>
                          {it.is_major && <Badge variant="default" className="mt-1">Major</Badge>}
                          {it.notes_hint && (
                            <p className="mt-1 text-[12px] text-slate-400">{it.notes_hint}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant={ans?.compliant ? "default" : "outline"}
                            onClick={() => setAnswer(it.id, { compliant: true })}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant={ans && !ans.compliant ? "destructive" : "outline"}
                            onClick={() => setAnswer(it.id, { compliant: false })}
                          >
                            No
                          </Button>
                        </div>
                      </div>
                      {ans !== undefined && (
                        <textarea
                          className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-[12px]"
                          rows={2}
                          placeholder="Notes for this item…"
                          value={ans.notes}
                          onChange={(e) => setAnswer(it.id, { notes: e.target.value })}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-[12px] text-slate-500">{answeredCount}/{items.length} answered</span>
          <Button
            disabled={!allAnswered || submit.isPending}
            onClick={async () => {
              setErr(null)
              const payload: Record<string, { compliant: boolean; notes?: string }> = {}
              for (const it of items) {
                const a = answers[it.id]
                payload[String(it.id)] = { compliant: a.compliant, notes: a.notes || undefined }
              }
              try {
                await submit.mutateAsync({ id: Number(id), answers: payload })
              } catch (e) {
                setErr(e instanceof ApiError ? e.firstError : "Failed to submit inspection.")
              }
            }}
          >
            {submit.isPending && <Loader2 className="animate-spin" />}
            <CheckCircle2 /> Submit inspection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function InspectionPage() {
  const { id } = useParams()
  return (
    <>
      <PageHeader
        title="Accreditation Inspection"
        description="Capture the CART checklist for scheduled accreditations"
        actions={
          <Link to="/inspection">
            <Button variant="outline" size="sm">Back to list</Button>
          </Link>
        }
      />
      {id ? <InspectionForm id={id} /> : <InspectionList />}
    </>
  )
}
