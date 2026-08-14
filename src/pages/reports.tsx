import * as React from "react"
import { Download, FileSpreadsheet } from "lucide-react"
import { useAuth } from "@/context/auth"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Label, Select } from "@/components/ui/input"
import { downloadBlob, ApiError } from "@/api/client"
import { downloadReport, listPublicInstitutions } from "@/api/endpoints"
import { useQuery } from "@tanstack/react-query"

type Kind = "accreditations" | "renewals" | "findings" | "inspections"

const REPORTS: { kind: Kind; label: string; description: string }[] = [
  { kind: "accreditations", label: "Accreditation report", description: "Applications, status, decision outcome, validity dates." },
  { kind: "renewals", label: "Renewal report", description: "Renewals, current outcome, due date, days remaining." },
  { kind: "findings", label: "Findings & corrective actions", description: "Findings, severity, status, due date, responsible, days overdue." },
  { kind: "inspections", label: "Inspection report", description: "Inspections, scheduled date, status, lead inspector." },
]

export default function ReportsPage() {
  const { roles } = useAuth()
  const isStaff = roles.some((r) => r === "Admin" || r === "Accreditor")
  const [institutionId, setInstitutionId] = React.useState<string>("")
  const [status, setStatus] = React.useState("")
  const [severity, setSeverity] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [busy, setBusy] = React.useState<Kind | null>(null)
  const [err, setErr] = React.useState<string | null>(null)

  const institutionsQ = useQuery({
    queryKey: ["public-institutions"],
    queryFn: listPublicInstitutions,
    enabled: isStaff,
  })

  const run = async (kind: Kind) => {
    setErr(null)
    setBusy(kind)
    try {
      const blob = await downloadReport(kind, {
        institution_id: institutionId ? Number(institutionId) : undefined,
        status: status || undefined,
        severity: severity || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      downloadBlob(blob, `${kind}.csv`)
    } catch (e) {
      setErr((e as ApiError).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Generate CSV reports. Institution users see only their own data; PSP/CART users can scope to any institution."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Filters</CardTitle>
          <CardDescription>Applied to every report. Leave blank to include all (within your scope).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isStaff && (
            <div>
              <Label>Institution</Label>
              <Select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                <option value="">All institutions</option>
                {(institutionsQ.data ?? []).map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label>Status</Label>
            <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="e.g. approved" />
          </div>
          <div>
            <Label>Severity</Label>
            <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="">Any</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </Select>
          </div>
          <div>
            <Label>Date from</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Date to</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.kind}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <FileSpreadsheet className="size-4 text-brand" /> {r.label}
              </CardTitle>
              <CardDescription>{r.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => run(r.kind)} disabled={busy === r.kind}>
                <Download className="mr-1 size-3.5" />
                {busy === r.kind ? "Generating…" : "Download CSV"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {err && <p className="text-[13px] text-red-600">{err}</p>}
    </div>
  )
}
