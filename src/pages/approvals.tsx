import * as React from "react";
import {
  Check,
  X,
  UserPlus,
  Loader2,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { Loading, ErrorState, Empty } from "@/components/states";
import {
  useAdminPending,
  useApproveUser,
  useRejectUser,
  useRecordDecision,
  useDraftDecision,
  useCreateStaff,
  useScheduleInspection,
  useMarkRequirementsCompleted,
  useAdminAccreditationDetail,
  useListAccreditors,
  useAssignAccreditor,
  useChangeLeadAccreditor,
  useRemoveAccreditor,
} from "@/api/hooks";
import { roleLabel, statusLabel, ACCREDITATION_DOC_TYPES } from "@/api/types";
import type { InspectionAccreditor } from "@/api/types";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/utils";

export default function ApprovalsPage() {
  const q = useAdminPending();
  const approve = useApproveUser();
  const reject = useRejectUser();
  const recordDecision = useRecordDecision();
  const draftDecision = useDraftDecision();
  const scheduleInspection = useScheduleInspection();
  const markComplete = useMarkRequirementsCompleted();
  const { hasRole } = useAuth();

  const [rejecting, setRejecting] = React.useState<number | null>(null);
  const [reason, setReason] = React.useState("");
  const [schedDate, setSchedDate] = React.useState<Record<number, string>>({});
  const [scheduledFor, setScheduledFor] = React.useState<number | null>(null);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [deciding, setDeciding] = React.useState<number | null>(null);
  const [decisionOutcome, setDecisionOutcome] = React.useState<"approved" | "probationary" | "rejected">("approved");
  const [decisionNotes, setDecisionNotes] = React.useState("");
  const [decisionValidUntil, setDecisionValidUntil] = React.useState("");

  if (q.isLoading) return <Loading label="Loading approval queue…" />;
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const d = q.data!;

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
          <TabsTrigger value="institutions">
            Institutions ({d.institutions.length})
          </TabsTrigger>
          <TabsTrigger value="accreditations">
            Accreditations ({d.accreditations.length})
          </TabsTrigger>
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
                          <Badge variant="info">
                            {roleLabel(u.roles?.[0]?.name)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={
                              u.email_verified_at ? "Verified" : "Pending"
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRejecting(u.id);
                                setReason("");
                              }}
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
                        <TableCell className="text-slate-600">
                          {i.address ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {i.hospital_level ?? "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={statusLabel(i.registration_status)}
                          />
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
                      <TableHead>Type</TableHead>
                      <TableHead>Checklist items</TableHead>
                      <TableHead>Missing docs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Decision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.accreditations.map((a) => {
                      const missing = ACCREDITATION_DOC_TYPES.filter(
                        (t) =>
                          !(a.institution?.documents ?? []).some(
                            (doc: { type: string }) => doc.type === t.value,
                          ),
                      );
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <p className="font-semibold">
                              {a.institution?.name ??
                                `Institution #${a.institution_id}`}
                            </p>
                            <p className="data-mono text-slate-400">
                              ACC-{a.id}
                            </p>
                          </TableCell>
                          <TableCell className="data-mono">
                            {a.submission_type === "renew"
                              ? "Renew"
                              : a.submission_type === "new"
                                ? "New"
                                : "—"}
                          </TableCell>
                          <TableCell className="data-mono">
                            {
                              (a.checklist_snapshot ?? []).filter((i) => i.done)
                                .length
                            }
                            /{(a.checklist_snapshot ?? []).length}
                          </TableCell>
                          <TableCell className="max-w-[16rem]">
                            {missing.length === 0 ? (
                              <span className="text-[12px] font-medium text-emerald-600">
                                Complete
                              </span>
                            ) : (
                              <span className="text-[12px] text-amber-700">
                                {missing.map((m) => m.label).join(", ")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={statusLabel(a.status)} />
                            {a.decisions && a.decisions.length > 0 && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                {a.decisions.length} decision
                                {a.decisions.length > 1 ? "s" : ""} recorded
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                color=""
                                onClick={() => setSelected(a.id)}
                              >
                                View Checklist
                              </Button>
                              <div className="flex justify-end gap-2">
                                {hasRole("Accreditor") && a.status === "inspected" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={draftDecision.isPending}
                                    onClick={() =>
                                      draftDecision.mutate({
                                        id: a.id,
                                        payload: { outcome: "draft", notes: decisionNotes },
                                      })
                                    }
                                  >
                                    Draft
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  disabled={recordDecision.isPending || a.status !== "inspected"}
                                  onClick={() => {
                                    setDeciding(a.id);
                                    setDecisionOutcome("approved");
                                    setDecisionNotes("");
                                    setDecisionValidUntil("");
                                  }}
                                >
                                  <Check /> Decide
                                </Button>
                              </div>
                              {a.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={markComplete.isPending}
                                  onClick={() => markComplete.mutate(a.id)}
                                >
                                  Mark requirements complete
                                </Button>
                              )}
                              {a.status === "requirements_completed" && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="date"
                                    className="h-8 w-auto text-[12px]"
                                    value={schedDate[a.id] ?? ""}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(e) =>
                                      setSchedDate((s) => ({
                                        ...s,
                                        [a.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      scheduleInspection.isPending ||
                                      !schedDate[a.id]
                                    }
                                    onClick={() =>
                                      scheduleInspection.mutate(
                                        {
                                          id: a.id,
                                          date: schedDate[a.id],
                                        },
                                        {
                                          onSuccess: () => setScheduledFor(a.id),
                                        },
                                      )
                                    }
                                  >
                                    Schedule inspection
                                  </Button>
                                </div>
                              )}
                              {scheduledFor === a.id && (
                                <span className="text-[12px] text-emerald-600">
                                  Inspection scheduled.
                                </span>
                              )}
                              {a.status === "inspection_scheduled" &&
                                a.inspection_scheduled_at && (
                                  <span className="text-[12px] text-slate-500">
                                    Inspection:{" "}
                                    {a.inspection_scheduled_at.slice(0, 10)} —
                                    awaiting accreditor
                                  </span>
                                )}
                              {a.status === "inspected" && (
                                <span className="text-[12px] text-emerald-600">
                                  Inspected — ready for approval
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject-with-reason modal (backend requires a reason) */}
      <Dialog
        open={rejecting != null}
        onOpenChange={(o) => !o && setRejecting(null)}
      >
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
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={!reason.trim() || reject.isPending}
              onClick={async () => {
                await reject.mutateAsync({ userId: rejecting!, reason });
                setRejecting(null);
              }}
            >
              {reject.isPending && <Loader2 className="animate-spin" />} Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Final accreditation decision: approved / probationary / rejected (human decision required) */}
      <Dialog
        open={deciding != null}
        onOpenChange={(o) => !o && setDeciding(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record accreditation decision</DialogTitle>
            <DialogDescription>
              A human decision is required. This is recorded in the permanent decision ledger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Outcome</Label>
              <Select
                value={decisionOutcome}
                onChange={(e) =>
                  setDecisionOutcome(e.target.value as "approved" | "probationary" | "rejected")
                }
              >
                <option value="approved">Approved</option>
                <option value="probationary">Probationary</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={decisionNotes}
                maxLength={2000}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Decision rationale (stored in the ledger)"
              />
            </div>
            {decisionOutcome !== "rejected" && (
              <div className="space-y-1.5">
                <Label>Valid until (optional)</Label>
                <Input
                  type="date"
                  value={decisionValidUntil}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDecisionValidUntil(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={recordDecision.isPending}
              onClick={async () => {
                await recordDecision.mutateAsync({
                  id: deciding!,
                  payload: {
                    outcome: decisionOutcome,
                    notes: decisionNotes || undefined,
                    valid_until: decisionValidUntil || undefined,
                  },
                });
                setDeciding(null);
              }}
            >
              {recordDecision.isPending && <Loader2 className="animate-spin" />} Record decision
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AccreditationDetailDialog
        accreditationId={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function CreateStaffDialog() {
  const mut = useCreateStaff();
  const [open, setOpen] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> New Staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create staff account</DialogTitle>
          <DialogDescription>
            Admin or Accreditor. A verification email is sent.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            const f = new FormData(e.currentTarget);
            try {
              await mut.mutateAsync({
                name: String(f.get("name")),
                username: String(f.get("username")),
                email: String(f.get("email")),
                password: String(f.get("password")),
                role: String(f.get("role")) as "Admin" | "Accreditor",
              });
              setOpen(false);
            } catch (e2) {
              setErr(
                e2 instanceof ApiError
                  ? e2.firstError
                  : "Failed to create staff.",
              );
            }
          }}
        >
          {err && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {err}
            </p>
          )}
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input name="username" required />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input name="password" type="password" minLength={8} required />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select name="role" defaultValue="Accreditor">
              <option value="Accreditor">Accreditor</option>
              <option value="Admin">Admin</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InspectionAssignment({
  accreditationId,
  inspection,
}: {
  accreditationId: number
  inspection: { id: number; accreditors?: InspectionAccreditor[] }
}) {
  const accreditorsQ = useListAccreditors()
  const assign = useAssignAccreditor()
  const changeLead = useChangeLeadAccreditor()
  const remove = useRemoveAccreditor()
  const [role, setRole] = React.useState<"lead" | "member">("member")
  const [err, setErr] = React.useState<string | null>(null)

  const assigned = inspection.accreditors ?? []
  const options = (accreditorsQ.data?.accreditors ?? []).filter(
    (u) => !assigned.some((a) => a.id === u.id),
  )

  const onAssign = async (userId: number) => {
    setErr(null)
    try {
      await assign.mutateAsync({ accreditationId, inspectionId: inspection.id, userId, role })
    } catch (e) {
      setErr(e instanceof ApiError ? e.firstError : "Failed to assign accreditor.")
    }
  }
  const onMakeLead = async (userId: number) => {
    setErr(null)
    try {
      await changeLead.mutateAsync({ accreditationId, inspectionId: inspection.id, userId })
    } catch (e) {
      setErr(e instanceof ApiError ? e.firstError : "Failed to change lead accreditor.")
    }
  }
  const onRemove = async (assignmentId: number) => {
    setErr(null)
    try {
      await remove.mutateAsync({ accreditationId, inspectionId: inspection.id, assignmentId })
    } catch (e) {
      setErr(e instanceof ApiError ? e.firstError : "Failed to remove accreditor.")
    }
  }

  return (
    <div className="space-y-4">
      {err && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label>Assign accreditor</Label>
          <Select
            value={String(role)}
            onChange={(e) => setRole(e.target.value as "lead" | "member")}
          >
            <option value="member">Member</option>
            <option value="lead">Lead</option>
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label>Accreditor</Label>
          <Select
            defaultValue=""
            disabled={options.length === 0}
            onChange={(e) => {
              const id = Number(e.target.value)
              if (id) onAssign(id)
            }}
          >
            <option value="">{options.length ? "Select…" : "No accreditors available"}</option>
            {options.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Accreditor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assigned.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Empty>No accreditors assigned yet.</Empty>
                </TableCell>
              </TableRow>
            ) : (
              assigned.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    {a.pivot.role === "lead" ? (
                      <Badge>Lead</Badge>
                    ) : (
                      <Badge variant="outline">Member</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-[12px] text-slate-500">{a.pivot.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {a.pivot.role !== "lead" && (
                        <Button size="sm" variant="outline" onClick={() => onMakeLead(a.id)}>
                          Make lead
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => onRemove(a.id)}>
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-[12px] text-slate-400">
        An accreditor may be assigned to at most 3 inspections per day (lead or member). The lead
        submits the captured checklist.
      </p>
    </div>
  )
}

function AccreditationDetailDialog({
  accreditationId,
  onClose,
}: {
  accreditationId: number | null;
  onClose: () => void;
}) {
  const open = accreditationId !== null;
  const q = useAdminAccreditationDetail(accreditationId ?? undefined, open);
  const data = q.data;
  const inspection = data?.accreditation.inspections?.[0];
  const answers = (inspection?.answers ?? {}) as Record<
    string,
    { compliant: boolean; notes?: string }
  >;
  const items = data?.checklist_items ?? [];
  const bySection: Record<string, typeof items> = {};
  for (const it of items) (bySection[it.section] ??= []).push(it);
  const compliantCount = items.filter(
    (it) => answers[String(it.id)]?.compliant,
  ).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Accreditation Detail
            {data?.accreditation?.institution?.name
              ? ` — ${data.accreditation.institution.name}`
              : ""}
          </DialogTitle>
          <DialogDescription>
            Uploaded documents and the accreditor&apos;s captured inspection
            checklist.
          </DialogDescription>
        </DialogHeader>

        {q.isLoading && <Loading label="Loading…" />}
        {q.error && <ErrorState error={q.error} onRetry={q.refetch} />}
        {data && (
          <Tabs defaultValue="documents" className="mt-2">
            <TabsList>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="inspection">Inspection Checklist</TabsTrigger>
              {data.accreditation.status === "inspection_scheduled" && (
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="documents">
              <Card>
                <CardContent className="py-3">
                  {data.documents.length === 0 ? (
                    <Empty>No documents uploaded.</Empty>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>File</TableHead>
                          <TableHead>Uploaded</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.documents.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">
                              {d.type}
                            </TableCell>
                            <TableCell>
                              {d.file_path ? (
                                <a
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                  href={`/storage/${d.file_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FileText className="size-3.5" /> view
                                </a>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="data-mono">
                              {d.created_at?.slice(0, 10) ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inspection">
              {!inspection ? (
                <Card>
                  <CardContent className="py-4">
                    <Empty>
                      The accreditor has not captured the inspection checklist
                      yet.
                    </Empty>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardCheck className="size-4" /> Captured Inspection
                    </CardTitle>
                    <CardDescription>
                      Completed
                      {inspection.conducted_at
                        ? ` on ${inspection.conducted_at.slice(0, 10)}`
                        : ""}
                      {" · "}
                      {compliantCount}/{items.length} criteria marked compliant
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.keys(bySection).map((s) => (
                      <div key={s}>
                        <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
                          Section {s}
                        </h3>
                        <div className="space-y-2">
                          {bySection[s].map((it) => {
                            const ans = answers[String(it.id)];
                            return (
                              <div
                                key={it.id}
                                className="rounded border border-slate-200 p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-slate-800">
                                      {it.code ? `${it.code} ` : ""}
                                      {it.criterion}
                                    </p>
                                    {it.is_major && (
                                      <span className="mt-1 inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                                        Major
                                      </span>
                                    )}
                                    {it.notes_hint && (
                                      <p className="mt-1 text-[12px] text-slate-400">
                                        {it.notes_hint}
                                      </p>
                                    )}
                                  </div>
                                  {ans ? (
                                    <span
                                      className={cn(
                                        "shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold",
                                        ans.compliant
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-rose-100 text-rose-700",
                                      )}
                                    >
                                      {ans.compliant
                                        ? "Compliant"
                                        : "Not compliant"}
                                    </span>
                                  ) : (
                                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                                      —
                                    </span>
                                  )}
                                </div>
                                {ans?.notes && (
                                  <p className="mt-2 text-[12px] text-slate-600">
                                    <span className="font-medium">Notes:</span>{" "}
                                    {ans.notes}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            {data.accreditation.status === "inspection_scheduled" && (() => {
              const pending = data.accreditation.inspections?.find(
                (i) => i.status === "pending",
              )
              if (!pending) return null
              return (
                <TabsContent value="assignment">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Inspection Assignment</CardTitle>
                      <CardDescription>
                        Assign a lead and member accreditors. Assignment is possible during
                        scheduling or afterwards.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <InspectionAssignment
                        accreditationId={data.accreditation.id}
                        inspection={pending}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })()}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
