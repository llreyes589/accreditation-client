import * as React from "react"
import { CheckCircle2, Circle, Send, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useAccreditations, useSubmitAccreditation, useDocuments } from "@/api/hooks"
import { statusLabel, ACCREDITATION_DOC_TYPES, type ChecklistItem } from "@/api/types"
import { ApiError } from "@/api/client"
import { cn } from "@/lib/utils"

/** The checklist the institution fills before submitting. Each item maps to a required document. */
const CHECKLIST = ACCREDITATION_DOC_TYPES.map((d) => ({ label: d.label, doc: d.value }))

const ALL_ITEMS = CHECKLIST.flatMap((s) => s.label)

export default function AccreditationPage() {
  const q = useAccreditations()
  const submit = useSubmitAccreditation()
  const docsQ = useDocuments()
  const [checked, setChecked] = React.useState<Record<string, boolean>>({})
  const [err, setErr] = React.useState<string | null>(null)

  if (q.isLoading) return <Loading label="Loading accreditations…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const history = q.data ?? []
  const latest = history[0]
  const done = ALL_ITEMS.filter((i) => checked[i]).length
  const pct = Math.round((done / ALL_ITEMS.length) * 100)
  const hasPending = latest?.status === "pending"
  // A still-valid (approved) accreditation blocks a new/renew application.
  const isValidHeld = latest?.status === "approved" && !!latest?.valid_until && new Date(latest.valid_until).getTime() > Date.now()

  const uploaded = new Set<string>((docsQ.data ?? []).map((d) => d.type))
  const missing = ACCREDITATION_DOC_TYPES.filter((d) => !uploaded.has(d.value))
  const canSubmit = missing.length === 0 && !hasPending && !isValidHeld

  const submissionType =
    latest?.valid_until && new Date(latest.valid_until).getTime() > Date.now() &&
    new Date(latest.valid_until).getTime() <= Date.now() + 90 * 86_400_000
      ? "Renew"
      : "New"

  async function onSubmit() {
    setErr(null)
    const snapshot: ChecklistItem[] = ALL_ITEMS.map((label) => ({
      label,
      done: Boolean(checked[label]),
    }))
    try {
      await submit.mutateAsync(snapshot)
      setChecked({})
    } catch (e) {
      setErr(e instanceof ApiError ? e.firstError : "Submission failed.")
    }
  }

  return (
    <>
      <PageHeader
        title="Accreditation"
        description={`Complete the checklist and submit for Accreditor and Admin review · This is a ${submissionType} application`}
        actions={
          <Button size="sm" onClick={onSubmit} disabled={submit.isPending || !canSubmit}>
            {submit.isPending ? <Loader2 className="animate-spin" /> : <Send />}
            {hasPending ? "Submission pending" : "Submit for review"}
          </Button>
        }
      />

      {err && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {err}
        </p>
      )}

      {isValidHeld && (
        <p className="mb-4 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-700">
          Your institution already holds a valid accreditation{latest?.valid_until ? ` until ${new Date(latest.valid_until).toISOString().slice(0, 10)}` : ""}. A new or renewal application cannot be submitted unless the current one is rejected.
        </p>
      )}

      <Card>
        <CardContent className="py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-semibold">Checklist Progress</h2>
                {latest && <StatusBadge status={statusLabel(latest.status)} />}
              </div>
              <p className="mt-1 text-[13px] text-slate-500">
                {done} of {ALL_ITEMS.length} items marked complete
                {latest?.valid_until ? ` · current cycle valid until ${latest.valid_until}` : ""}
              </p>
              <Progress value={pct} className="mt-3" />
            </div>
            <div className="shrink-0 rounded border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="label-caps">Completion</p>
              <p className="font-display text-3xl font-bold text-brand">{pct}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist" className="mt-4">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Required Documents Checklist</CardTitle>
              <CardDescription>
                Tick each item after uploading the matching file under <strong>Documents</strong>.
                All 9 must be uploaded before you can submit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {CHECKLIST.map((item) => {
                const isUploaded = uploaded.has(item.doc)
                const isChecked = checked[item.label]
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setChecked((c) => ({ ...c, [item.label]: !c[item.label] }))}
                    className="flex w-full items-center gap-2.5 rounded px-1 py-1.5 text-left transition-colors hover:bg-slate-50"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-slate-300" />
                    )}
                    <span className={cn("text-[13px]", isChecked ? "font-medium text-ink" : "text-slate-500")}>
                      {item.label}
                    </span>
                    {isUploaded && (
                      <span className="ml-auto text-[11px] font-medium text-emerald-600">Uploaded</span>
                    )}
                  </button>
                )
              })}
            </CardContent>
          </Card>
          {missing.length > 0 && (
            <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              Missing documents: {missing.map((d) => d.label).join(", ")}. Upload them under{" "}
              <strong>Documents</strong> to enable submission.
            </p>
          )}
          <p className="mt-3 text-[12px] text-slate-500">
            Submitting sends this checklist to the Admin queue as{" "}
            <code className="data-mono">checklist_snapshot</code>.
          </p>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Accreditation History</CardTitle>
              <CardDescription>Validity term is configured by the Admin</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <Empty>No accreditation submissions yet.</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Valid From</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="data-mono">ACC-{a.id}</TableCell>
                        <TableCell className="data-mono">
                          {(a.checklist_snapshot ?? []).filter((i) => i.done).length}
                          /{(a.checklist_snapshot ?? []).length}
                        </TableCell>
                        <TableCell className="data-mono">{a.valid_from ?? "—"}</TableCell>
                        <TableCell className="data-mono">{a.valid_until ?? "—"}</TableCell>
                        <TableCell><StatusBadge status={statusLabel(a.status)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-[12px] text-slate-500">
                Approved cycles set validity automatically from the approval date.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
