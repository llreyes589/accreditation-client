import { Check, X } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useIncomingTransfers, useAcceptTransfer, useRejectTransfer } from "@/api/hooks"
import { trackLabel, statusLabel } from "@/api/types"

export default function TransfersPage() {
  const q = useIncomingTransfers()
  const accept = useAcceptTransfer()
  const reject = useRejectTransfer()

  if (q.isLoading) return <Loading label="Loading transfer requests…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const all = q.data ?? []

  return (
    <>
      <PageHeader
        title="Resident Transfers"
        description="Incoming requests from other institutions awaiting your decision"
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Incoming Pending" value={String(all.length)} tone={all.length ? "warn" : "neutral"} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Incoming Transfers</CardTitle>
          <CardDescription>Accepting moves the resident into your institution immediately</CardDescription>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <Empty>No incoming transfer requests.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Disposition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="font-semibold">
                        {t.resident?.user?.name ?? `Resident #${t.resident_id}`}
                      </p>
                      <p className="data-mono text-slate-400">TRF-{t.id}</p>
                    </TableCell>
                    <TableCell className="text-slate-600">{trackLabel(t.resident?.track)}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-slate-600">{t.reason ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={statusLabel(t.status)} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline" size="sm"
                          disabled={reject.isPending}
                          onClick={() => reject.mutate(t.id)}
                        >
                          <X /> Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={accept.isPending}
                          onClick={() => accept.mutate(t.id)}
                        >
                          <Check /> Accept
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
    </>
  )
}
