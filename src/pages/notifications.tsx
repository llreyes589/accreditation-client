import * as React from "react"
import { Check, Clock } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { Loading, ErrorState, Empty } from "@/components/states"
import { useNotifications, useReadNotification, useNotificationPreferences, useUpdateNotificationPreferences } from "@/api/hooks"
import type { NotificationPreference } from "@/api/types"

const CATEGORIES: NotificationPreference["category"][] = ["deadline_reminder", "status_change", "system"]
const CHANNELS: NotificationPreference["channel"][] = ["database", "email", "in_app"]

const categoryLabel = (c: string) =>
  c === "deadline_reminder" ? "Deadline reminders" : c === "status_change" ? "Status changes" : "System"

function NotificationsList() {
  const q = useNotifications()
  const read = useReadNotification()

  if (q.isLoading) return <Loading label="Loading notifications…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const items = q.data?.data ?? []
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[15px]">In-app notifications</CardTitle>
        <CardDescription>Click an item to mark it read. Unread items are highlighted.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <Empty>No notifications yet.</Empty>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={
                "flex items-start justify-between gap-3 rounded-lg border p-3 " +
                (n.read_at ? "border-slate-200 bg-white" : "border-brand/30 bg-brand/5")
              }
            >
              <div>
                <p className="text-[13px] font-medium text-slate-800">
                  {(n.data as { title?: string; type?: string })?.title ?? n.type}
                </p>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  {new Date(n.created_at).toLocaleString()}
                  {n.read_at && <span className="ml-2 text-slate-400">· read</span>}
                </p>
              </div>
              {!n.read_at && (
                <Button size="sm" variant="outline" onClick={() => read.mutate(n.id)} disabled={read.isPending}>
                  <Check className="mr-1 size-3.5" /> Mark read
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function PreferencesEditor() {
  const q = useNotificationPreferences()
  const save = useUpdateNotificationPreferences()
  const [draft, setDraft] = React.useState<NotificationPreference[]>([])
  const [err, setErr] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (q.data) setDraft(q.data)
  }, [q.data])

  if (q.isLoading) return <Loading label="Loading preferences…" />
  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />

  const update = (idx: number, patch: Partial<NotificationPreference>) =>
    setDraft((d) => d.map((row, i) => (i === idx ? { ...row, ...patch } : row)))

  const submit = async () => {
    setErr(null)
    try {
      await save.mutateAsync(
        draft.map((p) => ({
          category: p.category,
          channel: p.channel,
          enabled: p.enabled,
          quiet_hours_start: p.quiet_hours_start,
          quiet_hours_end: p.quiet_hours_end,
        })),
      )
    } catch (e) {
      setErr((e as { message: string }).message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[15px]">Notification preferences</CardTitle>
        <CardDescription>
          Opt out of a category per channel, or set quiet hours during which non-urgent
          notifications are suppressed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-[13px] font-medium text-slate-700">{categoryLabel(cat)}</p>
            <div className="space-y-2">
              {CHANNELS.map((ch) => {
                const row = draft.find((d) => d.category === cat && d.channel === ch)
                const idx = draft.findIndex((d) => d.category === cat && d.channel === ch)
                if (!row) return null
                return (
                  <div key={ch} className="flex flex-wrap items-center gap-3 rounded bg-slate-50 px-2 py-1.5">
                    <span className="w-20 text-[12px] capitalize text-slate-600">{ch}</span>
                    <label className="flex items-center gap-1.5 text-[12px] text-slate-600">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) => update(idx, { enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3.5 text-slate-400" />
                      <Label className="text-[11px]">Quiet</Label>
                      <Input
                        type="time"
                        className="h-7 w-24 text-[12px]"
                        value={row.quiet_hours_start ?? ""}
                        onChange={(e) => update(idx, { quiet_hours_start: e.target.value || null })}
                      />
                      <span className="text-[11px] text-slate-400">–</span>
                      <Input
                        type="time"
                        className="h-7 w-24 text-[12px]"
                        value={row.quiet_hours_end ?? ""}
                        onChange={(e) => update(idx, { quiet_hours_end: e.target.value || null })}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {err && <p className="text-[12px] text-red-600">{err}</p>}
        <div className="flex justify-end">
          <Button onClick={submit} disabled={save.isPending}>
            Save preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Stay informed about deadlines, status changes, and system events."
      />
      <NotificationsList />
      <PreferencesEditor />
    </div>
  )
}
