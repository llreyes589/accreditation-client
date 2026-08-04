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
import { useAccreditations, useSubmitAccreditation } from "@/api/hooks"
import { statusLabel, type ChecklistItem } from "@/api/types"
import { ApiError } from "@/api/client"
import { cn } from "@/lib/utils"

/** The checklist the institution fills before submitting. Sent as checklist_snapshot. */
const CHECKLIST: { section: string; items: string[] }[] = [
  {
    section: "Institutional Documents",
    items: [
      "LTO Clinical Laboratory",
      "LTO BSF",
      "Chairman Designation",
      "PSP Certificate",
    ],
  },
  { section: "Facilities", items: ["Floor Plan", "Organization Chart"] },
  {
    section: "Training Program",
    items: ["Rotation Schedule", "Conference Schedule", "Activity Schedule"],
  },
]

const ALL_ITEMS = CHECKLIST.flatMap((s) => s.items)

export default function AccreditationPage() {
  const q = useAccreditations()
  const submit = useSubmitAccreditation()
  const [checked, setChecked] = React.useState<Record<string, boolean>>({})
  const [err, setErr] = React.useState<string | null>(null)

  if (q.isLoading) return <Loading label="Loading accreditations…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const history = q.data ?? []
  const latest = history[0]
  const done = ALL_ITEMS.filter((i) => checked[i]).length
  const pct = Math.round((done / ALL_ITEMS.length) * 100)
  const hasPending = latest?.status === "pending"

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
        description="Complete the checklist and submit for Accreditor and Admin review"
        actions={
          <Button size="sm" onClick={onSubmit} disabled={submit.isPending || hasPending}>
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {CHECKLIST.map((sec) => (
              <Card key={sec.section}>
                <CardHeader>
                  <CardTitle>{sec.section}</CardTitle>
                  <CardDescription>
                    {sec.items.filter((i) => checked[i]).length}/{sec.items.length} complete
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {sec.items.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setChecked((c) => ({ ...c, [label]: !c[label] }))}
                      className="flex w-full items-center gap-2.5 rounded px-1 py-1.5 text-left transition-colors hover:bg-slate-50"
                    >
                      {checked[label] ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-slate-300" />
                      )}
                      <span
                        className={cn(
                          "text-[13px]",
                          checked[label] ? "font-medium text-ink" : "text-slate-500"
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-slate-500">
            Supporting files are managed under <strong>Documents</strong>. Submitting sends this
            checklist to the Admin queue as <code className="data-mono">checklist_snapshot</code>.
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
