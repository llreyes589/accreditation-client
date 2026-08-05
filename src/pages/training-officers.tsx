import * as React from "react"
import { UserPlus, Loader2 } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input, Label } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useTrainingOfficers, useCreateTrainingOfficer } from "@/api/hooks"
import { statusLabel } from "@/api/types"
import { ApiError } from "@/api/client"

export default function TrainingOfficersPage() {
  const q = useTrainingOfficers()

  if (q.isLoading) return <Loading label="Loading training officers…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []
  const approved = all.filter((o) => o.user?.status === "approved").length

  return (
    <>
      <PageHeader
        title="Training Officers"
        description="Multiple officers are allowed per institution"
        actions={<CreateOfficerDialog />}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Officers" value={String(all.length)} />
        <StatCard label="Approved" value={String(approved)} tone="ok" />
        <StatCard label="Pending" value={String(all.length - approved)} tone={all.length - approved ? "warn" : "neutral"} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Officer Roster</CardTitle>
          <CardDescription>New officers require email verification and Admin approval</CardDescription>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <Empty>No training officers recorded.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <p className="font-semibold">{o.user?.name ?? `Officer #${o.id}`}</p>
                      <p className="data-mono text-slate-400">{o.user?.email ?? `TO-${o.id}`}</p>
                    </TableCell>
                    <TableCell className="text-slate-600">{o.phone ?? "—"}</TableCell>
                    <TableCell className="text-slate-600">{o.telegram_handle ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={statusLabel(o.user?.status)} /></TableCell>
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

function CreateOfficerDialog() {
  const mut = useCreateTrainingOfficer()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><UserPlus /> Add Officer</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add training officer</DialogTitle>
          <DialogDescription>Created inside your institution.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const f = new FormData(e.currentTarget)
            try {
              await mut.mutateAsync({
                name: String(f.get("name")),
                username: String(f.get("username")),
                email: String(f.get("email")),
                password: String(f.get("password")),
                phone: String(f.get("phone") || "") || undefined,
                telegram_handle: String(f.get("telegram") || "") || undefined,
              })
              setOpen(false)
            } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Name</Label><Input name="name" required /></div>
          <div className="space-y-1.5"><Label>Username</Label><Input name="username" required /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" required /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input name="password" type="password" minLength={8} required /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Contact Number</Label><Input name="phone" /></div>
            <div className="space-y-1.5"><Label>Telegram</Label><Input name="telegram" /></div>
          </div>
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
