import * as React from "react";
import { Loader2, CalendarDays, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/primitives";
import { Label, Input, Select } from "@/components/ui/input";
import { useAuth } from "@/context/auth";
import {
  useRecordDecision,
  useDraftDecision,
  useScheduleInspection,
  useMarkRequirementsCompleted,
  useStartDeliberation,
  useEditChecklist,
  useAdminAccreditationDetail,
  useListAccreditors,
  useAssignAccreditor,
  useChangeLeadAccreditor,
  useRemoveAccreditor,
} from "@/api/hooks";
import { ApiError } from "@/api/client";
import type { Accreditation, InspectionAccreditor } from "@/api/types";
import { cn } from "@/lib/utils";

/**
 * The minimal accreditation shape AccreditationActions needs. A full
 * `Accreditation` (from the Approvals queue or API) satisfies it; the Kanban
 * board passes a partial built from the kanban DTO (id + status + a few
 * optional fields) which is enough to drive the action buttons and dialogs.
 */
export interface AccreditationLike {
  id: number;
  status: Accreditation["status"];
  submission_type?: "new" | "renew" | null;
  inspection_scheduled_at?: string | null;
  decisions?: Accreditation["decisions"];
}

/**
 * Reusable action cluster for an accreditation — the same buttons that appear
 * in the Approvals table "Decision" column (View Checklist, Decide, Schedule
 * inspection, Mark requirements complete) plus the dialogs they open.
 *
 * Used by both the Approvals table and the Kanban board cards so the
 * decision/checklist actions live in exactly one place.
 *
 * `compact` renders the buttons stacked and small (for Kanban cards); the
 * default renders the same set as used in the Approvals row.
 */
export function AccreditationActions({
  accreditation,
  compact = false,
}: {
  accreditation: AccreditationLike;
  compact?: boolean;
}) {
  const { hasRole } = useAuth();
  const recordDecision = useRecordDecision();
  const draftDecision = useDraftDecision();
  const scheduleInspection = useScheduleInspection();
  const markComplete = useMarkRequirementsCompleted();
  const startDeliberation = useStartDeliberation();
  const editChecklist = useEditChecklist();

  const [selected, setSelected] = React.useState<number | null>(null);
  const [deciding, setDeciding] = React.useState<number | null>(null);
  const [decisionOutcome, setDecisionOutcome] = React.useState<
    "approved" | "probationary" | "rejected"
  >("approved");
  const [decisionNotes, setDecisionNotes] = React.useState("");
  const [decisionValidUntil, setDecisionValidUntil] = React.useState("");
  const [decisionRecommendation, setDecisionRecommendation] = React.useState<
    "3_years" | "3_years_conditional" | "1_year" | ""
  >("");
  const [decisionVoteCount, setDecisionVoteCount] = React.useState<string>("");
  const [schedDate, setSchedDate] = React.useState<Record<number, string>>({});
  const [scheduledFor, setScheduledFor] = React.useState<number | null>(null);

  const a = accreditation;

  // The single primary "advance" action for the card's current stage.
  const primary = (() => {
    if (a.status === "pending")
      return {
        label: "Mark requirements complete",
        icon: <ClipboardCheck />,
        onClick: () => markComplete.mutate(a.id),
        pending: markComplete.isPending,
        disabled: false,
        variant: "default" as const,
      };
    if (a.status === "requirements_completed")
      return {
        label: "Schedule inspection",
        icon: <CalendarDays />,
        onClick: () =>
          scheduleInspection.mutate(
            { id: a.id, date: schedDate[a.id] },
            { onSuccess: () => setScheduledFor(a.id) },
          ),
        pending: scheduleInspection.isPending,
        disabled: !schedDate[a.id],
        variant: "default" as const,
      };
    if (a.status === "inspected")
      return {
        label: "Start deliberation",
        icon: <Gavel />,
        onClick: () => startDeliberation.mutate(a.id),
        pending: startDeliberation.isPending,
        disabled: false,
        variant: "default" as const,
      };
    return null;
  })();

  return (
    <>
      <div
        className={cn(
          "flex gap-2",
          compact ? "flex-col items-stretch" : "flex-col items-end",
        )}
      >
        {/* Always-available: open the checklist / detail dialog. */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={() => setSelected(a.id)}
        >
          View Checklist
        </Button>

        {/* Optional secondary: draft a decision (Accreditor, inspected only). */}
        {hasRole("Accreditor") && a.status === "inspected" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center"
            disabled={draftDecision.isPending}
            onClick={() =>
              draftDecision.mutate({
                id: a.id,
                payload: { outcome: "draft", notes: decisionNotes },
              })
            }
          >
            {draftDecision.isPending && <Loader2 className="animate-spin" />} Draft
          </Button>
        )}

        {/* Secondary: record the final decision (Admin, inspected/deliberation). */}
        {hasRole("Admin") && (a.status === "inspected" || a.status === "deliberation") && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center"
            disabled={recordDecision.isPending}
            onClick={() => {
              setDeciding(a.id);
              setDecisionOutcome("approved");
              setDecisionNotes("");
              setDecisionValidUntil("");
              setDecisionRecommendation("");
              setDecisionVoteCount("");
            }}
          >
            {recordDecision.isPending && <Loader2 className="animate-spin" />} Decide
          </Button>
        )}

        {/* Stage primary advance action. */}
        {primary && (
          <Button
            size="sm"
            variant={primary.variant}
            className="w-full justify-center"
            disabled={primary.disabled || primary.pending}
            onClick={primary.onClick}
          >
            {primary.pending ? <Loader2 className="animate-spin" /> : primary.icon}
            {primary.label}
          </Button>
        )}

        {/* Schedule inspection date picker (requirements_completed). */}
        {a.status === "requirements_completed" && (
          <Input
            type="date"
            className="h-8 w-full text-[12px]"
            value={schedDate[a.id] ?? ""}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) =>
              setSchedDate((s) => ({ ...s, [a.id]: e.target.value }))
            }
          />
        )}

        {scheduledFor === a.id && (
          <span className="text-[12px] text-emerald-600">
            Inspection scheduled.
          </span>
        )}
        {a.status === "inspection_scheduled" && a.inspection_scheduled_at && (
          <span className="text-[12px] text-slate-500">
            Inspection: {a.inspection_scheduled_at.slice(0, 10)} — awaiting
            accreditor
          </span>
        )}
        {a.status === "inspected" && (
          <span className="text-[12px] text-emerald-600">
            Inspected — ready for approval
          </span>
        )}
        {a.status === "deliberation" && (
          <span className="text-[12px] text-amber-600">
            In deliberation — accreditor locked; admin may edit the checklist
          </span>
        )}
      </div>

      {/* Final accreditation decision dialog */}
      <Dialog
        open={deciding != null}
        onOpenChange={(o) => !o && setDeciding(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record accreditation decision</DialogTitle>
            <DialogDescription>
              A human decision is required. This is recorded in the permanent
              decision ledger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Outcome</Label>
              <Select
                value={decisionOutcome}
                onChange={(e) =>
                  setDecisionOutcome(
                    e.target.value as
                      | "approved"
                      | "probationary"
                      | "rejected",
                  )
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
            <div className="space-y-1.5">
              <Label>Recommendation (deliberation)</Label>
              <Select
                value={decisionRecommendation}
                onChange={(e) =>
                  setDecisionRecommendation(
                    e.target.value as
                      | "3_years"
                      | "3_years_conditional"
                      | "1_year"
                      | "",
                  )
                }
              >
                <option value="">— none —</option>
                <option value="3_years">3 years</option>
                <option value="3_years_conditional">3 years (with condition)</option>
                <option value="1_year">1 year</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vote count (optional)</Label>
              <Input
                type="number"
                min={0}
                value={decisionVoteCount}
                onChange={(e) => setDecisionVoteCount(e.target.value)}
                placeholder="Number of votes for the recommendation"
              />
            </div>
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
                    recommendation: decisionRecommendation || undefined,
                    vote_count:
                      decisionVoteCount !== ""
                        ? Number(decisionVoteCount)
                        : undefined,
                  },
                });
                setDeciding(null);
              }}
            >
              {recordDecision.isPending && <Loader2 className="animate-spin" />}{" "}
              Record decision
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist / detail dialog (reuses the Approvals implementation) */}
      <AccreditationDetailDialog
        accreditationId={selected}
        onClose={() => setSelected(null)}
        editChecklist={editChecklist}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The detail/checklist dialog — identical to the one in approvals.tsx. */
/* Kept here so the action cluster is fully self-contained.            */
/* ------------------------------------------------------------------ */

function AccreditationDetailDialog({
  accreditationId,
  onClose,
  editChecklist,
}: {
  accreditationId: number | null;
  onClose: () => void;
  editChecklist: ReturnType<typeof useEditChecklist>;
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
  // Editable draft of answers for the admin deliberation editor.
  const [editAnswers, setEditAnswers] = React.useState<Record<
    string,
    { compliant: boolean; notes?: string }
  > | null>(null);
  const isAdmin = useAuth().hasRole("Admin");
  const canEditChecklist =
    isAdmin &&
    data != null &&
    (data.accreditation.status === "deliberation" ||
      data.accreditation.status === "inspected");

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
              {canEditChecklist && (
                <TabsTrigger value="deliberation">
                  Deliberation (edit)
                </TabsTrigger>
              )}
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
            {canEditChecklist && (
              <TabsContent value="deliberation">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Gavel className="size-4" /> Edit checklist (deliberation)
                    </CardTitle>
                    <CardDescription>
                      Admin-only. Adjust each criterion; the accreditor is locked
                      out during deliberation. Saving writes to the captured
                      inspection.
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
                            const key = String(it.id);
                            const cur = (editAnswers ?? answers)[key] ?? {
                              compliant: false,
                            };
                            return (
                              <div
                                key={it.id}
                                className="rounded border border-slate-200 p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <p className="min-w-0 text-[13px] font-medium text-slate-800">
                                    {it.code ? `${it.code} ` : ""}
                                    {it.criterion}
                                  </p>
                                  <label className="flex shrink-0 items-center gap-1.5 text-[12px]">
                                    <input
                                      type="checkbox"
                                      checked={!!cur.compliant}
                                      onChange={(e) =>
                                        setEditAnswers((prev) => {
                                          const base = prev ?? answers;
                                          return {
                                            ...base,
                                            [key]: {
                                              compliant: e.target.checked,
                                              notes:
                                                base[key]?.notes ??
                                                answers[key]?.notes ??
                                                undefined,
                                            },
                                          };
                                        })
                                      }
                                    />
                                    Compliant
                                  </label>
                                </div>
                                <Input
                                  className="mt-2 h-8 text-[12px]"
                                  placeholder="Notes (optional)"
                                  defaultValue={answers[key]?.notes ?? ""}
                                  onChange={(e) =>
                                    setEditAnswers((prev) => {
                                      const base = prev ?? answers;
                                      return {
                                        ...base,
                                        [key]: {
                                          compliant:
                                            base[key]?.compliant ?? false,
                                          notes: e.target.value || undefined,
                                        },
                                      };
                                    })
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditAnswers(null)}
                        disabled={editChecklist.isPending}
                      >
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        disabled={editChecklist.isPending}
                        onClick={async () => {
                          const draft = editAnswers ?? answers;
                          await editChecklist.mutateAsync({
                            id: data!.accreditation.id,
                            answers: draft,
                          });
                          setEditAnswers(null);
                        }}
                      >
                        {editChecklist.isPending && (
                          <Loader2 className="animate-spin" />
                        )}{" "}
                        Save checklist
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {data.accreditation.status === "inspection_scheduled" &&
              (() => {
                const pending = data.accreditation.inspections?.find(
                  (i) => i.status === "pending",
                );
                if (!pending) return null;
                return (
                  <TabsContent value="assignment">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Inspection Assignment
                        </CardTitle>
                        <CardDescription>
                          Assign a lead and member accreditors. Assignment is
                          possible during scheduling or afterwards.
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
                );
              })()}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InspectionAssignment({
  accreditationId,
  inspection,
}: {
  accreditationId: number;
  inspection: { id: number; accreditors?: InspectionAccreditor[] };
}) {
  const accreditorsQ = useListAccreditors();
  const assign = useAssignAccreditor();
  const changeLead = useChangeLeadAccreditor();
  const remove = useRemoveAccreditor();
  const [role, setRole] = React.useState<"lead" | "member">("member");
  const [err, setErr] = React.useState<string | null>(null);

  const assigned = inspection.accreditors ?? [];
  const options = (accreditorsQ.data?.accreditors ?? []).filter(
    (u) => !assigned.some((a) => a.id === u.id),
  );

  const onAssign = async (userId: number) => {
    setErr(null);
    try {
      await assign.mutateAsync({
        accreditationId,
        inspectionId: inspection.id,
        userId,
        role,
      });
    } catch (e) {
      setErr(e instanceof ApiError ? e.firstError : "Failed to assign accreditor.");
    }
  };
  const onMakeLead = async (userId: number) => {
    setErr(null);
    try {
      await changeLead.mutateAsync({
        accreditationId,
        inspectionId: inspection.id,
        userId,
      });
    } catch (e) {
      setErr(e instanceof ApiError ? e.firstError : "Failed to change lead accreditor.");
    }
  };
  const onRemove = async (assignmentId: number) => {
    setErr(null);
    try {
      await remove.mutateAsync({
        accreditationId,
        inspectionId: inspection.id,
        assignmentId,
      });
    } catch (e) {
      setErr(e instanceof ApiError ? e.firstError : "Failed to remove accreditor.");
    }
  };

  return (
    <div className="space-y-4">
      {err && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {err}
        </p>
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
              const id = Number(e.target.value);
              if (id) onAssign(id);
            }}
          >
            <option value="">
              {options.length ? "Select…" : "No accreditors available"}
            </option>
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
                  <TableCell className="text-[12px] text-slate-500">
                    {a.pivot.status}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {a.pivot.role !== "lead" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMakeLead(a.id)}
                        >
                          Make lead
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRemove(a.id)}
                      >
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
        An accreditor may be assigned to at most 3 inspections per day (lead or
        member). The lead submits the captured checklist.
      </p>
    </div>
  );
}

/* Local imports (kept at bottom to mirror approvals.tsx ordering). */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, ClipboardCheck } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { Loading, ErrorState, Empty } from "@/components/states";
