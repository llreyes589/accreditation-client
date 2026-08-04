import * as React from "react"
import { Plus, Loader2, Upload, FileText } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input, Label, Select, Textarea } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import {
  useConsultants, useCreateConsultant, useConsultantDocuments, useUploadConsultantDocument,
} from "@/api/hooks"
import { trackLabel, type Track } from "@/api/types"
import { ApiError } from "@/api/client"
import { API_URL } from "@/api/client"

const storageUrl = (p: string) => `${API_URL.replace(/\/api$/, "")}/storage/${p}`

export default function ConsultantsPage() {
  const q = useConsultants()
  const [docsFor, setDocsFor] = React.useState<number | null>(null)

  if (q.isLoading) return <Loading label="Loading consultants…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []
  const byTrack = (t: Track) => all.filter((c) => c.specialty === t).length

  return (
    <>
      <PageHeader
        title="Consultants"
        description="Roster and supporting documents for your institution"
        actions={<CreateConsultantDialog />}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Consultants" value={String(all.length)} />
        <StatCard label="AP" value={String(byTrack("AP"))} />
        <StatCard label="CP" value={String(byTrack("CP"))} />
        <StatCard label="AP/CP" value={String(byTrack("AP_CP"))} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Consultant Roster</CardTitle>
          <CardDescription>Licenses expire every January 1; contracts use their own date</CardDescription>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <Empty>No consultants yet. Add your first one.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consultant</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Credentials</TableHead>
                  <TableHead className="text-right">Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-semibold">{c.name}</p>
                      <p className="data-mono text-slate-400">CON-{c.id}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline">{trackLabel(c.specialty)}</Badge></TableCell>
                    <TableCell className="max-w-[280px] truncate text-slate-600">
                      {c.credentials ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDocsFor(c.id)}>
                        <FileText /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConsultantDocsDialog id={docsFor} onClose={() => setDocsFor(null)} />
    </>
  )
}

function CreateConsultantDialog() {
  const mut = useCreateConsultant()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus /> Add Consultant</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add consultant</DialogTitle>
          <DialogDescription>Attached to your institution.</DialogDescription></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const f = new FormData(e.currentTarget)
            try {
              await mut.mutateAsync({
                name: String(f.get("name")),
                specialty: String(f.get("specialty")) as Track,
                credentials: String(f.get("credentials") || "") || undefined,
              })
              setOpen(false)
            } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Name</Label><Input name="name" required /></div>
          <div className="space-y-1.5">
            <Label>Specialty</Label>
            <Select name="specialty" defaultValue="AP_CP">
              <option value="AP">AP</option><option value="CP">CP</option><option value="AP_CP">AP/CP</option>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Credentials</Label><Textarea name="credentials" rows={3} /></div>
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

function ConsultantDocsDialog({ id, onClose }: { id: number | null; onClose: () => void }) {
  const docs = useConsultantDocuments(id)
  const upload = useUploadConsultantDocument()
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={id != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consultant documents</DialogTitle>
          <DialogDescription>Employment contract and appointment/licence files.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {docs.isLoading && <Loading />}
          {(docs.data ?? []).length === 0 && !docs.isLoading && <Empty>No documents uploaded.</Empty>}
          {(docs.data ?? []).map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold capitalize">{d.type}</p>
                <p className="data-mono text-slate-400">
                  expires {d.expires_at ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {d.expires_at && new Date(d.expires_at) < new Date() && <StatusBadge status="Expired" />}
                <a
                  className="text-[12px] font-semibold text-brand hover:underline"
                  href={storageUrl(d.file_path)} target="_blank" rel="noreferrer"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>

        <form
          className="space-y-3 border-t border-slate-200 pt-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const form = e.currentTarget
            const f = new FormData(form)
            const file = f.get("file") as File
            if (!file?.size) return
            try {
              await upload.mutateAsync({
                consultantId: id!,
                type: String(f.get("type")) as "license" | "contract",
                file,
                expires_at: String(f.get("expires_at") || "") || undefined,
              })
              form.reset()
            } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Upload failed.") }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select name="type" defaultValue="license">
                <option value="license">License</option>
                <option value="contract">Contract</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expires (contract only)</Label>
              <Input name="expires_at" type="date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>File (max 10 MB)</Label>
            <Input name="file" type="file" required />
          </div>
          <Button type="submit" className="w-full" disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="animate-spin" /> : <Upload />} Upload
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
