import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { Building2, Users, AlertTriangle, ClipboardList, FileWarning } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useAuth } from "@/context/auth"
import { useAdminPending, useDashboard } from "@/api/hooks"
import { trackLabel, statusLabel } from "@/api/types"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

/** Backend returns counts as strings, and grouped keys may be "" when the
 *  underlying column is null (e.g. a resident with no date_accepted). */
const toSeries = (o?: Record<string, number> | unknown[]) =>
  Object.entries((o ?? {}) as Record<string, unknown>).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }))

export default function DashboardPage() {
  const { hasRole, user } = useAuth()
  const isAdminish = hasRole("Admin", "Accreditor")

  if (isAdminish) return <AdminDashboard />
  return <InstitutionDashboard name={user?.name} />
}

/* ------------------------------------------------------------------ */

function AdminDashboard() {
  const q = useAdminPending()

  if (q.isLoading) return <Loading label="Loading approval queue…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const d = q.data!
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Registrations and accreditations awaiting your decision"
        actions={<Button asChild size="sm"><Link to="/approvals">Open approvals</Link></Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Users" value={String(d.users.length)} tone="warn" icon={<Users className="size-4" />} />
        <StatCard label="Pending Institutions" value={String(d.institutions.length)} tone="warn" icon={<Building2 className="size-4" />} />
        <StatCard label="Pending Accreditations" value={String(d.accreditations.length)} tone="warn" icon={<ClipboardList className="size-4" />} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Users</CardTitle>
            <CardDescription>Institution officers and residents awaiting approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.users.length === 0 && <Empty>No users awaiting approval.</Empty>}
            {d.users.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{u.name}</p>
                  <p className="data-mono text-slate-400">{u.email}</p>
                </div>
                <Badge variant="info">{u.roles?.[0]?.name ?? "—"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Accreditations</CardTitle>
            <CardDescription>Checklist submissions from institutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.accreditations.length === 0 && <Empty>No accreditation submissions.</Empty>}
            {d.accreditations.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">
                    {a.institution?.name ?? `Institution #${a.institution_id}`}
                  </p>
                  <p className="data-mono text-slate-400">ACC-{a.id}</p>
                </div>
                <StatusBadge status={statusLabel(a.status)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */

function InstitutionDashboard({ name }: { name?: string }) {
  const q = useDashboard()

  if (q.isLoading) return <Loading label="Loading institution metrics…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const d = q.data!
  const m = d.metrics
  const latest = d.accreditations[0]

  const byYear = toSeries(m.residents_by_year_level).sort((a, b) => a.name.localeCompare(b.name))
  const byType = toSeries(m.cases_by_type).sort((a, b) => b.value - a.value)
  const residentTotal = toSeries(m.residents_by_track).reduce((a, b) => a + b.value, 0)

  return (
    <>
      <PageHeader
        title={d.institution?.name ?? "Institution Dashboard"}
        description={[d.institution?.address, d.institution?.hospital_level].filter(Boolean).join(" · ") || `Signed in as ${name ?? ""}`}
        actions={<StatusBadge status={statusLabel(d.institution?.registration_status)} />}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Residents" value={String(residentTotal)} icon={<Users className="size-4" />} />
        <StatCard label="Total Cases Logged" value={String(m.case_total ?? 0)} icon={<ClipboardList className="size-4" />} />
        <StatCard
          label="Expired Documents"
          value={String(d.expired_documents ?? 0)}
          tone={d.expired_documents ? "warn" : "ok"}
          delta={d.expired_documents ? "Renewal required" : "All current"}
          icon={<FileWarning className="size-4" />}
        />
        <StatCard
          label="Consultant Docs Expiring"
          value={String(m.expiring_consultant_documents ?? 0)}
          tone={m.expiring_consultant_documents ? "warn" : "ok"}
          delta={`${m.expired_consultant_documents ?? 0} already expired`}
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cases by Type</CardTitle>
            <CardDescription>Aggregated case log volume for this institution</CardDescription>
          </CardHeader>
          <CardContent>
            {byType.length === 0 ? (
              <Empty>No case logs encoded yet.</Empty>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byType} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 4, fontSize: 12, border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {byType.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#0f172a" : "#93c5fd"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accreditation</CardTitle>
            <CardDescription>Most recent submission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!latest ? (
              <Empty>No accreditation submitted yet.</Empty>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[13px]">Status</span>
                  <StatusBadge status={statusLabel(latest.status)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px]">Valid from</span>
                  <span className="data-mono">{latest.valid_from ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px]">Valid until</span>
                  <span className="data-mono">{latest.valid_until ?? "—"}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[13px]">Unread notifications</span>
              <Badge variant={d.unread_notifications ? "pending" : "default"}>
                {d.unread_notifications}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Breakdown title="Residents by Track" data={toSeries(m.residents_by_track)} format={trackLabel} />
        <Breakdown title="Residents by Year Level" data={byYear} format={(k) => (k ? `Year ${k}` : "Unassigned")} />
        <Breakdown title="Promotion Status" data={toSeries(m.promotion_statuses)} format={statusLabel} status />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Breakdown
          title="Assessment Averages"
          data={toSeries(m.assessment_averages).map((x) => ({ ...x, value: Math.round(x.value * 10) / 10 }))}
          format={statusLabel}
        />
        <Breakdown title="Rotation Assignments" data={toSeries(m.rotation_assignments)} format={statusLabel} status />
      </div>
    </>
  )
}

function Breakdown({
  title,
  data,
  format,
  status,
}: {
  title: string
  data: { name: string; value: number }[]
  format: (k: string) => string
  status?: boolean
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {data.length === 0 && <Empty>No data.</Empty>}
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            {status ? (
              <StatusBadge status={format(d.name)} />
            ) : (
              <span className="text-[13px]">{format(d.name)}</span>
            )}
            <span className="data-mono font-semibold">{d.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
