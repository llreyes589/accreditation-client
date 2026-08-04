import * as React from "react"
import { Search } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/badge"
import { Loading, ErrorState, Empty } from "@/components/states"
import { usePublicInstitutions } from "@/api/hooks"

export default function InstitutionsPage() {
  const q = usePublicInstitutions()
  const [search, setSearch] = React.useState("")

  if (q.isLoading) return <Loading label="Loading institutions…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []
  const rows = all.filter((i) =>
    `${i.name} ${i.address ?? ""}`.toLowerCase().includes(search.toLowerCase())
  )
  const levels = new Set(all.map((i) => i.hospital_level).filter(Boolean))

  return (
    <>
      <PageHeader
        title="Institutions"
        description="Approved training institutions in the national registry"
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Approved Institutions" value={String(all.length)} tone="ok" />
        <StatCard label="Hospital Levels" value={String(levels.size)} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Institution Registry</CardTitle>
          <CardDescription>Only approved institutions are publicly listed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or address…"
              className="pl-8"
            />
          </div>

          {rows.length === 0 ? (
            <Empty>No institutions match your search.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Hospital Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <p className="font-semibold">{i.name}</p>
                      <p className="data-mono text-slate-400">INS-{i.id}</p>
                    </TableCell>
                    <TableCell className="text-slate-600">{i.address ?? "—"}</TableCell>
                    <TableCell className="text-slate-600">{i.hospital_level ?? "—"}</TableCell>
                    <TableCell><StatusBadge status="Approved" /></TableCell>
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
