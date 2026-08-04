import * as React from "react"
import { Save, Loader2, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label, Select, Textarea } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUpdateSettings } from "@/api/hooks"
import { ApiError } from "@/api/client"

export default function SettingsPage() {
  const mut = useUpdateSettings()
  const [err, setErr] = React.useState<string | null>(null)
  const [ok, setOk] = React.useState(false)

  const [years, setYears] = React.useState<"1" | "3">("1")
  const [durations, setDurations] = React.useState(
    JSON.stringify({ AP: 3, CP: 3, AP_CP: 4 }, null, 2)
  )
  const [thresholds, setThresholds] = React.useState(
    JSON.stringify({ AP_CP: { "1": { quiz: 75, exam: 80 } } }, null, 2)
  )

  async function save() {
    setErr(null)
    setOk(false)
    try {
      const payload: Parameters<typeof mut.mutateAsync>[0] = {
        accreditation_years: Number(years) as 1 | 3,
      }
      if (durations.trim()) payload.track_durations = JSON.parse(durations)
      if (thresholds.trim()) payload.promotion_thresholds = JSON.parse(thresholds)
      await mut.mutateAsync(payload)
      setOk(true)
    } catch (e) {
      if (e instanceof SyntaxError) setErr("Invalid JSON — check your syntax.")
      else setErr(e instanceof ApiError ? e.firstError : "Failed to save settings.")
    }
  }

  return (
    <>
      <PageHeader
        title="System Settings"
        description="Global rules applied across all institutions"
        actions={
          <Button size="sm" onClick={save} disabled={mut.isPending}>
            {mut.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save settings
          </Button>
        }
      />

      {err && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>
      )}
      {ok && (
        <p className="mb-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
          <CheckCircle2 className="size-4" /> Settings saved.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Accreditation Term</CardTitle>
            <CardDescription>Validity granted on approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Label>Years</Label>
            <Select value={years} onChange={(e) => setYears(e.target.value as "1" | "3")}>
              <option value="1">1 year</option>
              <option value="3">3 years</option>
            </Select>
            <p className="pt-1 text-[12px] text-slate-500">
              Backend accepts only 1 or 3.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Track Durations</CardTitle>
            <CardDescription>Caps the computed resident year level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Label>track_durations (JSON)</Label>
            <Textarea
              rows={8}
              className="font-mono text-[12px]"
              value={durations}
              onChange={(e) => setDurations(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promotion Thresholds</CardTitle>
            <CardDescription>track → year level → assessment type → score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Label>promotion_thresholds (JSON)</Label>
            <Textarea
              rows={8}
              className="font-mono text-[12px]"
              value={thresholds}
              onChange={(e) => setThresholds(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>How thresholds are applied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-[13px] text-slate-600">
          <p>
            When a Training Officer records a quiz or exam result, the backend looks up{" "}
            <code className="data-mono">promotion_thresholds.&lt;track&gt;.&lt;year_level&gt;.&lt;type&gt;</code>.
          </p>
          <p>
            If a threshold exists, the resident's <code className="data-mono">promotion_status</code>{" "}
            is set to <strong>eligible</strong> when the score meets or exceeds it, otherwise{" "}
            <strong>ineligible</strong>, and the evaluation timestamp is stamped.
          </p>
          <p className="text-slate-500">
            Example: <code className="data-mono">{`{"AP_CP": {"1": {"quiz": 75, "exam": 80}}}`}</code>
          </p>
        </CardContent>
      </Card>
    </>
  )
}
