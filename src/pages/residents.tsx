import * as React from "react"
import { UserPlus, Loader2, ArrowLeftRight } from "lucide-react"
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
import { useResidents, useCreateResident, useRequestTransfer, usePublicInstitutions } from "@/api/hooks"
import { trackLabel, statusLabel, type Resident, type Track } from "@/api/types"
import { ApiError } from "@/api/client"

/** Backend sends full ISO timestamps; show the date only. */
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-CA") : "—"

const promotionLabel = (s?: string | null) => {
  if (s === "eligible") return "Approved"
  if (s === "ineligible") return "Retained"
  return "Not Evaluated"
}

export default function ResidentsPage() {
  const q = useResidents()
  const [search, setSearch] = React.useState("")
  const [track, setTrack] = React.useState("All")

  if (q.isLoading) return <Loading label="Loading residents…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []
  const rows = all.filter(
    (r) =>
      (track === "All" || r.track === track) &&
      (r.user?.name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const active = all.filter((r) => r.user?.status === "approved").length
  const eligible = all.filter((r) => r.promotion_status === "eligible").length

  return (
    <>
      <PageHeader
        title="Residents"
        description="Year level is computed by the backend from Date Accepted"
        actions={<CreateResidentDialog />}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Residents" value={String(all.length)} />
        <StatCard label="Approved" value={String(active)} tone="ok" />
        <StatCard label="Pending" value={String(all.length - active)} tone={all.length - active ? "warn" : "neutral"} />
        <StatCard label="Promotion Eligible" value={String(eligible)} tone="ok" />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Resident Registry</CardTitle>
          <CardDescription>Registered here, activated by Admin approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search residents…"
              className="flex-1"
            />
            <Select value={track} onChange={(e) => setTrack(e.target.value)} className="sm:w-40">
              <option>All</option>
              <option value="AP">AP</option>
              <option value="CP">CP</option>
              <option value="AP_CP">AP/CP</option>
            </Select>
          </div>

          {rows.length === 0 ? (
            <Empty>No residents match your filters.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Accepted</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Promotion</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-semibold">{r.user?.name ?? `Resident #${r.id}`}</p>
                      <p className="data-mono text-slate-400">{r.user?.email ?? `RES-${r.id}`}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline">{trackLabel(r.track)}</Badge></TableCell>
                    <TableCell className="data-mono">{fmtDate(r.date_accepted)}</TableCell>
                    <TableCell>
                      {r.year_level ? <Badge variant="info">Year {r.year_level}</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={promotionLabel(r.promotion_status)} />
                    </TableCell>
                    <TableCell><StatusBadge status={statusLabel(r.user?.status)} /></TableCell>
                    <TableCell className="text-right"><TransferDialog resident={r} /></TableCell>
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

function CreateResidentDialog() {
  const mut = useCreateResident()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><UserPlus /> Register Resident</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register resident</DialogTitle>
          <DialogDescription>Creates the account in your institution; Admin approval activates it.</DialogDescription>
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
                track: String(f.get("track")) as Track,
                date_accepted: String(f.get("date_accepted") || "") || undefined,
                age_at_enrollment: f.get("age") ? Number(f.get("age")) : undefined,
              })
              setOpen(false)
            } catch (e2) {
              setErr(e2 instanceof ApiError ? e2.firstError : "Failed.")
            }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Name</Label><Input name="name" required /></div>
          <div className="space-y-1.5"><Label>Username</Label><Input name="username" required /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" required /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input name="password" type="password" minLength={8} required /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Track</Label>
              <Select name="track" defaultValue="AP_CP">
                <option value="AP">AP</option><option value="CP">CP</option><option value="AP_CP">AP/CP</option>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Date Accepted</Label><Input name="date_accepted" type="date" /></div>
          </div>
          <div className="space-y-1.5"><Label>Age at Enrollment</Label><Input name="age" type="number" min={0} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Register
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TransferDialog({ resident }: { resident: Resident }) {
  const mut = useRequestTransfer()
  const institutions = usePublicInstitutions()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><ArrowLeftRight /> Transfer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request transfer</DialogTitle>
          <DialogDescription>
            {resident.user?.name} will move once the destination institution accepts.
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
                residentId: resident.id,
                to_institution_id: Number(f.get("to")),
                reason: String(f.get("reason") || "") || undefined,
              })
              setOpen(false)
            } catch (e2) {
              setErr(e2 instanceof ApiError ? e2.firstError : "Failed.")
            }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5">
            <Label>Destination institution</Label>
            <Select name="to" required defaultValue="">
              <option value="" disabled>Select…</option>
              {(institutions.data ?? [])
                .filter((i) => i.id !== resident.institution_id)
                .map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Reason</Label><Input name="reason" maxLength={255} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
