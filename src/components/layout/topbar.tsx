import * as React from "react"
import { Menu, Bell, LogOut, Check } from "lucide-react"
import { useLocation } from "react-router-dom"
import { Avatar } from "@/components/ui/primitives"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth"
import { useNotifications, useReadNotification } from "@/api/hooks"
import { roleLabel } from "@/api/types"
import { cn } from "@/lib/utils"

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const { user, roles, signOut } = useAuth()
  const notifs = useNotifications()
  const read = useReadNotification()
  const [open, setOpen] = React.useState(false)

  const items = notifs.data?.data ?? []
  const unread = items.filter((n) => !n.read_at).length
  const crumb = pathname === "/" ? "Dashboard" : pathname.replace(/^\//, "").replace(/-/g, " ")

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button className="text-slate-500 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-5" />
      </button>

      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {crumb}
      </span>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <div className="relative">
          <button
            className="relative grid size-9 place-items-center rounded text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
            onClick={() => setOpen((v) => !v)}
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] rounded border border-slate-200 bg-white elev-2">
                <div className="border-b border-slate-200 px-3 py-2">
                  <p className="text-[13px] font-semibold">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {items.length === 0 && (
                    <p className="px-3 py-6 text-center text-[13px] text-slate-500">
                      No notifications.
                    </p>
                  )}
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-2 border-b border-slate-100 px-3 py-2.5 last:border-0",
                        !n.read_at && "bg-blue-50/40"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">
                          {String(n.data?.title ?? n.type.split("\\").pop())}
                        </p>
                        {n.data?.message ? (
                          <p className="text-[12px] text-slate-500">{String(n.data.message)}</p>
                        ) : null}
                        <p className="data-mono text-slate-400">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.read_at && (
                        <button
                          className="text-slate-400 hover:text-brand"
                          onClick={() => read.mutate(n.id)}
                          aria-label="Mark read"
                        >
                          <Check className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
          <Avatar name={user?.name || "?"} />
          <div className="hidden leading-tight lg:block">
            <p className="text-[12px] font-bold">{user?.name}</p>
            <p className="text-[11px] text-slate-500">
              {roles.map(roleLabel).join(", ") || "—"}
            </p>
          </div>
          {user?.status && user.status !== "approved" && (
            <Badge variant="pending">{user.status}</Badge>
          )}
        </div>

        <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sign out">
          <LogOut />
        </Button>
      </div>
    </header>
  )
}
