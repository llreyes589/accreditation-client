import * as React from "react"
import { Plus, Check, X, FileUp, History } from "lucide-react"
import { useAuth } from "@/context/auth"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Input, Label, Textarea, Select } from "@/components/ui/input"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"
import { Loading, ErrorState, Empty } from "@/components/states"
import { ApiError } from "@/api/client"
import {
  useFindings, useInspections, useCreateFinding, useCreateCorrectiveAction,
  useUploadEvidence, useResolveCorrectiveAction, useVerifyCorrectiveAction,
  useApproveFinding,
} from "@/api/hooks"
import { statusLabel } from "@/api/types"
import type { AccreditationInspection, Finding, CorrectiveAction } from "@/api/types"

const IS_REVIEWER = (r: string) => r === "Admin" || r === "Accreditor"
const IS_INSTITUTION = (r: string) => r === "TrainingOfficer" || r === "TrainingInstitution"

function FindingCard({ finding }: { finding: Finding }) {
  const { roles } = useAuth()
  const isReviewer = roles.some(IS_REVIEWER)
  const isInstitution = roles.some(IS_INSTITUTION)
  const actions = finding.actions ?? []
  const approve = useApproveFinding()
  const [approveErr, setApproveErr] = React.useState<string | null>(null)

  const onApprove = async () => {
    try { await approve.mutateAsync(finding.id) } catch (e) { setApproveErr((e as ApiError).message) }
  }

  const canApprove =
    isReviewer &&
    !!finding.checklist_item &&
    (finding.status === "open" || finding.status === "in_progress")

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-[15px]">{finding.title}</CardTitle>
          <CardDescription className="mt-1 whitespace-pre-wrap">{finding.description}</CardDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={statusLabel(finding.status)} />
            <Badge variant={finding.severity === "major" ? "expired" : "outline"}>
              {finding.severity}
            </Badge>
            {finding.checklist_item && (
              <Badge variant="info">{finding.checklist_item.criterion ?? "Linked item"}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <Button size="sm" variant="outline" onClick={onApprove} disabled={approve.isPending}>
              <Check className="mr-1 size-3.5" /> Approve &amp; mark item compliant
            </Button>
          )}
          {!isReviewer && isInstitution && <AddActionDialog findingId={finding.id} />}
        </div>
        {approveErr && <p className="text-[12px] text-red-600">{approveErr}</p>}

        {actions.length === 0 ? (
          <p className="text-[13px] text-slate-500">No corrective actions yet.</p>
        ) : (
          actions.map((a) => <ActionCard key={a.id} action={a} isReviewer={isReviewer} isInstitution={isInstitution} />)
        )}
      </CardContent>
    </Card>
  )
}

function ActionCard({
  action, isReviewer, isInstitution,
}: { action: CorrectiveAction; isReviewer: boolean; isInstitution: boolean }) {
  const resolve = useResolveCorrectiveAction()
  const verify = useVerifyCorrectiveAction()
  const upload = useUploadEvidence()
  const [comment, setComment] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [err, setErr] = React.useState<string | null>(null)

  const onResolve = async () => {
    try { await resolve.mutateAsync(action.id) } catch (e) { setErr((e as ApiError).message) }
  }
  const onVerify = async (decision: "verified" | "rejected") => {
    try { await verify.mutateAsync({ actionId: action.id, decision, comment: comment || undefined }) }
    catch (e) { setErr((e as ApiError).message) }
  }
  const onUpload = async () => {
    if (!file) return
    try { await upload.mutateAsync({ actionId: action.id, file }) ; setFile(null) }
    catch (e) { setErr((e as ApiError).message) }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-slate-800">{action.action_plan}</p>
        <StatusBadge status={statusLabel(action.status)} />
      </div>
      {action.due_date && (
        <p className="mt-1 text-[12px] text-slate-500">Due: {action.due_date}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {isInstitution && action.status !== "verified" && (
          <>
            <Button size="sm" variant="outline" onClick={onResolve} disabled={resolve.isPending}>
              Mark resolved
            </Button>
            <input
              type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden" id={`file-${action.id}`}
            />
            <Button size="sm" variant="outline" onClick={() => document.getElementById(`file-${action.id}`)?.click()}>
              <FileUp className="mr-1 size-3.5" /> Attach evidence
            </Button>
            {file && (
              <Button size="sm" onClick={onUpload} disabled={upload.isPending}>
                Upload {file.name}
              </Button>
            )}
          </>
        )}
        {isReviewer && action.status !== "verified" && (
          <>
            <Button size="sm" variant="outline" onClick={() => onVerify("verified")} disabled={verify.isPending}>
              <Check className="mr-1 size-3.5" /> Verify
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <X className="mr-1 size-3.5" /> Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject corrective action</DialogTitle>
                  <DialogDescription>
                    A comment is required explaining why this action is inadequate.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Reason for rejection…"
                />
                <div className="flex justify-end gap-2">
                  <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => onVerify("rejected")}
                    disabled={verify.isPending || !comment.trim()}
                  >
                    Reject &amp; reopen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {action.evidence && action.evidence.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {action.evidence.map((ev) => (
            <Badge key={ev.id} variant="info">{ev.original_name ?? "evidence"}</Badge>
          ))}
        </div>
      )}

      {action.status_logs && action.status_logs.length > 0 && (
        <details className="mt-2 group">
          <summary className="flex cursor-pointer items-center gap-1 text-[12px] text-slate-500">
            <History className="size-3.5" /> History ({action.status_logs.length})
          </summary>
          <ul className="mt-1 space-y-1 border-l border-slate-200 pl-3 text-[12px] text-slate-600">
            {action.status_logs.map((log) => (
              <li key={log.id}>
                <span className="font-medium">{statusLabel(log.status)}</span>
                {log.comment && <span className="text-slate-500"> — {log.comment}</span>}
                <span className="text-slate-400"> ({new Date(log.logged_at).toLocaleString()})</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {err && <p className="mt-2 text-[12px] text-red-600">{err}</p>}
    </div>
  )
}

function AddActionDialog({ findingId }: { findingId: number }) {
  const create = useCreateCorrectiveAction()
  const [open, setOpen] = React.useState(false)
  const [plan, setPlan] = React.useState("")
  const [due, setDue] = React.useState("")
  const [err, setErr] = React.useState<string | null>(null)

  const submit = async () => {
    if (!plan.trim()) { setErr("Action plan is required."); return }
    try {
      await create.mutateAsync({ finding_id: findingId, action_plan: plan, due_date: due || undefined })
      setPlan(""); setDue(""); setErr(null); setOpen(false)
    } catch (e) { setErr((e as ApiError).message) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 size-3.5" /> Add corrective action</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corrective action</DialogTitle>
          <DialogDescription>Describe how this finding will be resolved.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Action plan</Label>
            <Textarea value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="What will be done…" />
          </div>
          <div>
            <Label>Target date</Label>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          {err && <p className="text-[12px] text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
          <Button onClick={submit} disabled={create.isPending}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RaiseFindingDialog({ inspections }: { inspections: Array<AccreditationInspection & { accreditation: { institution?: { name: string } } }> }) {
  const create = useCreateFinding()
  const [open, setOpen] = React.useState(false)
  const [inspId, setInspId] = React.useState<number | "">("")
  const [title, setTitle] = React.useState("")
  const [desc, setDesc] = React.useState("")
  const [severity, setSeverity] = React.useState<"major" | "minor">("major")
  const [err, setErr] = React.useState<string | null>(null)

  const submit = async () => {
    if (inspId === "" || !title.trim()) { setErr("Inspection and title are required."); return }
    try {
      await create.mutateAsync({
        accreditation_inspection_id: Number(inspId),
        title, description: desc, severity,
      })
      setTitle(""); setDesc(""); setSeverity("major"); setErr(null); setOpen(false)
    } catch (e) { setErr((e as ApiError).message) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 size-4" /> Raise finding</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise a finding</DialogTitle>
          <DialogDescription>Findings are raised against a completed inspection.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Inspection</Label>
            <Select value={String(inspId)} onChange={(e) => setInspId(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">Select inspection…</option>
              {inspections.map((i) => (
                <option key={i.id} value={i.id}>
                  #{i.id} — {i.accreditation?.institution?.name ?? "Institution"}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Details…" />
          </div>
          <div>
            <Label>Severity</Label>
            <Select value={severity} onChange={(e) => setSeverity(e.target.value as "major" | "minor")}>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </Select>
          </div>
          {err && <p className="text-[12px] text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
          <Button onClick={submit} disabled={create.isPending}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function FindingsPage() {
  const { roles } = useAuth()
  const isReviewer = roles.some(IS_REVIEWER)
  const findingsQ = useFindings()
  const inspectionsQ = useInspections(isReviewer)

  if (findingsQ.isLoading) return <Loading label="Loading findings…" />
  if (findingsQ.error) return <ErrorState error={findingsQ.error} onRetry={findingsQ.refetch} />

  const findings = findingsQ.data ?? []
  const inspections = (inspectionsQ.data ?? []) as Array<
    AccreditationInspection & { accreditation: { institution?: { name: string } } }
  >

  return (
    <div className="space-y-5">
      <PageHeader
        title="Findings & Corrective Actions"
        description="Track inspection findings and their corrective-action lifecycle."
        actions={isReviewer ? <RaiseFindingDialog inspections={inspections} /> : undefined}
      />

      {findings.length === 0 ? (
        <Empty>
          No findings yet — they appear here once an inspection is submitted or a reviewer raises one.
        </Empty>
      ) : (
        <div className="space-y-4">
          {findings.map((f: Finding) => <FindingCard key={f.id} finding={f} />)}
        </div>
      )}
    </div>
  )
}
