import * as React from "react"
import { Check, X, UserPlus, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Input, Label, Select } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import {
  useAdminPending, useApproveUser, useRejectUser,
  useApproveAccreditation, useRejectAccreditation, useCreateStaff,
} from "@/api/hooks"
import { roleLabel, statusLabel } from "@/api/types"
import { ApiError } from "@/api/client"

export default function ApprovalsPage() {
  const q = useAdminPending()
  const approve = useApproveUser()
  const reject = useRejectUser()
  const approveAcc = useApproveAccreditation()
  const rejectAcc = useRejectAccreditation()

  const [rejecting, setRejecting] = React.useState<number | null>(null)
  const [reason, setReason] = React.useState("")

  if (q.isLoading) return <Loading label="Loading approval queue…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />
  const d = q.data!

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Approve or reject registrations and accreditation submissions"
        actions={<CreateStaffDialog />}
      />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users ({d.users.length})</TabsTrigger>
          <TabsTrigger value="institutions">Institutions ({d.institutions.length})</TabsTrigger>
          <TabsTrigger value="accreditations">Accreditations ({d.accreditations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Pending Users</CardTitle>
              <CardDescription>
                Approving a Training Officer also activates their institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {d.users.length === 0 ? (
                <Empty>No users awaiting approval.</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email verified</TableHead>
                      <TableHead className="text-right">Decision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <p className="font-semibold">{u.name}</p>
                          <p className="data-mono text-slate-400">{u.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="info">{roleLabel(u.roles?.[0]?.name)}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={u.email_verified_at ? "Verified" : "Pending"} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setRejecting(u.id); setReason("") }}
                            >
                              <X /> Reject
                            </Button>
                            <Button
                              size="sm"
                              disabled={approve.isPending}
                              onClick={() => approve.mutate(u.id)}
                            >
                              <Check /> Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="institutions">
          <Card>
            <CardHeader>
              <CardTitle>Pending Institutions</CardTitle>
              <CardDescription>
                Activated automatically when their Training Officer is approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              {d.institutions.length === 0 ? (
                <Empty>No institutions awaiting approval.</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.institutions.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>
                          <p className="font-semibold">{i.name}</p>
                          <p className="data-mono text-slate-400">INS-{i.id}</p>
                        </TableCell>
                        <TableCell className="text-slate-600">{i.address ?? "—"}</TableCell>
                        <TableCell className="text-slate-600">{i.hospital_level ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={statusLabel(i.registration_status)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accreditations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Accreditations</CardTitle>
              <CardDescription>
                Approval sets validity from today using the configured term
              </CardDescription>
            </CardHeader>
            <CardContent>
              {d.accreditations.length === 0 ? (
                <Empty>No accreditation submissions.</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Checklist items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Decision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.accreditations.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <p className="font-semibold">
                            {a.institution?.name ?? `Institution #${a.institution_id}`}
                          </p>
                          <p className="data-mono text-slate-400">ACC-{a.id}</p>
                        </TableCell>
                        <TableCell className="data-mono">
                          {(a.checklist_snapshot ?? []).filter((i) => i.done).length}/{(a.checklist_snapshot ?? []).length}
                        </TableCell>
                        <TableCell><StatusBadge status={statusLabel(a.status)} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline" size="sm"
                              disabled={rejectAcc.isPending}
                              onClick={() => rejectAcc.mutate(a.id)}
                            >
                              <X /> Reject
                            </Button>
                            <Button
                              size="sm"
                              disabled={approveAcc.isPending}
                              onClick={() => approveAcc.mutate(a.id)}
                            >
                              <Check /> Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject-with-reason modal (backend requires a reason) */}
      <Dialog open={rejecting != null} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject registration</DialogTitle>
            <DialogDescription>
              A reason is required and is stored on the user record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input
              value={reason}
              maxLength={255}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Incomplete supporting documents"
            />
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              variant="destructive"
              disabled={!reason.trim() || reject.isPending}
              onClick={async () => {
                await reject.mutateAsync({ userId: rejecting!, reason })
                setRejecting(null)
              }}
            >
              {reject.isPending && <Loader2 className="animate-spin" />} Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CreateStaffDialog() {
  const mut = useCreateStaff()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus /> New Staff</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create staff account</DialogTitle>
          <DialogDescription>Admin or Accreditor. A verification email is sent.</DialogDescription>
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
                email: String(f.get("email")),
                password: String(f.get("password")),
                role: String(f.get("role")) as "Admin" | "Accreditor",
              })
              setOpen(false)
            } catch (e2) {
              setErr(e2 instanceof ApiError ? e2.firstError : "Failed to create staff.")
            }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Name</Label><Input name="name" required /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" required /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input name="password" type="password" minLength={8} required /></div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select name="role" defaultValue="Accreditor">
              <option value="Accreditor">Accreditor</option>
              <option value="Admin">Admin</option>
            </Select>
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
