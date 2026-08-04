import * as React from "react"
import { Plus, Loader2 } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input, Label, Select } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useCaseLogs, useCreateCaseLog, useResidents } from "@/api/hooks"
import { ApiError } from "@/api/client"

export default function CaseLogsPage() {
  const q = useCaseLogs()
  const residents = useResidents()
  const [type, setType] = React.useState("All")

  if (q.isLoading) return <Loading label="Loading case logs…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []
  const names = new Map((residents.data ?? []).map((r) => [r.id, r.user?.name ?? `Resident #${r.id}`]))
  const types = Array.from(new Set(all.map((c) => c.case_type)))
  const rows = all.filter((c) => type === "All" || c.case_type === type)
  const total = all.reduce((s, c) => s + (c.count ?? 1), 0)

  return (
    <>
      <PageHeader
        title="Case Logs"
        description="Encoded cases across all residents in your institution"
        actions={<CreateCaseDialog />}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Cases" value={String(total)} />
        <StatCard label="Log Entries" value={String(all.length)} />
        <StatCard label="Case Types" value={String(types.length)} />
        <StatCard label="Residents Logging" value={String(new Set(all.map((c) => c.resident_id)).size)} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Case Log Registry</CardTitle>
          <CardDescription>Counts contribute to resident performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-56">
            <option>All</option>
            {types.map((t) => <option key={t}>{t}</option>)}
          </Select>

          {rows.length === 0 ? (
            <Empty>No case logs encoded yet.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logged</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Case Type</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="data-mono">
                      {c.logged_at ? new Date(c.logged_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {names.get(c.resident_id) ?? `Resident #${c.resident_id}`}
                    </TableCell>
                    <TableCell><Badge variant="outline">{c.case_type}</Badge></TableCell>
                    <TableCell className="max-w-[240px] truncate text-slate-600">
                      {c.procedure ?? "—"}
                    </TableCell>
                    <TableCell className="data-mono text-right">{c.count ?? 1}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function CreateCaseDialog() {
  const mut = useCreateCaseLog()
  const residents = useResidents()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus /> Encode Case</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Encode case log</DialogTitle>
          <DialogDescription>Recorded against a resident in your institution.</DialogDescription>
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
                case_type: String(f.get("case_type")),
                procedure: String(f.get("procedure") || "") || undefined,
                count: f.get("count") ? Number(f.get("count")) : undefined,
                logged_at: String(f.get("logged_at") || "") || undefined,
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
          <div className="space-y-1.5">
            <Label>Case Type</Label>
            <Input name="case_type" required placeholder="e.g. Class A, Frozen Section" />
          </div>
          <div className="space-y-1.5"><Label>Procedure</Label><Input name="procedure" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Count</Label><Input name="count" type="number" min={1} defaultValue={1} /></div>
            <div className="space-y-1.5"><Label>Logged At</Label><Input name="logged_at" type="date" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Encode
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
