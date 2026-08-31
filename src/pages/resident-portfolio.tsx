import { useParams, useNavigate } from "react-router-dom"
import * as React from "react"
import { ArrowLeft, ClipboardList, GraduationCap, Star, FileText, AlertTriangle, Archive, Plus, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useResidentPortfolio, useAdvanceResidentYear, useReviewResidentCompletion, useMarkPeriodComplete, useCreateRemediationPlan, useCreatePortfolioArchive, useArchivePortfolio } from "@/api/hooks"
import type { ResidentPortfolio as Portfolio } from "@/api/types"
import { ApiError } from "@/api/client"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/primitives"

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"

const trackLabel = (t: string) => (t === "AP_CP" ? "AP/CP" : t)

export default function ResidentPortfolioPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const q = useResidentPortfolio(id ? Number(id) : null)
  const advanceYear = useAdvanceResidentYear()
  const reviewCompletion = useReviewResidentCompletion()
  const markPeriod = useMarkPeriodComplete()
  const submitArchive = useCreatePortfolioArchive()
  const finalizeArchive = useArchivePortfolio()

  if (q.isLoading) return <Loading label="Loading portfolio…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />
  if (!q.data) return <Empty>No resident found.</Empty>

  const p: Portfolio = q.data
  const r = p.resident
  const isFinalYear =
    !!r.expected_completion_date &&
    new Date(r.expected_completion_date).getTime() - Date.now() <= 365 * 24 * 60 * 60 * 1000

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/residents")}>
        <ArrowLeft className="h-4 w-4" /> Back to residents
      </Button>

      <PageHeader
        title={r.user?.name ?? `Resident #${r.id}`}
        description={`${trackLabel(r.track)} · Year ${r.year_level ?? "—"}`}
      />

      {/* Summary header */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-sm">
          <span><span className="text-slate-500">Track:</span> <Badge variant="outline">{trackLabel(r.track)}</Badge></span>
          <span><span className="text-slate-500">Year level:</span> {r.year_level ? `Year ${r.year_level}` : "—"}</span>
          <span><span className="text-slate-500">Date accepted:</span> {fmtDate(r.date_accepted)}</span>
          <span><span className="text-slate-500">Expected completion:</span> {fmtDate(r.expected_completion_date)}</span>
          <span>
            <span className="text-slate-500">Promotion:</span>{" "}
            {r.promotion_status ? (
              <Badge variant={r.promotion_status === "eligible" ? "default" : "outline"}>
                {r.promotion_status}
              </Badge>
            ) : "—"}
          </span>
          {isFinalYear && <Badge variant="default">Final year</Badge>}
        </CardContent>
      </Card>

      {/* Actions (flowchart R/Q/S) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training Officer Actions</CardTitle>
          <CardDescription>Advance the resident through the program and review completion.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={advanceYear.isPending}
            onClick={() => advanceYear.mutate(Number(id))}
          >
            <GraduationCap className="h-4 w-4" /> Advance Year Level
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={reviewCompletion.isPending || !!r.completion_reviewed_at}
            onClick={() => reviewCompletion.mutate(Number(id))}
          >
            <Star className="h-4 w-4" /> Review Completion
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={markPeriod.isPending || !!r.period_completed_at}
            onClick={() => markPeriod.mutate(Number(id))}
          >
            <ClipboardList className="h-4 w-4" /> Mark Period Complete
          </Button>
          {r.completion_reviewed_at ? (
            <Badge variant="outline">Completion reviewed {fmtDate(r.completion_reviewed_at)}</Badge>
          ) : (
            <span className="text-sm text-slate-500">Completion not yet reviewed</span>
          )}
        </CardContent>
      </Card>

      {/* Case logs (flowchart F/J) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" /> Case Logs
          </CardTitle>
          <CardDescription>Recorded cases, procedures, conferences and duties.</CardDescription>
        </CardHeader>
        <CardContent>
          {p.case_logs.length === 0 ? (
            <Empty>No case logs recorded.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Logged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.case_logs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.case_type}</TableCell>
                    <TableCell>{c.procedure ?? "—"}</TableCell>
                    <TableCell>{c.count ?? "—"}</TableCell>
                    <TableCell className="data-mono">{fmtDate(c.logged_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Examinations & RISE (flowchart K) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" /> Examinations &amp; RISE Results
          </CardTitle>
          <CardDescription>Quiz and exam scores, including RISE.</CardDescription>
        </CardHeader>
        <CardContent>
          {p.quiz_results.length === 0 ? (
            <Empty>No examination results recorded.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.quiz_results.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell>{qr.quiz?.title ?? `Quiz #${qr.quiz_id}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{qr.quiz?.type?.toUpperCase() ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>{qr.score}</TableCell>
                    <TableCell className="data-mono">{fmtDate(qr.taken_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Consultant evaluations (flowchart M) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" /> Consultant Evaluations
          </CardTitle>
          <CardDescription>Periodic evaluations by consultants.</CardDescription>
        </CardHeader>
        <CardContent>
          {p.consultant_evaluations.length === 0 ? (
            <Empty>No consultant evaluations recorded.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Consultant</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead>Evaluated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.consultant_evaluations.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.period}</TableCell>
                    <TableCell>{e.consultant?.name ?? "—"}</TableCell>
                    <TableCell>
                      {e.recommendation ? (
                        <Badge variant={e.recommendation === "continue" ? "default" : "outline"}>
                          {e.recommendation}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="data-mono">{fmtDate(e.evaluated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Research / case reports (flowchart L) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" /> Research &amp; Case Reports
          </CardTitle>
          <CardDescription>Submitted papers, protocols and case reports.</CardDescription>
        </CardHeader>
        <CardContent>
          {p.research_papers.length === 0 ? (
            <Empty>No research outputs recorded.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.research_papers.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell>{paper.title}</TableCell>
                    <TableCell>{paper.stage}</TableCell>
                    <TableCell className="data-mono">{fmtDate(paper.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Consultant reviews (flowchart G/H/I) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" /> Consultant Reviews
          </CardTitle>
          <CardDescription>Validation verdicts on rotation records.</CardDescription>
        </CardHeader>
        <CardContent>
          {p.consultant_reviews.length === 0 ? (
            <Empty>No consultant reviews recorded.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consultant</TableHead>
                  <TableHead>Rotation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.consultant_reviews.map((rv) => (
                  <TableRow key={rv.id}>
                    <TableCell>{rv.consultant?.name ?? "—"}</TableCell>
                    <TableCell>{rv.assignment?.rotationBlock?.title ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={rv.status === "validated" ? "default" : "outline"}>
                        {rv.status === "validated" ? "Validated" : "Returned"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{rv.comments ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Remediation (flowchart O) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" /> Remediation Plans
            </CardTitle>
            <AddRemediationDialog residentId={Number(id)} />
          </div>
          <CardDescription>Additional rotation / remediation plans.</CardDescription>
        </CardHeader>
        <CardContent>
          {p.remediation_plans.length === 0 ? (
            <Empty>No remediation plans.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.remediation_plans.map((rp) => (
                  <TableRow key={rp.id}>
                    <TableCell className="max-w-xs truncate">{rp.reason}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rp.status}</Badge>
                    </TableCell>
                    <TableCell className="data-mono">{fmtDate(rp.target_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Portfolio archives (flowchart T/U) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="h-4 w-4" /> Portfolio Archives
            </CardTitle>
            {!p.portfolio_archives.some((a) => a.status === "submitted" || a.status === "archived" || a.status === "sealed") && (
              <Button
                size="sm"
                variant="outline"
                disabled={submitArchive.isPending}
                onClick={() => submitArchive.mutate({ resident_id: Number(id) })}
              >
                <Archive className="h-4 w-4" /> Submit Portfolio for Review
              </Button>
            )}
          </div>
          <CardDescription>Submitted and archived resident portfolios.</CardDescription>
        </CardHeader>
        <CardContent>
          {p.portfolio_archives.length === 0 ? (
            <Empty>No portfolio archives yet.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Archived</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.portfolio_archives.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge variant={a.status === "submitted" ? "default" : "outline"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="data-mono">{fmtDate(a.archived_at)}</TableCell>
                    <TableCell className="max-w-xs truncate">{a.summary ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {a.status === "submitted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={finalizeArchive.isPending}
                          onClick={() => finalizeArchive.mutate(a.id)}
                        >
                          Archive
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/** Flowchart node O: create a remediation / additional rotation plan for the resident. */
function AddRemediationDialog({ residentId }: { residentId: number }) {
  const mut = useCreateRemediationPlan()
  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Add Plan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New remediation plan</DialogTitle>
          <DialogDescription>Recorded when training requirements are not yet complete for the period.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            const f = new FormData(e.currentTarget)
            try {
              await mut.mutateAsync({
                resident_id: residentId,
                reason: String(f.get("reason")),
                plan: String(f.get("plan")),
                target_date: String(f.get("target_date") || "") || undefined,
              })
              setOpen(false)
            } catch (e2) { setErr(e2 instanceof ApiError ? e2.firstError : "Failed.") }
          }}
        >
          {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
          <div className="space-y-1.5"><Label>Reason</Label><Input name="reason" required /></div>
          <div className="space-y-1.5"><Label>Plan</Label><Input name="plan" required /></div>
          <div className="space-y-1.5"><Label>Target Date</Label><Input name="target_date" type="date" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />} Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
