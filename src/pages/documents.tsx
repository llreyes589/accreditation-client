import * as React from "react"
import { Upload, Loader2, ExternalLink } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input, Label, Select } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useDocuments, useUploadDocument } from "@/api/hooks"
import { API_URL, ApiError } from "@/api/client"

const storageUrl = (p: string) => `${API_URL.replace(/\/api$/, "")}/storage/${p}`

const expiryState = (iso: string | null) => {
  if (!iso) return { label: "No expiry", variant: "default" as const, days: null }
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return { label: "Expired", variant: "expired" as const, days }
  if (days <= 30) return { label: "Expiring", variant: "pending" as const, days }
  return { label: "Valid", variant: "approved" as const, days }
}

export default function DocumentsPage() {
  const q = useDocuments()

  if (q.isLoading) return <Loading label="Loading documents…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []
  const expired = all.filter((d) => expiryState(d.expires_at).variant === "expired").length
  const expiring = all.filter((d) => expiryState(d.expires_at).variant === "pending").length

  return (
    <>
      <PageHeader
        title="Institution Documents"
        description="Uploads expire on January 1 of the following year"
        actions={<UploadDialog />}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Documents" value={String(all.length)} />
        <StatCard label="Valid" value={String(all.length - expired - expiring)} tone="ok" />
        <StatCard label="Expiring ≤30d" value={String(expiring)} tone={expiring ? "warn" : "neutral"} />
        <StatCard label="Expired" value={String(expired)} tone={expired ? "warn" : "neutral"} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Document Registry</CardTitle>
          <CardDescription>Licenses, permits and accreditation attachments</CardDescription>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <Empty>No documents uploaded yet.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((d) => {
                  const st = expiryState(d.expires_at)
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge variant="outline">{d.type}</Badge>
                        <p className="data-mono mt-1 text-slate-400">DOC-{d.id}</p>
                      </TableCell>
                      <TableCell className="data-mono">
                        {d.expires_at ?? "—"}
                        {st.days != null && st.days >= 0 && (
                          <span className="ml-2 text-slate-400">({st.days}d)</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={st.label} /></TableCell>
                      <TableCell className="text-right">
                        <a
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                          href={storageUrl(d.file_path)} target="_blank" rel="noreferrer"
                        >
                          View <ExternalLink className="size-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function UploadDialog() {
  const mut = useUploadDocument()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Upload /> Upload Document</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload institution document</DialogTitle>
          <DialogDescription>Max 10 MB. Expiry is set automatically to next January 1.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const f = new FormData(e.currentTarget)
            const file = f.get("file") as File
            if (!file?.size) return
            try {
              await mut.mutateAsync({
                type: String(f.get("type")) as "license" | "permit" | "accreditation" | "other",
                file,
              })
              setOpen(false)
            } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Upload failed.") }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select name="type" defaultValue="license">
              <option value="license">License</option>
              <option value="permit">Permit</option>
              <option value="accreditation">Accreditation</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>File</Label><Input name="file" type="file" required /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
