import * as React from "react"
import { Plus, Loader2 } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input, Label, Select, Textarea } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import { usePapers, useCreatePaper, useResidents } from "@/api/hooks"
import { ApiError } from "@/api/client"

export default function ResearchPage() {
  const q = usePapers()
  const residents = useResidents()

  if (q.isLoading) return <Loading label="Loading research papers…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []
  const names = new Map((residents.data ?? []).map((r) => [r.id, r.user?.name ?? `Resident #${r.id}`]))
  const stages = Array.from(new Set(all.map((p) => p.stage)))

  return (
    <>
      <PageHeader
        title="Research"
        description="Protocols, case reports and papers submitted by residents"
        actions={<CreatePaperDialog />}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Papers" value={String(all.length)} />
        <StatCard label="Distinct Stages" value={String(stages.length)} />
        <StatCard label="Residents Involved" value={String(new Set(all.map((p) => p.resident_id)).size)} />
        <StatCard label="With Notes" value={String(all.filter((p) => p.notes).length)} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Research Registry</CardTitle>
          <CardDescription>Stage tracks progression toward completion</CardDescription>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <Empty>No research papers recorded.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="max-w-[300px] truncate font-semibold">{p.title}</p>
                      <p className="data-mono text-slate-400">RSH-{p.id}</p>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {names.get(p.resident_id) ?? `Resident #${p.resident_id}`}
                    </TableCell>
                    <TableCell><Badge variant="info">{p.stage}</Badge></TableCell>
                    <TableCell className="max-w-[240px] truncate text-slate-600">{p.notes ?? "—"}</TableCell>
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

function CreatePaperDialog() {
  const mut = useCreatePaper()
  const residents = useResidents()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus /> Add Research</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add research paper</DialogTitle>
          <DialogDescription>Linked to a resident in your institution.</DialogDescription>
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
                title: String(f.get("title")),
                stage: String(f.get("stage")),
                notes: String(f.get("notes") || "") || undefined,
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
          <div className="space-y-1.5"><Label>Title</Label><Input name="title" required /></div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Input name="stage" required placeholder="e.g. Protocol, Under Review, Published" />
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea name="notes" rows={3} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
