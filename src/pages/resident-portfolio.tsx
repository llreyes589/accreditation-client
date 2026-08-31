import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, ClipboardList, GraduationCap, Star, FileText, AlertTriangle, Archive } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useResidentPortfolio } from "@/api/hooks"
import type { ResidentPortfolio as Portfolio } from "@/api/types"

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"

const trackLabel = (t: string) => (t === "AP_CP" ? "AP/CP" : t)

export default function ResidentPortfolioPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const q = useResidentPortfolio(id ? Number(id) : null)

  if (q.isLoading) return <Loading label="Loading portfolio…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />
  if (!q.data) return <Empty>No resident found.</Empty>

  const p: Portfolio = q.data
  const r = p.resident

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
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" /> Remediation Plans
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2 text-base">
            <Archive className="h-4 w-4" /> Portfolio Archives
          </CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.portfolio_archives.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge variant={a.status === "sealed" ? "outline" : "outline"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="data-mono">{fmtDate(a.archived_at)}</TableCell>
                    <TableCell className="max-w-xs truncate">{a.summary ?? "—"}</TableCell>
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
